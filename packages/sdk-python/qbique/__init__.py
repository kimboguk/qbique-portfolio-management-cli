"""
Qbique Python SDK
Portfolio optimization platform client for Python and Jupyter.

Usage:
    from qbique import QbiqueClient

    client = QbiqueClient(api_key="qbi_xxx")
    result = client.strategy.list()
    result = client.data.fetch(universe="KOSPI")
    result = client.backtest.run(tickers=["005930", "000660"], start="2023-01-01", end="2024-12-31")
"""

from qbique.client import QbiqueClient
from qbique.exceptions import (
    QbiqueError,
    AuthenticationError,
    NotFoundError,
    ValidationError,
    ServerError,
    ConnectionError,
)

__version__ = "0.1.0"
__all__ = [
    "QbiqueClient",
    "QbiqueError",
    "AuthenticationError",
    "NotFoundError",
    "ValidationError",
    "ServerError",
    "ConnectionError",
]
