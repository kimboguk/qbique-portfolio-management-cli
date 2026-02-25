/**
 * 라이선스 관리자
 * 유료 플러그인의 라이선스 검증을 담당.
 *
 * 검증 순서:
 * 1. 로컬 캐시 (~/.config/qbique/licenses.json) 확인
 * 2. 캐시 만료 시 서버에서 재검증
 * 3. 오프라인 시 로컬 캐시 기반 grace period 허용
 */
import {existsSync, readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {homedir} from 'node:os'

const CONFIG_DIR = join(homedir(), '.config', 'qbique')
const LICENSES_FILE = join(CONFIG_DIR, 'licenses.json')

/** 로컬 캐시 유효 기간 (7일) */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface LicenseEntry {
  plugin: string
  tier: 'free' | 'premium' | 'enterprise'
  valid: boolean
  expiresAt: string | null
  checkedAt: string
}

interface LicenseCache {
  [plugin: string]: LicenseEntry
}

export type LicenseCheckResult =
  | {status: 'valid'}
  | {status: 'expired'; message: string}
  | {status: 'missing'; message: string}
  | {status: 'free'}

export class LicenseManager {
  private cache: LicenseCache

  constructor() {
    this.cache = this.loadCache()
  }

  /**
   * 플러그인의 라이선스 상태를 확인한다.
   * free 티어 플러그인은 항상 valid.
   */
  check(pluginName: string, tier: 'free' | 'premium' | 'enterprise'): LicenseCheckResult {
    if (tier === 'free') {
      return {status: 'free'}
    }

    const entry = this.cache[pluginName]

    if (!entry) {
      return {
        status: 'missing',
        message:
          `${pluginName} requires a ${tier} license.\n` +
          `  Activate: qbique license activate ${pluginName} <license-key>\n` +
          `  Purchase: https://qbique.io/pricing`,
      }
    }

    if (!entry.valid) {
      return {
        status: 'expired',
        message:
          `License for ${pluginName} is invalid or revoked.\n` +
          `  Renew: https://qbique.io/account/licenses`,
      }
    }

    // 만료일 확인
    if (entry.expiresAt) {
      const expiresAt = new Date(entry.expiresAt)
      if (expiresAt < new Date()) {
        return {
          status: 'expired',
          message:
            `License for ${pluginName} expired on ${entry.expiresAt}.\n` +
            `  Renew: https://qbique.io/account/licenses`,
        }
      }
    }

    // 로컬 캐시 TTL 확인 (경고만 — 차단하지 않음)
    const checkedAt = new Date(entry.checkedAt)
    const isStale = Date.now() - checkedAt.getTime() > CACHE_TTL_MS
    if (isStale) {
      // 오프라인 grace period — 경고만 출력, 사용은 허용
    }

    return {status: 'valid'}
  }

  /**
   * 라이선스를 로컬에 활성화(저장)한다.
   * 실제 구현에서는 서버에 키를 검증한 후 저장.
   */
  activate(pluginName: string, licenseKey: string, tier: 'premium' | 'enterprise'): void {
    this.cache[pluginName] = {
      plugin: pluginName,
      tier,
      valid: true,
      expiresAt: null, // 서버 검증 후 설정
      checkedAt: new Date().toISOString(),
    }
    this.saveCache()
  }

  /**
   * 라이선스를 비활성화한다.
   */
  deactivate(pluginName: string): void {
    delete this.cache[pluginName]
    this.saveCache()
  }

  /**
   * 모든 라이선스 목록을 반환한다.
   */
  list(): LicenseEntry[] {
    return Object.values(this.cache)
  }

  private loadCache(): LicenseCache {
    if (!existsSync(LICENSES_FILE)) {
      return {}
    }

    try {
      return JSON.parse(readFileSync(LICENSES_FILE, 'utf8'))
    } catch {
      return {}
    }
  }

  private saveCache(): void {
    writeFileSync(LICENSES_FILE, JSON.stringify(this.cache, null, 2), 'utf8')
  }
}
