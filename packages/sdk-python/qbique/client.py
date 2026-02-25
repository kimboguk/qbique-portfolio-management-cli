"""
QbiqueClient — Main entry point for the Qbique Python SDK.

Usage:
    from qbique import QbiqueClient

    client = QbiqueClient(api_key="qbi_xxx")
    client = QbiqueClient(api_key="qbi_xxx", endpoint="http://10.0.0.5:8001")

    # Strategy
    client.strategy.list()
    client.strategy.create(spec={...})
    client.strategy.push("my_strategy", yaml_content, spec)

    # Optimization
    client.optimize.run(problem_id=1)
    client.optimize.run(problem_id=1, engine="quantum")

    # Backtesting
    client.backtest.run(tickers=["005930"], start="2023-01-01", end="2024-12-31")
    client.backtest.results("job-id")

    # Data
    client.data.fetch(universe="KOSPI")
    client.data.search("삼성")
    client.data.export("prices", tickers=["005930"], format="csv")

    # Portfolio
    client.portfolio.summary("p1")

    # Health
    client.health.check()
"""

from __future__ import annotations

from qbique._http import HttpClient
from qbique._resources import (
    StrategyResource,
    OptimizeResource,
    BacktestResource,
    DataResource,
    PortfolioResource,
    ContractResource,
    HealthResource,
)


class QbiqueClient:
    """Qbique platform API client.

    Args:
        api_key: API key for authentication (qbi_xxx format).
        endpoint: Backend server URL (default: http://localhost:8001).
        timeout: Request timeout in seconds (default: 30).
    """

    def __init__(
        self,
        api_key: str,
        endpoint: str = "http://localhost:8001",
        timeout: float = 30.0,
    ):
        self._http = HttpClient(base_url=endpoint, api_key=api_key, timeout=timeout)

        # Resource namespaces
        self.strategy = StrategyResource(self._http)
        self.optimize = OptimizeResource(self._http)
        self.backtest = BacktestResource(self._http)
        self.data = DataResource(self._http)
        self.portfolio = PortfolioResource(self._http)
        self.contract = ContractResource(self._http)
        self.health = HealthResource(self._http)

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self._http.close()

    def __enter__(self) -> QbiqueClient:
        return self

    def __exit__(self, *args) -> None:
        self.close()

    def __repr__(self) -> str:
        return f"QbiqueClient(endpoint={self._http._client.base_url!r})"
