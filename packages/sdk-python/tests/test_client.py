"""Basic tests for QbiqueClient initialization and structure."""

from qbique import QbiqueClient, __version__


def test_version():
    assert __version__ == "0.1.0"


def test_client_init():
    client = QbiqueClient(api_key="qbi_test123")
    assert client.strategy is not None
    assert client.optimize is not None
    assert client.backtest is not None
    assert client.data is not None
    assert client.portfolio is not None
    assert client.contract is not None
    assert client.health is not None
    client.close()


def test_client_context_manager():
    with QbiqueClient(api_key="qbi_test123") as client:
        assert repr(client).startswith("QbiqueClient(")


def test_client_custom_endpoint():
    client = QbiqueClient(api_key="qbi_test", endpoint="http://10.0.0.5:8001", timeout=60)
    assert "10.0.0.5" in repr(client)
    client.close()
