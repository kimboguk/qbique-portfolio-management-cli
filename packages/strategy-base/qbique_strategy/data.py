"""
MarketData — 전략에 전달되는 시장 데이터 래퍼
"""
from __future__ import annotations

from datetime import date
from typing import List

import numpy as np
import pandas as pd


class MarketData:
    """
    전략에 전달되는 시장 데이터.

    Backtester가 리밸런싱 시점마다 생성하여 strategy.generate_signals()에 전달.

    Attributes:
        prices: 종가 DataFrame (index=dates, columns=tickers)
        tickers: 종목 코드 리스트
        start_date: 데이터 시작일
        end_date: 데이터 종료일
    """

    def __init__(self, prices: pd.DataFrame) -> None:
        if prices.empty:
            raise ValueError("prices DataFrame must not be empty")

        self.prices: pd.DataFrame = prices
        self.tickers: List[str] = list(prices.columns)

        idx = prices.index
        self.start_date: date = idx[0].date() if hasattr(idx[0], "date") else idx[0]
        self.end_date: date = idx[-1].date() if hasattr(idx[-1], "date") else idx[-1]

    @property
    def returns(self) -> pd.DataFrame:
        """일일 단순 수익률"""
        return self.prices.pct_change().dropna()

    @property
    def volumes(self) -> pd.DataFrame:
        """거래량 (현재 미지원 — 빈 DataFrame 반환)"""
        return pd.DataFrame(index=self.prices.index, columns=self.tickers)

    def get_ticker_data(self, ticker: str) -> pd.DataFrame:
        """단일 종목의 가격/수익률 DataFrame"""
        if ticker not in self.tickers:
            raise KeyError(f"Ticker '{ticker}' not found. Available: {self.tickers}")
        price = self.prices[ticker].dropna()
        ret = price.pct_change().dropna()
        return pd.DataFrame({"price": price, "return": ret})

    def calculate_momentum(self, ticker: str, period: int = 20) -> float:
        """
        단순 모멘텀 (기간 수익률).

        Args:
            ticker: 종목 코드
            period: 기간 (거래일 수)

        Returns:
            기간 수익률
        """
        prices = self.prices[ticker].dropna()
        if len(prices) < period + 1:
            return 0.0
        return float((prices.iloc[-1] / prices.iloc[-period - 1]) - 1.0)

    def calculate_volatility(self, ticker: str, period: int = 20) -> float:
        """
        변동성 (일일 수익률의 표준편차, 연율화).

        Args:
            ticker: 종목 코드
            period: 기간 (거래일 수)

        Returns:
            연율화 변동성
        """
        rets = self.prices[ticker].pct_change().dropna()
        if len(rets) < period:
            return 0.0
        return float(rets.iloc[-period:].std() * np.sqrt(252))

    def calculate_mean_return(self, ticker: str, period: int = 20) -> float:
        """
        평균 일일 수익률.

        Args:
            ticker: 종목 코드
            period: 기간 (거래일 수)

        Returns:
            평균 일일 수익률
        """
        rets = self.prices[ticker].pct_change().dropna()
        if len(rets) < period:
            return 0.0
        return float(rets.iloc[-period:].mean())
