# Tutorial 6: Python으로 커스텀 전략 만들기

YAML 대신 Python 코드로 자유로운 알파 로직을 작성하고, CLI로 백테스트하는 가이드입니다.

## 개요

YAML 전략은 미리 정해진 최적화 방법(MVO, HRP 등)을 선택하는 방식입니다. Python 전략은 **리밸런싱 시점마다 직접 시그널을 생성**하여, 모멘텀·밸류·통계적 차익 등 자유로운 로직을 구현할 수 있습니다.

```
YAML 전략:  "Sharpe Ratio를 최대화하라" → 최적화 엔진이 비중 계산
Python 전략: "이 로직으로 시그널을 생성하라" → 시그널에 비례해 비중 계산
```

## 1. 패키지 설치

```bash
pip install -e cli/packages/strategy-base/
```

설치 확인:

```python
python -c "from qbique_strategy import BaseStrategy; print('OK')"
```

## 2. 전략 작성

`BaseStrategy`를 상속하고 `generate_signals()` 메서드를 구현하면 됩니다.

### 최소 예제

```python
# my_strategy.py
from datetime import date
from typing import List
from qbique_strategy import BaseStrategy, MarketData, Signal

class MyStrategy(BaseStrategy):
    def generate_signals(self, market_data: MarketData, rebalance_date: date) -> List[Signal]:
        signals = []
        for ticker in market_data.tickers:
            mom = market_data.calculate_momentum(ticker, period=20)
            if mom > 0:
                signals.append(Signal(ticker=ticker, score=mom))
        return signals
```

이것만으로도 동작하는 전략입니다. `score`가 높은 종목에 더 많은 비중이 배분됩니다.

### 핵심 개념

**`generate_signals()`** — 리밸런싱 시점마다 호출됩니다.

- 입력: `MarketData` (과거 가격 데이터) + `rebalance_date` (리밸런싱 날짜)
- 출력: `List[Signal]` (종목별 투자 시그널)
- 시그널이 없는 종목은 비중 0으로 처리됩니다.

**`Signal`** — 개별 종목의 투자 시그널입니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `ticker` | str | 종목 코드 (필수) |
| `score` | float | 시그널 강도 — 높을수록 비중 증가 (필수) |
| `direction` | SignalDirection | LONG / SHORT / NEUTRAL (기본: LONG) |
| `weight` | float \| None | 명시적 비중 (0~1). 설정하면 score 무시 |
| `metadata` | dict \| None | 디버깅용 메타데이터 |

**`MarketData`** — 리밸런싱 시점까지의 시장 데이터입니다.

| 속성/메서드 | 설명 |
|---|---|
| `prices` | 종가 DataFrame (dates x tickers) |
| `returns` | 일일 수익률 DataFrame |
| `tickers` | 종목 코드 리스트 |
| `calculate_momentum(ticker, period=20)` | 기간 수익률 |
| `calculate_volatility(ticker, period=20)` | 연율화 변동성 |
| `get_ticker_data(ticker)` | 단일 종목 가격/수익률 DataFrame |

## 3. 전략 예제: 모멘텀

20일 모멘텀이 양수인 종목에 모멘텀 비례 비중으로 투자합니다.

```python
# momentum.py
from datetime import date
from typing import List
from qbique_strategy import BaseStrategy, MarketData, Signal, SignalDirection

class MomentumStrategy(BaseStrategy):
    def generate_signals(self, market_data: MarketData, rebalance_date: date) -> List[Signal]:
        period = self.params.get("period", 20)
        signals = []

        for ticker in market_data.tickers:
            mom = market_data.calculate_momentum(ticker, period)
            if mom > 0:
                signals.append(
                    Signal(
                        ticker=ticker,
                        score=mom,
                        direction=SignalDirection.LONG,
                        metadata={"momentum": mom, "period": period},
                    )
                )

        return signals

    def risk_constraints(self) -> dict:
        return {
            "max_weight": self.params.get("max_weight", 0.2),
            "min_weight": 0.01,
        }
```

## 4. 전략 예제: 평균 회귀

이동평균 대비 저평가된 종목을 매수합니다.

