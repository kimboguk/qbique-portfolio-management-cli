"""
Momentum Strategy Example

20일 모멘텀이 양수인 종목에 모멘텀 비례 비중 투자.
"""
from datetime import date
from typing import List

from qbique_strategy import BaseStrategy, MarketData, Signal, SignalDirection


class MomentumStrategy(BaseStrategy):
    """단순 모멘텀 전략"""

    def generate_signals(self, market_data: MarketData, rebalance_date: date) -> List[Signal]:
        period = self.params.get("period", 20)
        signals: List[Signal] = []

        for ticker in market_data.tickers:
            mom = market_data.calculate_momentum(ticker, period)
            if mom > 0:
                signals.append(
                    Signal(
                        ticker=ticker,
                        score=mom,
                        direction=SignalDirection.LONG,
                        metadata={"momentum": mom, "period": period},
                    )
                )

        return signals

    def risk_constraints(self) -> dict:
        return {
            "max_weight": self.params.get("max_weight", 0.2),
            "min_weight": 0.01,
        }
