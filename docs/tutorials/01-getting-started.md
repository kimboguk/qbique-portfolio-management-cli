# Tutorial 1: Getting Started

Qbique CLI를 설치하고 첫 번째 명령어를 실행하는 가이드입니다.

## 1. 설치

```bash
npm install -g @qbique/cli
```

설치 확인:

```bash
qbique version
```

## 2. 인증

서버에 접속하려면 API 키가 필요합니다.

```bash
qbique auth login
```

프롬프트에 API 키를 입력하면 `~/.config/qbique/credentials.json`에 저장됩니다.

## 3. 서버 연결 확인

```bash
qbique health
```

```
Backend: healthy (v0.9.9)
```

## 4. 설정 확인

현재 설정을 확인합니다:

```bash
qbique config show
```

API 엔드포인트를 변경하려면:

```bash
qbique config set endpoint http://10.0.0.5:8001
```

## 5. 다중 환경 프로필

개발/운영 환경을 분리할 수 있습니다:

```bash
# 프로필 생성
qbique config profile create production --endpoint https://api.qbique.io

# 프로필 전환
qbique config profile use production

# 프로필 목록
qbique config profile list

# 다시 기본 프로필로
qbique config profile use default
```

## 6. 출력 형식

모든 명령어에 `-o` 플래그로 출력 형식을 지정할 수 있습니다:

```bash
qbique strategy list              # 기본: 테이블
qbique strategy list -o json      # JSON
qbique strategy list -o yaml      # YAML
```

## 다음 단계

- [Tutorial 2: 첫 전략 만들기](02-first-strategy.md)
- [Tutorial 3: 백테스트 실행하기](03-backtest.md)
