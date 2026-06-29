#!/bin/bash
# =============================================================
# Qbique CLI 데모 — 회의/캡처용 페이스드 실행
#
#   ./demo.sh           # 각 단계 후 Enter 대기(캡처하기 좋음)
#   ./demo.sh --auto    # 자동 진행(2초 간격)
#
# 사전: dev onboarding-be(9001) 가동. `qbique`는 npm link로 전역 등록됨
#       (없으면 QB 변수가 node bin/run.js로 폴백).
# =============================================================

export QBIQUE_ENDPOINT="${QBIQUE_ENDPOINT:-http://localhost:9001}"
export QBIQUE_API_KEY="${QBIQUE_API_KEY:-qbi_test}"

# qbique 전역 명령 우선, 없으면 로컬 bin
if command -v qbique >/dev/null 2>&1; then
  QB="qbique"
else
  QB="node $(dirname "$0")/packages/cli-core/bin/run.js"
fi

AUTO=false
[ "$1" = "--auto" ] && AUTO=true

step() {
  echo ""
  echo "──────────────────────────────────────────────────────────"
  echo "▶ $1"
  echo "──────────────────────────────────────────────────────────"
  shift
  echo "\$ $*"
  echo ""
  "$@"
  echo ""
  if $AUTO; then sleep 2; else read -rp "  [Enter] 다음 →"; fi
}

clear
echo "═══════════════════════════════════════════"
echo "   Qbique CLI — 포트폴리오 최적화 from CLI"
echo "   endpoint: $QBIQUE_ENDPOINT"
echo "═══════════════════════════════════════════"
$AUTO || read -rp "  [Enter] 시작 →"

step "1. 전체 명령 개요"            $QB --help
step "2. 서버 상태 확인"           $QB health
step "3. 버전(클라이언트/서버)"     $QB version
step "4. 지원 최적화 전략 목록"     $QB strategy list
step "5. 티커 유효성 검증"          $QB data validate AAPL,MSFT,NVDA
step "6. 웹 패리티 백테스트 — 옵션"  $QB backtest strategy --help
step "7. 백테스트 실행 (RP·월별·US·2023)" \
     $QB backtest strategy --start 2023-01-01 --end 2023-12-31 \
        --strategy-method risk_parity --rebalance-freq monthly --universe US

echo ""
echo "═══════════════ 데모 종료 ═══════════════"
