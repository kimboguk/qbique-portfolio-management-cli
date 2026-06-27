# Tutorial 3: 백테스트 실행하기

과거 데이터로 포트폴리오 전략의 성과를 검증하는 백테스트 가이드입니다.

## 1. 티커 기반 백테스트

가장 간단한 방법입니다. 종목 코드와 기간만 지정합니다:

```bash
qbique backtest run \
  --tickers 005930,000660,035420 \
  --start 2023-01-01 \
  --end 2024-12-31
```

```
Backtest completed (job: bt-a1b2c3)
  Period: 2023-01-01 ~ 2024-12-31 (487 trading days)
  Benchmark: KOSPI

  Performance:
    CAGR:            18.7%
    Sharpe Ratio:    1.31
    Max Drawdown:    -8.2%
    Turnover:        42.3%
```

## 2. 전략 파일 기반 백테스트

Tutorial 2에서 작성한 YAML 전략 파일을 직접 사용합니다:

```bash
qbique backtest run \
  --strategy ./momentum.yaml \
  --start 2020-01-01 \
  --end 2024-12-31
```

전략 파일에 정의된 종목, 최적화 방법, 리밸런싱 규칙이 모두 적용됩니다.

## ⭐ 웹 앱 동일 방식 백테스트 — `backtest strategy`

위 `backtest run`은 종목을 직접 주는 단순(legacy) 경로입니다. **웹 플랫폼과 똑같은 백테스트**(greedy 클러스터 자산 선택 + 5종 비중 방식 + 유니버스/레짐/공분산/손절)를 재현하려면 `backtest strategy`를 씁니다. 종목을 나열하지 않고 **전략·유니버스·기간만** 지정하면 엔진이 자산 선택부터 수행합니다.

```bash
qbique backtest strategy \
  --start 2023-01-01 --end 2024-12-31 \
  --strategy-method risk_parity \
  --rebalance-freq monthly \
  --universe US
```

```
Submitting risk_parity backtest (US, monthly, 2023-01-01 ~ 2024-12-31)...
Backtest job: a6c770a3-... — polling for results...
✓ Backtest completed
  total_return: 19.9%   annualized: ...   sharpe: 1.90   max_drawdown: -7.6%
```

### 주요 플래그

| 플래그 | 값 | 기본값 |
|---|---|---|
| `--strategy-method` | `max_sharpe` \| `risk_parity` \| `hrp` \| `min_variance` \| `equal_weight` | `max_sharpe` |
| `--rebalance-freq` | `monthly` \| `quarterly` \| `semi_annual` \| `annual` \| `weekly` | `monthly` |
| `--universe` | `US` \| `ALL` | `US` |
| `--cov-method` | `sample` \| `ledoit_wolf` | `sample` |
| `--expected-return-method` | 기대수익 추정기 | `bayes_stein` |
| `--lookback-days` / `--cov-lookback-days` | 수익/공분산 룩백(일) | 엔진 기본 |
| `--k-max-per-cluster` | 클러스터당 최대 선택 종목 | 엔진 기본 |
| `--regime` / `--regime-method` | 레짐 스위칭 on + 방법 | off |
| `--credit-spread` | 신용스프레드 채권 대피 on | off |
| `--stop-loss` / `--stop-loss-threshold` | 손절 on + 임계(비율) | off / 0.20 |
| `--eval-method` | `share_based` \| `weight_based` | `share_based` |
| `--realistic-pricing` | open-진입/close-청산 가격 | off |
| `--benchmarks` | 쉼표구분 벤치(예 `SPY,QQQ`) | 엔진 기본 |
| `--capital` | 초기 자본 | 100000000 |

### 예시 — Ledoit-Wolf 공분산 + 균등배분, 전 기간

```bash
qbique backtest strategy \
  --start 2010-01-01 --end 2025-12-31 \
  --strategy-method equal_weight \
  --universe US --cov-method ledoit_wolf
```

### 동기/비동기

greedy 백테스트는 ~1분 걸립니다. 기본은 `--wait`(완료까지 폴링 후 결과 출력)입니다. 즉시 반환만 원하면 `--no-wait`로 `job_id`만 받습니다.

```bash
qbique backtest strategy --start 2023-01-01 --end 2023-12-31 \
  --strategy-method risk_parity --universe US --no-wait
# → job_id 반환 (재조회는 --wait 사용 권장)
```

> 참고: `backtest status`/`results` 커맨드는 legacy `backtest run` 전용입니다. `backtest strategy`는 `--wait`(기본)로 완료 결과를 받으세요.

## 3. 리밸런싱 옵션

### 캘린더 기반 (기본값)

```bash
# 월간 리밸런싱
qbique backtest run --tickers 005930,000660 \
  --start 2023-01-01 --end 2024-12-31 \
  --schedule calendar --freq monthly

# 반기 리밸런싱
qbique backtest run --tickers 005930,000660 \
  --start 2023-01-01 --end 2024-12-31 \
  --freq semi_annual
```

### 드리프트 기반

포트폴리오 비중이 목표 대비 일정 비율 이상 벗어나면 리밸런싱합니다:

```bash
qbique backtest run --tickers 005930,000660 \
  --start 2023-01-01 --end 2024-12-31 \
  --schedule drift --drift-threshold 5.0
```

## 4. 벤치마크 및 초기 자본 설정

```bash
qbique backtest run --tickers 005930,000660 \
  --start 2023-01-01 --end 2024-12-31 \
  --benchmark KOSPI \
  --capital 500000000
```

## 5. 비동기 실행

오래 걸리는 백테스트는 비동기로 실행할 수 있습니다:

```bash
# 즉시 반환 (결과를 기다리지 않음)
qbique backtest run --tickers 005930,000660 \
  --start 2020-01-01 --end 2024-12-31 \
  --no-wait

# 반환된 job ID로 상태 확인
qbique backtest status bt-a1b2c3

# 완료 후 결과 조회
qbique backtest results bt-a1b2c3
```

## 6. 백테스트 비교

두 백테스트의 결과를 나란히 비교합니다:

```bash
qbique backtest compare bt-a1b2c3 bt-d4e5f6
```

```
  Metric          Strategy A    Strategy B    Diff
  ─────────────── ──────────── ──────────── ───────
  CAGR            18.7%         14.2%        +4.5%
  Sharpe Ratio    1.31          0.98         +0.33
  Max Drawdown    -8.2%         -12.1%       +3.9%
  Turnover        42.3%         38.7%        +3.6%
```

특정 지표만 비교하려면:

```bash
qbique backtest compare bt-a1b2c3 bt-d4e5f6 --metrics sharpe,maxdd,cagr
```

## 7. 리포트 생성

백테스트 결과를 파일로 내보냅니다:

```bash
# JSON 리포트
qbique backtest report bt-a1b2c3 --format json --output ./report.json

# CSV 리포트
qbique backtest report bt-a1b2c3 --format csv --output ./report.csv

# stdout 출력
qbique backtest report bt-a1b2c3
```

## 다음 단계

- [Tutorial 4: 시장 데이터 활용](04-market-data.md)
- [Tutorial 5: Python SDK로 Jupyter에서 분석하기](05-python-sdk.md)
- [Tutorial 6: Python으로 커스텀 전략 만들기](06-python-strategy.md)
