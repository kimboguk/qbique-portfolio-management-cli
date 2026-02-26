"""Signal / SignalDirection 테스트"""
import pytest

from qbique_strategy import Signal, SignalDirection


class TestSignalDirection:
    def test_enum_values(self):
        assert SignalDirection.LONG.value == "long"
        assert SignalDirection.SHORT.value == "short"
        assert SignalDirection.NEUTRAL.value == "neutral"


class TestSignal:
    def test_basic_creation(self):
        s = Signal(ticker="005930", score=0.15)
        assert s.ticker == "005930"
        assert s.score == 0.15
        assert s.direction == SignalDirection.LONG
        assert s.weight is None
        assert s.metadata is None

    def test_explicit_weight(self):
        s = Signal(ticker="AAPL", score=1.0, weight=0.3)
        assert s.weight == 0.3

    def test_weight_validation_too_high(self):
        with pytest.raises(ValueError, match="weight must be between 0 and 1"):
            Signal(ticker="AAPL", score=1.0, weight=1.5)

    def test_weight_validation_negative(self):
        with pytest.raises(ValueError, match="weight must be between 0 and 1"):
            Signal(ticker="AAPL", score=1.0, weight=-0.1)

    def test_weight_boundary_values(self):
        Signal(ticker="AAPL", score=1.0, weight=0.0)
        Signal(ticker="AAPL", score=1.0, weight=1.0)

    def test_empty_ticker_raises(self):
        with pytest.raises(ValueError, match="ticker must not be empty"):
            Signal(ticker="", score=1.0)

    def test_metadata(self):
        s = Signal(ticker="MSFT", score=0.5, metadata={"reason": "momentum"})
        assert s.metadata["reason"] == "momentum"

    def test_direction_short(self):
        s = Signal(ticker="TSLA", score=-0.2, direction=SignalDirection.SHORT)
        assert s.direction == SignalDirection.SHORT