```python
# mean_reversion.py
from datetime import date
from typing import List
from qbique_strategy import BaseStrategy, MarketData, Signal, SignalDirection

class MeanReversionStrategy(BaseStrategy):
    def generate_signals(self, market_data: MarketData, rebalance_date: date) -> List[Signal]:
        ma_period = self.params.get("ma_period", 50)
        threshold = self.params.get("threshold", -0.05)
        signals = []

        for ticker in market_data.tickers:
            prices = market_data.prices[ticker].dropna()
            if len(prices) < ma_period + 1:
                continue

            ma = prices.iloc[-ma_period:].mean()
            current_price = prices.iloc[-1]
            deviation = (current_price - ma) / ma

            if deviation < threshold:
                signals.append(
                    Signal(
                        ticker=ticker,
                        score=abs(deviation),
                        direction=SignalDirection.LONG,
                        metadata={"deviation": float(deviation), "ma": float(ma)},
                    )
                )

        return signals

    def risk_constraints(self) -> dict:
        return {"max_weight": 0.15, "min_weight": 0.01, "max_positions": 15}
```

## 5. 검증

서버에 올리기 전에 코드가 올바른지 검증합니다:

```bash
qbique strategy validate -f momentum.py
```

```
Python strategy is valid (class: MomentumStrategy)
```

검증 항목:
- Python 구문 오류
- `BaseStrategy` 상속 여부
- `generate_signals()` 메서드 존재
- 금지 import 차단 (`os`, `subprocess`, `socket`, `requests` 등)
- `exec()` / `eval()` 호출 차단

## 6. 서버에 Push

```bash
qbique strategy push momentum.py --name "Momentum20"
```

```
Strategy "Momentum20" pushed successfully (ID: 4) [version: 1.0.0]
```

클래스명이 자동 감지됩니다. 감지에 실패하면 `--classname`으로 지정합니다:

```bash
qbique strategy push custom.py --classname MyCustomStrategy
```

## 7. 백테스트 실행

Python 전략 백테스트는 `--strategy`와 `--tickers`를 함께 지정합니다:

```bash
qbique backtest run \
  --strategy ./momentum.py \
  --tickers 005930,000660,035420 \
  --start 2023-01-01 \
  --end 2024-12-31
```

```
Backtest completed
  Total Return:    49.5%
  Sharpe Ratio:    0.78
  Max Drawdown:    -32.2%
  Rebalances:      8
```

YAML 전략과 달리, Python 전략은 종목 리스트를 코드 안에 포함하지 않으므로 `--tickers`가 필수입니다.

## 8. 선택 구현: risk_constraints

종목당 최대/최소 비중, 최대 종목 수를 제한할 수 있습니다:

```python
def risk_constraints(self) -> dict:
    return {
        "max_weight": 0.3,    # 종목당 최대 30%
        "min_weight": 0.01,   # 종목당 최소 1%
        "max_positions": 20,  # 최대 20종목
    }
```

구현하지 않으면 제약 없이 score 비례 비중이 적용됩니다.

## 9. 선택 구현: on_rebalance_complete

리밸런싱 완료 후 호출되는 콜백입니다. 디버깅이나 로깅에 활용합니다:

```python
def on_rebalance_complete(self, rebalance_date, weights, portfolio_value):
    print(f"[{rebalance_date}] 비중: {weights}, 자산: {portfolio_value:,.0f}")
```

## 10. params 활용

전략 파라미터는 `self.params` 딕셔너리로 접근합니다:

```python
class FlexibleStrategy(BaseStrategy):
    def generate_signals(self, market_data, rebalance_date):
        period = self.params.get("period", 20)       # 기본값 20
        threshold = self.params.get("threshold", 0)   # 기본값 0
        # ...
```

같은 전략 코드를 파라미터만 바꿔서 여러 번 백테스트할 수 있습니다.

## 비중 계산 방식

시그널이 비중으로 변환되는 과정:

1. `generate_signals()`가 시그널 리스트를 반환
2. `direction=NEUTRAL`이거나 `score <= 0`인 시그널은 제외
3. `weight`가 명시된 시그널은 그 값을 직접 사용
4. 나머지는 `score` 비례로 비중 배분
5. `risk_constraints()`의 `max_weight`, `min_weight`, `max_positions` 적용
6. 전체 비중 합이 1이 되도록 정규화

## YAML 전략 vs Python 전략

| | YAML 전략 | Python 전략 |
|---|---|---|
| 비중 결정 | 최적화 엔진 (MVO, HRP 등) | 사용자 시그널 기반 |
| 종목 리스트 | YAML에 포함 | `--tickers`로 지정 |
| 커스텀 로직 | 불가 | 자유 |
| 적합한 경우 | 표준 최적화 방법 사용 | 독자적 알파 로직 |

## 다음 단계

- [Tutorial 2: YAML 전략 만들기](02-first-strategy.md) — 비교 참고
- [Tutorial 3: 백테스트 옵션 상세](03-backtest.md) — 리밸런싱, 벤치마크 설정
- [Tutorial 5: Python SDK](05-python-sdk.md) — Jupyter 환경 분석
