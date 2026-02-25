/**
 * 텔레메트리 (옵트인)
 *
 * 수집하는 것:
 * - 명령어 이름 (e.g., "backtest run")
 * - 실행 시간 (ms)
 * - 성공/실패 여부
 * - CLI 버전
 * - Node.js 버전
 * - OS 플랫폼
 *
 * 수집하지 않는 것:
 * - API 키, 비밀번호
 * - 파일 내용, 데이터
 * - 티커, 전략 내용
 * - IP 주소 (서버 측에서도 저장하지 않음)
 *
 * 비활성화: qbique config set telemetry false
 */
import {ConfigManager} from './config-manager.js'

interface TelemetryEvent {
  event: 'command_run'
  command: string
  duration_ms: number
  success: boolean
  cli_version: string
  node_version: string
  platform: string
  timestamp: string
}

const CLI_VERSION = '0.1.0'

export class Telemetry {
  private enabled: boolean
  private startTime = 0

  constructor(configManager: ConfigManager) {
    this.enabled = configManager.get('telemetry') ?? true
  }

  /**
   * 명령어 실행 시작 시 호출.
   */
  start(): void {
    if (!this.enabled) return
    this.startTime = Date.now()
  }

  /**
   * 명령어 실행 완료 시 호출.
   * 비동기로 이벤트를 전송하되 실패해도 무시한다.
   */
  async trackCommand(command: string, success: boolean): Promise<void> {
    if (!this.enabled) return

    const event: TelemetryEvent = {
      event: 'command_run',
      command,
      duration_ms: this.startTime > 0 ? Date.now() - this.startTime : 0,
      success,
      cli_version: CLI_VERSION,
      node_version: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
    }

    // 비동기 전송 — fire and forget
    this.send(event).catch(() => {
      // 텔레메트리 전송 실패는 조용히 무시
    })
  }

  /**
   * 텔레메트리 이벤트를 서버에 전송.
   * 현재는 로컬 로그로만 기록 (서버 엔드포인트 준비 시 교체).
   */
  private async send(_event: TelemetryEvent): Promise<void> {
    // TODO: POST /api/telemetry/events 로 전송
    // 현재는 no-op (서버 엔드포인트 구현 후 활성화)
  }
}
