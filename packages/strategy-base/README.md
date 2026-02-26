# qbique-strategy

Write custom portfolio optimization strategies in Python for the Qbique platform.

## Installation

```bash
pip install qbique-strategy
```

## Quick Start

```python
from datetime import date
from typing import List
from qbique_strategy import BaseStrategy, Signal, MarketData, SignalDirection

class MomentumStrategy(BaseStrategy):
    def generate_signals(self, market_data: MarketData, rebalance_date: date) -> List[Signal]:
        signals = []
        period = self.params.get("period", 20)
        for ticker in market_data.tickers:
            mom = market_data.calculate_momentum(ticker, period)
            if mom > 0:
                signals.append(Signal(ticker=ticker, score=mom))
        return signals

    def risk_constraints(self) -> dict:
        return {"max_weight": 0.2, "min_weight": 0.01}
```

## Usage with Qbique CLI

```bash
# Validate strategy
qbique strategy validate -f momentum.py

# Push to server
qbique strategy push momentum.py --name "Momentum20"

# Run backtest
qbique backtest run --strategy momentum.py --start 2023-01-01 --end 2024-12-31
```

## API Reference

### `BaseStrategy`

Abstract base class. Implement `generate_signals()` to create a strategy.

- `generate_signals(market_data, rebalance_date) -> List[Signal]` — **required**
- `risk_constraints() -> dict` — optional risk limits
- `on_rebalance_complete(date, weights, value)` — optional post-rebalance hook

### `Signal`

Dataclass representing a single-ticker investment signal.

- `ticker: str` — ticker code
- `score: float` — signal strength (higher = stronger)
- `direction: SignalDirection` — LONG / SHORT / NEUTRAL
- `weight: Optional[float]` — explicit weight override (0–1)
- `metadata: Optional[dict]` — debugging info

### `MarketData`

Wrapper around price data provided to strategies.

- `prices: pd.DataFrame` — close prices (dates x tickers)
- `returns: pd.DataFrame` — daily simple returns
- `tickers: List[str]` — available tickers
- `calculate_momentum(ticker, period=20) -> float`
- `calculate_volatility(ticker, period=20) -> float`
- `get_ticker_data(ticker) -> pd.DataFrame`

## License

Apache-2.0
