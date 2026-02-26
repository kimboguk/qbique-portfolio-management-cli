# Tutorial 5: Python SDK로 Jupyter에서 분석하기

Qbique Python SDK를 사용하여 Jupyter Notebook에서 포트폴리오 분석을 수행하는 가이드입니다.

## 1. 설치

```bash
pip install qbique

# Jupyter 연동 (선택)
pip install qbique[jupyter]
```

## 2. 클라이언트 초기화

```python
from qbique import QbiqueClient

client = QbiqueClient(
    api_key="qbi_your_api_key",
    endpoint="http://localhost:8001",  # 기본값
)
```

Context manager도 지원합니다:

```python
with QbiqueClient(api_key="qbi_xxx") as client:
    result = client.health.check()
    print(result)
```

## 3. 전략 관리

```python
# 최적화 방법 목록
methods = client.strategy.list()

# YAML 파일로 전략 생성
result = client.strategy.create(file_path="./momentum.yaml")
problem_id = result["data"]["problem_id"]

# 전략 업로드
result = client.strategy.push(
    file_path="./momentum.yaml",
    tag="experiment-01",
)

# 전략 상세 조회
details = client.strategy.show(problem_id)
```

## 4. 최적화 실행

```python
# 기본 최적화
result = client.optimize.run(problem_id=1)

# Greedy cluster 최적화
result = client.optimize.run(problem_id=1, greedy=True)

# 결과 확인
weights = result["data"]["weights"]
sharpe = result["data"]["sharpe_ratio"]

print(f"Sharpe Ratio: {sharpe:.2f}")
for ticker, weight in weights.items():
    print(f"  {ticker}: {weight:.1%}")
```

## 5. 백테스트

```python
# 티커 기반 백테스트
result = client.backtest.run(
    tickers=["005930", "000660", "035420"],
    start="2023-01-01",
    end="2024-12-31",
)

# 전략 파일 기반 백테스트
result = client.backtest.run(
    strategy_file="./momentum.yaml",
    start="2020-01-01",
    end="2024-12-31",
)

# 결과 조회
job_id = result["data"]["job_id"]
results = client.backtest.results(job_id)
```

## 6. 시장 데이터

```python
# 데이터 조회
data = client.data.fetch(
    universe="KOSPI200",
    start_date="2024-01-01",
)

# 특정 종목 조회
data = client.data.fetch(
    tickers=["005930", "000660"],
    start_date="2024-01-01",
    end_date="2024-12-31",
)
```

## 7. Jupyter Notebook 워크플로우

여러 전략을 실험하고 비교하는 전형적인 워크플로우입니다:

```python
from qbique import QbiqueClient
import pandas as pd

client = QbiqueClient(api_key="qbi_xxx")

# 여러 전략 백테스트
strategies = {
    "momentum": "./strategies/momentum.yaml",
    "min_var":  "./strategies/min_variance.yaml",
    "risk_par": "./strategies/risk_parity.yaml",
}

results = {}
for name, path in strategies.items():
    result = client.backtest.run(
        strategy_file=path,
        start="2020-01-01",
        end="2024-12-31",
    )
    job_id = result["data"]["job_id"]
    results[name] = client.backtest.results(job_id)

# 결과를 DataFrame으로 비교
comparison = pd.DataFrame({
    name: {
        "CAGR": r["data"]["cagr"],
        "Sharpe": r["data"]["sharpe_ratio"],
        "Max DD": r["data"]["max_drawdown"],
    }
    for name, r in results.items()
})

print(comparison.T)
```

## 8. 에러 처리

```python
from qbique import QbiqueClient, AuthenticationError, NotFoundError, ValidationError

client = QbiqueClient(api_key="qbi_xxx")

try:
    result = client.optimize.run(problem_id=9999)
except AuthenticationError:
    print("API 키가 유효하지 않습니다.")
except NotFoundError:
    print("해당 문제를 찾을 수 없습니다.")
except ValidationError as e:
    print(f"입력 검증 실패: {e}")
```

## 다음 단계

- CLI 명령어 전체 목록: [README](../../README.md)
- 기여 가이드: [CONTRIBUTING](../../CONTRIBUTING.md)
