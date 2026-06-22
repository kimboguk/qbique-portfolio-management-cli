"""Live integration tests (Option B) — exercise the SDK against a running
dev backend (onboarding-be gateway, default http://localhost:9001).

The gateway fronts every route the SDK uses and proxies optimization/backtest
compute to optimization_engine (9002) internally, so a single endpoint is enough.

These tests are SKIPPED automatically when the backend is unreachable, so the
default unit run stays green without a live server. To run them explicitly:

    QBIQUE_ENDPOINT=http://localhost:9001 pytest tests/test_integration.py -v

Scope (first cut): read-only smoke over the endpoints touched by the recent
path-mismatch fix plus the core read surface. The write/compute E2E flow
(strategy.create -> optimize.run -> backtest) is a follow-up once spec
fixtures are settled.
"""

import os

import httpx
import pytest

from qbique import QbiqueClient

ENDPOINT = os.environ.get("QBIQUE_ENDPOINT", "http://localhost:9001")
API_KEY = os.environ.get("QBIQUE_API_KEY", "qbi_test")


def _backend_up() -> bool:
    try:
        return httpx.get(f"{ENDPOINT}/health", timeout=3.0).status_code == 200
    except (httpx.ConnectError, httpx.TimeoutException):
        return False


pytestmark = pytest.mark.skipif(
    not _backend_up(),
    reason=f"dev backend not reachable at {ENDPOINT} (start onboarding-be on 9001)",
)


@pytest.fixture(scope="module")
def client():
    c = QbiqueClient(api_key=API_KEY, endpoint=ENDPOINT)
    yield c
    c.close()


# --- endpoints corrected by the path-mismatch fix -------------------------

def test_health_check(client):
    """health.check -> GET /health (was /api/health, 404)."""
    assert isinstance(client.health.check(), dict)


def test_health_version(client):
    """health.version -> GET /api/version/current (was /api/version, 404)."""
    assert isinstance(client.health.version(), dict)


def test_contract_list(client):
    """contract.list -> GET /api/contracts/list (was /api/contracts, 404).

    Route response_model is list[ContractStatusResponse], so a JSON array.
    """
    assert isinstance(client.contract.list(), (dict, list))


# --- core read surface ----------------------------------------------------

def test_strategy_list(client):
    """strategy.list -> GET /api/optimization/methods."""
    assert isinstance(client.strategy.list(), dict)


def test_data_validate(client):
    """data.validate -> POST /api/optimization/validate-tickers."""
    assert isinstance(client.data.validate(["AAPL", "MSFT"]), dict)
