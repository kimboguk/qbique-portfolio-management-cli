# Qbique Python SDK

Portfolio optimization platform client for Python and Jupyter.

## Install

```bash
pip install qbique
```

## Usage

```python
from qbique import QbiqueClient

client = QbiqueClient(api_key="qbi_xxx")

# Fetch data
data = client.data.fetch(universe="KOSPI", start_date="2024-01-01")

# Run backtest
result = client.backtest.run(
    tickers=["005930", "000660"],
    start="2023-01-01",
    end="2024-12-31",
)

# Optimize
result = client.optimize.run(problem_id=1)
```

## License

Apache License 2.0
