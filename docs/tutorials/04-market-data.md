# Tutorial 4: 시장 데이터 활용

Qbique CLI로 시장 데이터를 조회, 가져오기, 내보내기하는 가이드입니다.

## 1. 종목 검색

종목 코드나 이름으로 검색합니다:

```bash
qbique data search 삼성
```

```
  Ticker    Name               Market
  ──────── ─────────────────── ──────
  005930    삼성전자            KOSPI
  000810    삼성화재            KOSPI
  006400    삼성SDI             KOSPI
  ...
```

## 2. 종목 코드 검증

유효한 종목 코드인지 확인합니다:

```bash
qbique data validate 005930,000660,999999
```

```
  005930  삼성전자      valid
  000660  SK하이닉스    valid
  999999  -             invalid
```

## 3. 시장 데이터 조회 (fetch)

### 유니버스별 조회

```bash
qbique data fetch --universe KOSPI200
```

### 특정 종목 조회

```bash
qbique data fetch --tickers 005930,000660 --from 2024-01-01
```

### 기간 지정

```bash
qbique data fetch --universe KOSPI200 --from 2023-01-01 --to 2024-12-31
```

### 파일로 저장

```bash
qbique data fetch --tickers 005930 --from 2024-01-01 --save ./samsung.json
```

## 4. 데이터 가져오기 (import)

로컬 CSV/JSON 파일을 서버에 업로드합니다:

```bash
# CSV 파일 업로드
qbique data import -f ./prices.csv --dataset prices

# JSON 파일 업로드
qbique data import -f ./data.json --dataset prices
```

CSV 파일 형식:

```csv
ticker,trade_date,close,volume
005930,2024-01-02,78000,12345678
005930,2024-01-03,78500,11234567
000660,2024-01-02,132000,5678901
```

## 5. 데이터 내보내기 (export)

서버의 데이터를 로컬 파일로 내보냅니다:

```bash
# JSON으로 내보내기
qbique data export --dataset prices --format json --save ./export.json

# CSV로 내보내기
qbique data export --dataset prices --format csv --save ./export.csv

# 수익률 데이터 내보내기
qbique data export --dataset returns --format csv --save ./returns.csv
```

## 6. 워크플로우 예시: 외부 데이터 → 백테스트

```bash
# 1. 외부에서 수집한 가격 데이터를 서버에 업로드
qbique data import -f ./external_prices.csv --dataset prices

# 2. 업로드된 데이터로 백테스트 실행
qbique backtest run --tickers 005930,000660 \
  --start 2023-01-01 --end 2024-12-31

# 3. 결과를 CSV로 내보내기
qbique backtest report bt-xxx --format csv --output ./results.csv
```

## 다음 단계

- [Tutorial 5: Python SDK로 Jupyter에서 분석하기](05-python-sdk.md)
