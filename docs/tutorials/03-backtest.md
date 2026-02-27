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
