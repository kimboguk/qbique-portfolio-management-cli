"""
Signal — 전략이 생성하는 투자 시그널 데이터 클래스
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class SignalDirection(Enum):
    """시그널 방향"""
    LONG = "long"
    SHORT = "short"
    NEUTRAL = "neutral"


@dataclass
class Signal:
    """
    전략이 생성하는 개별 종목 시그널.

    Attributes:
        ticker: 종목 코드
        score: 시그널 강도 (높을수록 강한 시그널)
        direction: 시그널 방향 (LONG / SHORT / NEUTRAL)
        weight: 명시적 비중 (0~1). None이면 score 기반 자동 계산.
        metadata: 디버깅/로깅용 메타데이터
    """
    ticker: str
    score: float
    direction: SignalDirection = SignalDirection.LONG
    weight: Optional[float] = None
    metadata: Optional[dict] = field(default=None)

    def __post_init__(self) -> None:
        if self.weight is not None and not (0.0 <= self.weight <= 1.0):
            raise ValueError(f"weight must be between 0 and 1, got {self.weight}")
        if not self.ticker:
            raise ValueError("ticker must not be empty")
