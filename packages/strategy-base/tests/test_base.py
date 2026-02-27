"""BaseStrategy / MarketData 통합 테스트"""
from datetime import date
from typing import List

import numpy as np
import pandas as pd
import pytest

from qbique_strategy import BaseStrategy, MarketData, Signal, SignalDirection


# ── 테스트용 전략 구현 ──


class SimpleStrategy(BaseStrategy):
    """테스트용 단순 전략"""

    def generate_signals(self, market_data: MarketData, rebalance_date: date) -> List[Signal]:
        signals = []
        for ticker in market_data.tickers:
            mom = market_data.calculate_momentum(ticker, self.params.get("period", 5))
            signals.append(Signal(ticker=ticker, score=max(mom, 0.01)))
        return signals


class ConstrainedStrategy(BaseStrategy):
    """risk_constraints 구현 전략"""

    def generate_signals(self, market_data: MarketData, rebalance_date: date) -> List[Signal]:
        return [Signal(ticker=t, score=1.0) for t in market_data.tickers]

    def risk_constraints(self) -> dict:
        return {"max_weight": 0.25, "min_weight": 0.05}


# ── 헬퍼 ──


def _make_prices(tickers: List[str], days: int = 60) -> pd.DataFrame:
    """테스트용 가격 데이터 생성"""
    np.random.seed(42)
    dates = pd.bdate_range(start=date(2024, 4, 1), periods=days)
    data = {}
    for t in tickers:
        # 간단한 랜덤 워크
        returns = np.random.normal(0.001, 0.02, days)
        prices = 100 * np.cumprod(1 + returns)
        data[t] = prices
    return pd.DataFrame(data, index=dates)


# ── 테스트 ──


class TestBaseStrategy:
    def test_cannot_instantiate_abstract(self):
        with pytest.raises(TypeError):
            BaseStrategy()  # type: ignore[abstract]

    def test_simple_strategy(self):
        prices = _make_prices(["A", "B", "C"])
        md = MarketData(prices)
        strat = SimpleStrategy(params={"period": 5})
        signals = strat.generate_signals(md, date(2024, 6, 30))
        assert len(signals) == 3
        assert all(isinstance(s, Signal) for s in signals)

    def test_params_default_empty(self):
        strat = SimpleStrategy()
        assert strat.params == {}

    def test_risk_constraints_default_empty(self):
        strat = SimpleStrategy()
        assert strat.risk_constraints() == {}

    def test_risk_constraints_override(self):
        strat = ConstrainedStrategy()
        rc = strat.risk_constraints()
        assert rc["max_weight"] == 0.25
        assert rc["min_weight"] == 0.05

    def test_on_rebalance_complete_noop(self):
        strat = SimpleStrategy()
        strat.on_rebalance_complete(date(2024, 6, 30), {"A": 0.5, "B": 0.5}, 100_000_000)


class TestMarketData:
    def test_basic_properties(self):
        prices = _make_prices(["X", "Y"])
        md = MarketData(prices)
        assert md.tickers == ["X", "Y"]
        assert md.start_date is not None
        assert md.end_date is not None

    def test_returns_shape(self):
        prices = _make_prices(["A", "B"], days=30)
        md = MarketData(prices)
        rets = md.returns
        assert rets.shape[1] == 2
        assert rets.shape[0] == 29  # pct_change drops first row

    def test_get_ticker_data(self):
        prices = _make_prices(["A"])
        md = MarketData(prices)
        df = md.get_ticker_data("A")
        assert "price" in df.columns
        assert "return" in df.columns

    def test_get_ticker_data_missing(self):
        prices = _make_prices(["A"])
        md = MarketData(prices)
        with pytest.raises(KeyError, match="Ticker 'Z' not found"):
            md.get_ticker_data("Z")

    def test_momentum(self):
        prices = _make_prices(["A"], days=60)
        md = MarketData(prices)
        mom = md.calculate_momentum("A", 20)
        assert isinstance(mom, float)

    def test_volatility(self):
        prices = _make_prices(["A"], days=60)
        md = MarketData(prices)
        vol = md.calculate_volatility("A", 20)
        assert isinstance(vol, float)
        assert vol >= 0

    def test_empty_prices_raises(self):
        with pytest.raises(ValueError, match="must not be empty"):
            MarketData(pd.DataFrame())
