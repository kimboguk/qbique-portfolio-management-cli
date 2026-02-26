"""
qbique-strategy — Write custom portfolio strategies in Python.

Usage::

    from qbique_strategy import BaseStrategy, Signal, MarketData, SignalDirection

    class MyStrategy(BaseStrategy):
        def generate_signals(self, market_data, rebalance_date):
            signals = []
            for ticker in market_data.tickers:
                mom = market_data.calculate_momentum(ticker, period=20)
                if mom > 0:
                    signals.append(Signal(ticker=ticker, score=mom))
            return signals
"""

from .base import BaseStrategy
from .data import MarketData
from .signal import Signal, SignalDirection
from .validator import ValidationResult, validate_strategy_code, detect_class_name

__all__ = [
    "BaseStrategy",
    "MarketData",
    "Signal",
    "SignalDirection",
    "ValidationResult",
    "validate_strategy_code",
    "detect_class_name",
]
