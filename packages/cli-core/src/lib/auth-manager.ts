/**
 * 인증 관리자
 * API Key 저장/로드/검증
 */
import {ConfigManager} from './config-manager.js'
import {ApiClient} from './api-client.js'
import type {AuthValidateResponse} from '../types/index.js'

export class AuthManager {
  constructor(
    private configManager: ConfigManager,
  ) {}

  isLoggedIn(): boolean {
    return !!this.configManager.getApiKey()
  }

  getApiKey(): string | undefined {
    return this.configManager.getApiKey()
  }

  async login(apiKey: string): Promise<AuthValidateResponse> {
    // 임시 클라이언트로 키 검증
    const client = new ApiClient(this.configManager, apiKey)
    const result = await client.post<AuthValidateResponse>('/api/auth/validate', undefined, {
      headers: {'X-API-Key': apiKey},
    })

    if (result.valid) {
      this.configManager.saveApiKey(apiKey)
    }

    return result
  }

  logout(): void {
    this.configManager.removeApiKey()
  }
}
