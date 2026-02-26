"""
Mean Reversion Strategy Example

이동평균 대비 가격 괴리도 기반 역추세 전략.
가격이 이동평균보다 낮으면 매수 시그널 (저평가 기대).
"""
from datetime import date
from typing import List

import numpy as np

from qbique_strategy import BaseStrategy, MarketData, Signal, SignalDirection


class MeanReversionStrategy(BaseStrategy):
    """이동평균 회귀 전략"""

    def generate_signals(self, market_data: MarketData, rebalance_date: date) -> List[Signal]:
        ma_period = self.params.get("ma_period", 50)
        threshold = self.params.get("threshold", -0.05)  # -5% 이하면 매수
        signals: List[Signal] = []

        for ticker in market_data.tickers:
            prices = market_data.prices[ticker].dropna()
            if len(prices) < ma_period + 1:
                continue

            ma = prices.iloc[-ma_period:].mean()
            current_price = prices.iloc[-1]
            deviation = (current_price - ma) / ma

            if deviation < threshold:
                # 괴리도가 클수록 높은 점수
                score = abs(deviation)
                signals.append(
                    Signal(
                        ticker=ticker,
                        score=score,
                        direction=SignalDirection.LONG,
                        metadata={"deviation": float(deviation), "ma": float(ma)},
                    )
                )

        return signals

    def risk_constraints(self) -> dict:
        return {
            "max_weight": self.params.get("max_weight", 0.15),
            "min_weight": 0.01,
            "max_positions": self.params.get("max_positions", 15),
        }
