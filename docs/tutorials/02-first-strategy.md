# Tutorial 2: 첫 전략 만들기

YAML 파일로 포트폴리오 최적화 전략을 정의하고 서버에 등록하는 과정입니다.

## 1. 최적화 방법 확인

사용 가능한 최적화 방법을 먼저 확인합니다:

```bash
qbique strategy list
```

```
 Method             Description
 ────────────────── ────────────────────────────────────
 MVO                Mean-Variance Optimization
 Min-Variance       Minimum Variance Portfolio
 Risk-Parity        Risk Parity (Equal Risk Contribution)
 Max-Sharpe         Maximum Sharpe Ratio
 CVaR               Conditional Value at Risk Minimization
 ...
```

## 2. 전략 YAML 작성

`momentum.yaml` 파일을 생성합니다:

```yaml
metadata:
  name: "Momentum Strategy V1"
  description: "KOSPI 대형주 모멘텀 전략"

universe:
  market: KOSPI
  tickers:
    - "005930"    # 삼성전자
    - "000660"    # SK하이닉스
    - "035420"    # NAVER
    - "051910"    # LG화학
    - "006400"    # 삼성SDI

optimization:
  method: "Max-Sharpe"
  risk_function: "standard_deviation"
  expected_return_method: "bayes_stein"

constraints:
  budget_sum:
    type: "equality"
    value: 1.0
  no_short:
    type: "bound"
    lower: 0.0
    upper: 1.0
  max_single_position:
    type: "bound"
    upper: 0.3

rebalancing:
  schedule: "quarterly"
  drift_threshold: 5.0
```

## 3. 전략 검증

서버에 등록하기 전에 로컬에서 검증합니다:

```bash
qbique strategy validate -f momentum.yaml
```

```
Strategy "Momentum Strategy V1" is valid.
  Method: Max-Sharpe
  Assets: 5
  Constraints: 3
```

## 4. 전략 등록 (방법 A: create)

전략을 서버에 등록하고 최적화 문제(problem)를 생성합니다:

```bash
qbique strategy create -f momentum.yaml
```

```
Created optimization problem #42
  Name: Momentum Strategy V1
  Method: Max-Sharpe
  Assets: 5
```

반환된 `problem-id`(여기서는 42)를 최적화 실행에 사용합니다.

## 5. 전략 업로드 (방법 B: push)

전략을 서버에 업로드하고 버전 관리합니다:

```bash
qbique strategy push ./momentum.yaml
```

```
Pushed "Momentum Strategy V1" v1.0.0 (id: 15)
  Problem ID: 42
```

같은 이름으로 다시 push하면 버전이 자동 증가합니다:

```bash
# YAML 수정 후...
qbique strategy push ./momentum.yaml --tag production
```

```
Pushed "Momentum Strategy V1" v1.0.1 (id: 16, tag: production)
  Problem ID: 43
```

버전 이력을 확인하려면:

```bash
qbique strategy versions 15
```

## 6. 최적화 실행

등록된 전략으로 포트폴리오 최적화를 실행합니다:

```bash
qbique optimize run --problem-id 42
```

```
Optimization completed
  Sharpe Ratio: 1.24
  Expected Return: 12.3%
  Volatility: 9.9%

  Weights:
    005930 (삼성전자)    28.5%
    000660 (SK하이닉스)  22.1%
    035420 (NAVER)       19.7%
    051910 (LG화학)      16.3%
    006400 (삼성SDI)     13.4%
```

Greedy cluster 최적화를 사용하려면:

```bash
qbique optimize run --problem-id 42 --greedy
```

## 7. 전략 상세 조회

등록된 전략의 상세 정보를 확인합니다:

```bash
qbique strategy show 42
```

## 다음 단계

- [Tutorial 3: 백테스트 실행하기](03-backtest.md)
- [Tutorial 4: 시장 데이터 활용](04-market-data.md)
