"""Resource namespaces for QbiqueClient."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from qbique._http import HttpClient


class _BaseResource:
    """Base for all resource namespaces."""

    def __init__(self, http: HttpClient):
        self._http = http


class StrategyResource(_BaseResource):
    """Strategy management — qbique strategy *"""

    def list(self) -> dict:
        """List available optimization methods."""
        return self._http.get("/api/optimization/methods")

    def show(self, problem_id: int) -> dict:
        """Show optimization problem details."""
        return self._http.get(f"/api/onboarding/problem/{problem_id}")

    def create(self, spec: dict) -> dict:
        """Create an optimization problem from a strategy spec."""
        return self._http.post("/api/cli/strategy/create", json=spec)

    def validate(self, spec: dict) -> dict:
        """Validate a strategy spec without creating it."""
        return self._http.post("/api/cli/strategy/validate", json=spec)

    def push(
        self,
        name: str,
        strategy_yaml: str,
        spec: dict,
        *,
        description: str = "",
        tag: str | None = None,
        source_file: str | None = None,
    ) -> dict:
        """Push a strategy to the server."""
        return self._http.post("/api/cli/strategy/push", json={
            "name": name,
            "description": description,
            "tag": tag,
            "source_file": source_file,
            "strategy_yaml": strategy_yaml,
            "spec": spec,
        })

    def versions(self, strategy_id: int) -> dict:
        """List version history of a strategy."""
        return self._http.get(f"/api/cli/strategy/{strategy_id}/versions")


class OptimizeResource(_BaseResource):
    """Portfolio optimization — qbique optimize *"""

    def run(
        self,
        problem_id: int,
        *,
        engine: str = "classical",
        greedy: bool = False,
        tickers: list[str] | None = None,
        use_cache: bool = True,
        timeout: int = 300,
    ) -> dict:
        """Run portfolio optimization."""
        if greedy:
            return self._http.post(
                "/api/optimization/greedy-cluster",
                json={"request_id": problem_id},
            )
        return self._http.post(
            "/api/optimization/execute",
            json={
                "problem_id": problem_id,
                "asset_tickers": tickers,
                "use_cache": use_cache,
            },
        )

    def status(self, job_id: str) -> dict:
        """Check optimization job status."""
        return self._http.get(f"/api/optimization/status/{job_id}")

    def frontier(self, request_id: str, *, n_points: int = 50) -> dict:
        """Get efficient frontier."""
        return self._http.post(
            "/api/optimization/efficient-frontier",
            json={"request_id": request_id, "n_points": n_points},
        )


class BacktestResource(_BaseResource):
    """Backtesting — qbique backtest *"""

    def run(
        self,
        *,
        tickers: list[str],
        start: str,
        end: str,
        schedule: str = "calendar",
        freq: str = "quarterly",
        drift_threshold: float = 5.0,
        benchmark: str = "KOSPI",
        capital: int = 100_000_000,
    ) -> dict:
        """Run a portfolio backtest."""
        return self._http.post("/api/backtest/run", json={
            "tickers": tickers,
            "start_date": start,
            "end_date": end,
            "schedule_type": schedule,
            "calendar_freq": freq,
            "drift_threshold": drift_threshold,
            "benchmark": benchmark,
            "initial_capital": capital,
        })

    def status(self, job_id: str) -> dict:
        """Check backtest job status."""
        return self._http.get(f"/api/backtest/status/{job_id}")

    def results(self, job_id: str) -> dict:
        """Get backtest results."""
        return self._http.get(f"/api/backtest/results/{job_id}")

    def compare(self, id_a: str, id_b: str) -> dict:
        """Compare two backtest results (client-side)."""
        a = self.results(id_a)
        b = self.results(id_b)
        return {"backtest_a": a, "backtest_b": b}


class DataResource(_BaseResource):
    """Market data — qbique data *"""

    def search(self, query: str, *, limit: int = 10) -> dict:
        """Search tickers by name or code."""
        return self._http.post("/api/optimization/search-tickers", json={
            "query": query,
            "limit": limit,
        })

    def validate(self, tickers: list[str]) -> dict:
        """Validate ticker codes."""
        return self._http.post("/api/optimization/validate-tickers", json={
            "tickers": tickers,
        })

    def fetch(
        self,
        *,
        universe: str | None = None,
        tickers: list[str] | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> dict:
        """Fetch market data."""
        payload: dict = {}
        if universe:
            payload["universe"] = universe
        if tickers:
            payload["tickers"] = tickers
        if start_date:
            payload["start_date"] = start_date
        if end_date:
            payload["end_date"] = end_date
        return self._http.post("/api/cli/data/fetch", json=payload)

    def export(
        self,
        dataset: str,
        *,
        tickers: list[str] | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        format: str = "json",
    ) -> dict:
        """Export data from the platform."""
        payload: dict = {"dataset": dataset, "format": format}
        if tickers:
            payload["tickers"] = tickers
        if start_date:
            payload["start_date"] = start_date
        if end_date:
            payload["end_date"] = end_date
        return self._http.post("/api/cli/data/export", json=payload)

    def import_data(self, dataset: str, data: list[dict] | dict, *, metadata: dict | None = None) -> dict:
        """Import local data via API."""
        return self._http.post("/api/cli/data/import", json={
            "dataset": dataset,
            "data": data,
            "metadata": metadata,
        })


class PortfolioResource(_BaseResource):
    """Portfolio monitoring — qbique portfolio *"""

    def summary(self, portfolio_id: str) -> dict:
        """Get portfolio summary."""
        return self._http.get(f"/api/portfolio/{portfolio_id}/summary")

    def drift(self, portfolio_id: str) -> dict:
        """Check portfolio drift."""
        return self._http.get(f"/api/portfolio/{portfolio_id}/drift")

    def pnl(self, portfolio_id: str) -> dict:
        """Get portfolio P&L."""
        return self._http.get(f"/api/portfolio/{portfolio_id}/pnl")


class ContractResource(_BaseResource):
    """Contract management — qbique contract *"""

    def list(self) -> dict:
        """List contracts."""
        return self._http.get("/api/contracts")

    def status(self, contract_id: str) -> dict:
        """Check contract status."""
        return self._http.get(f"/api/contracts/{contract_id}")


class HealthResource(_BaseResource):
    """Server health — qbique health"""

    def check(self) -> dict:
        """Check backend health."""
        return self._http.get("/api/health")

    def version(self) -> dict:
        """Get server version."""
        return self._http.get("/api/version")
