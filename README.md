# Qbique CLI

Portfolio optimization from the command line.

## Quick Start

```bash
# Install
npm install -g @qbique/cli

# Authenticate
qbique auth login

# Check server health
qbique health

# List optimization methods
qbique strategy list

# Create a strategy from YAML
qbique strategy create -f strategy.yaml

# Run optimization
qbique optimize run --problem-id 1

# Run backtest
qbique backtest run --tickers 005930,000660 --start 2023-01-01 --end 2024-12-31

# Fetch market data
qbique data fetch --universe KOSPI --from 2024-01-01
```

## Packages

| Package | Description | Registry |
|---|---|---|
| `@qbique/cli` | CLI tool (oclif v4) | npm |
| `@qbique/sdk-node` | Node.js SDK | npm |
| `qbique` | Python SDK | PyPI |
| `@qbique/plugin-quantum` | Quantum engine plugin | npm (premium) |

## Commands

### Authentication
- `qbique auth login` — Authenticate with API key

### Configuration
- `qbique config show` — Show current configuration
- `qbique config set <key> <value>` — Set a configuration value
- `qbique config profile create|use|list|delete` — Multi-environment profiles

### Strategy
- `qbique strategy list` — List optimization methods
- `qbique strategy create -f strategy.yaml` — Create from YAML
- `qbique strategy push ./strategy.yaml` — Upload strategy to server
- `qbique strategy show <id>` — Show strategy details
- `qbique strategy validate -f strategy.yaml` — Validate without creating
- `qbique strategy versions <id>` — Version history

### Optimization
- `qbique optimize run --problem-id <id>` — Run optimization
- `qbique optimize run --problem-id <id> --engine quantum` — Use quantum engine
- `qbique optimize status <job-id>` — Check job status
- `qbique optimize frontier <request-id>` — Get efficient frontier

### Backtesting
- `qbique backtest run --tickers ... --start ... --end ...` — Run backtest
- `qbique backtest run --strategy ./momentum.yaml --start ... --end ...` — Strategy file backtest
- `qbique backtest status <job-id>` — Check status
- `qbique backtest results <job-id>` — Get results
- `qbique backtest compare <id-a> <id-b>` — Compare two backtests
- `qbique backtest report <id> --format csv` — Generate report

### Market Data
- `qbique data search <query>` — Search tickers
- `qbique data validate <tickers>` — Validate ticker codes
- `qbique data fetch --universe KOSPI` — Fetch market data
- `qbique data import -f prices.csv --dataset prices` — Import local data
- `qbique data export --dataset prices --format csv` — Export data

### Portfolio
- `qbique portfolio summary <id>` — Portfolio summary
- `qbique portfolio drift <id>` — Drift analysis
- `qbique portfolio pnl <id>` — P&L report

### Plugins
- `qbique plugins available` — List available plugins
- `qbique plugins install <name>` — Install a plugin
- `qbique license list` — List active licenses
- `qbique license activate <plugin> <key>` — Activate license

## Python SDK

```bash
pip install qbique
```

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

## Node.js SDK

```bash
npm install @qbique/sdk-node
```

```typescript
import { QbiqueClient } from '@qbique/sdk-node'

const client = new QbiqueClient({ apiKey: 'qbi_xxx' })

const methods = await client.strategy.list()
const result = await client.backtest.run({
  tickers: ['005930', '000660'],
  start: '2023-01-01',
  end: '2024-12-31',
})
```

## Configuration

Config files are stored in `~/.config/qbique/`:

- `config.json` — CLI settings (endpoint, output format, telemetry)
- `credentials.json` — API keys per profile (mode 0600)
- `licenses.json` — Plugin licenses

### Telemetry

Telemetry is opt-in and collects only: command name, execution time, success/failure, CLI version, platform. No API keys, data, or file contents are collected.

```bash
# Disable telemetry
qbique config set telemetry false
```

## License

Apache License 2.0 — see [LICENSE](LICENSE).

Premium plugins (`@qbique/plugin-quantum`, `@qbique/plugin-risk-pro`) are proprietary and require a license.
