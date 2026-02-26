"""
BaseStrategy — 커스텀 전략의 추상 기반 클래스
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date
from typing import Dict, List, Optional

from .data import MarketData
from .signal import Signal


class BaseStrategy(ABC):
    """
    모든 Python 전략의 기반 클래스.

    사용 예시::

        from qbique_strategy import BaseStrategy, Signal, MarketData, SignalDirection

        class MomentumStrategy(BaseStrategy):
            def generate_signals(self, market_data, rebalance_date):
                signals = []
                for ticker in market_data.tickers:
                    mom = market_data.calculate_momentum(ticker, self.params.get('period', 20))
                    if mom > 0:
                        signals.append(Signal(ticker=ticker, score=mom))
                return signals
    """

    def __init__(self, params: Optional[Dict] = None) -> None:
        self.params: Dict = params or {}

    @abstractmethod
    def generate_signals(
        self, market_data: MarketData, rebalance_date: date
    ) -> List[Signal]:
        """
        시장 데이터를 기반으로 투자 시그널을 생성한다.

        Args:
            market_data: 리밸런싱 시점까지의 시장 데이터
            rebalance_date: 리밸런싱 날짜

        Returns:
            종목별 시그널 리스트
        """
        ...

    def risk_constraints(self) -> Dict:
        """
        리스크 제약 조건 반환 (선택 구현).

        Returns:
            제약 조건 딕셔너리. 예:
            {
                "max_weight": 0.3,
                "min_weight": 0.01,
                "max_positions": 20,
            }
        """
        return {}

    def on_rebalance_complete(
        self,
        rebalance_date: date,
        weights: Dict[str, float],
        portfolio_value: float,
    ) -> None:
        """
        리밸런싱 완료 후 콜백 (선택 구현).

        디버깅이나 로깅 용도로 사용.

        Args:
            rebalance_date: 리밸런싱 날짜
            weights: 적용된 비중
            portfolio_value: 리밸런싱 후 포트폴리오 가치
        """
