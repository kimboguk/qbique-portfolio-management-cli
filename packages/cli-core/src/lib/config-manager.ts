/**
 * 설정 파일 관리자
 * ~/.config/qbique/config.json, ~/.config/qbique/credentials.json 관리
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync} from 'node:fs'
import {join} from 'node:path'
import {homedir} from 'node:os'
import type {OutputFormat, ProfileCredentials, QbiqueConfig} from '../types/index.js'

const CONFIG_DIR = join(homedir(), '.config', 'qbique')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')
const CREDENTIALS_FILE = join(CONFIG_DIR, 'credentials.json')

const DEFAULT_CONFIG: QbiqueConfig = {
  endpoint: 'http://localhost:8001',
  defaultOutput: 'table',
  timeout: 30_000,
  profile: 'default',
}

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, {recursive: true})
  }
}

export class ConfigManager {
  private config: QbiqueConfig
  private credentials: ProfileCredentials

  constructor() {
    ensureConfigDir()
    this.config = this.loadConfig()
    this.credentials = this.loadCredentials()
  }

  // ==================== Config ====================

  getConfig(): QbiqueConfig {
    return {...this.config}
  }

  get<K extends keyof QbiqueConfig>(key: K): QbiqueConfig[K] {
    return this.config[key]
  }

  set<K extends keyof QbiqueConfig>(key: K, value: QbiqueConfig[K]): void {
    this.config[key] = value
    this.saveConfig()
  }

  setFromString(key: string, value: string): void {
    const k = key as keyof QbiqueConfig
    switch (k) {
      case 'endpoint':
      case 'profile':
        this.config[k] = value
        break
      case 'defaultOutput':
        if (!['json', 'table', 'yaml'].includes(value)) {
          throw new Error(`Invalid output format: ${value}. Use json, table, or yaml.`)
        }
        this.config.defaultOutput = value as OutputFormat
        break
      case 'timeout':
        this.config.timeout = Number.parseInt(value, 10)
        if (Number.isNaN(this.config.timeout)) {
          throw new Error(`Invalid timeout value: ${value}`)
        }
        break
      default:
        throw new Error(`Unknown config key: ${key}. Valid keys: endpoint, defaultOutput, timeout, profile`)
    }

    this.saveConfig()
  }

  // ==================== Credentials ====================

  getApiKey(profile?: string): string | undefined {
    const p = profile ?? this.config.profile
    return this.credentials[p]?.apiKey
  }

  saveApiKey(apiKey: string, endpoint?: string, profile?: string): void {
    const p = profile ?? this.config.profile
    this.credentials[p] = {
      apiKey,
      endpoint: endpoint ?? this.config.endpoint,
      savedAt: new Date().toISOString(),
    }
    this.saveCredentials()
  }

  removeApiKey(profile?: string): void {
    const p = profile ?? this.config.profile
    delete this.credentials[p]
    this.saveCredentials()
  }

  listProfiles(): string[] {
    return Object.keys(this.credentials)
  }

  // ==================== Private ====================

  private loadConfig(): QbiqueConfig {
    if (!existsSync(CONFIG_FILE)) {
      return {...DEFAULT_CONFIG}
    }

    try {
      const raw = readFileSync(CONFIG_FILE, 'utf8')
      return {...DEFAULT_CONFIG, ...JSON.parse(raw)}
    } catch {
      return {...DEFAULT_CONFIG}
    }
  }

  private saveConfig(): void {
    ensureConfigDir()
    writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8')
  }

  private loadCredentials(): ProfileCredentials {
    if (!existsSync(CREDENTIALS_FILE)) {
      return {}
    }

    try {
      const raw = readFileSync(CREDENTIALS_FILE, 'utf8')
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }

  private saveCredentials(): void {
    ensureConfigDir()
    writeFileSync(CREDENTIALS_FILE, JSON.stringify(this.credentials, null, 2), 'utf8')
    // credentials.json 파일 권한 0600 (소유자만 읽기/쓰기)
    chmodSync(CREDENTIALS_FILE, 0o600)
  }
}
