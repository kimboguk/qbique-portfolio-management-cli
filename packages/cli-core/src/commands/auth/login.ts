import {Flags} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'
import type {AuthValidateResponse} from '../../types/index.js'

export default class AuthLogin extends BaseCommand {
  static override description = 'Authenticate with an API key'

  static override examples = [
    '<%= config.bin %> auth login --api-key qbi_xxxxxxxxxx',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    'api-key': Flags.string({
      description: 'API key to authenticate with',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(AuthLogin)
    const apiKey = flags['api-key']

    if (!apiKey.startsWith('qbi_')) {
      this.formatter.error('Invalid API key format. Keys must start with "qbi_".')
      this.exit(1)
    }

    this.formatter.info('Validating API key...')

    try {
      const result = await this.apiClient.get<{auth_enabled: boolean}>('/api/auth/status')

      if (!result.auth_enabled) {
        // 인증 비활성 상태에서도 키 저장 (나중에 활성화 대비)
        this.configManager.saveApiKey(apiKey)
        this.formatter.success(
          'API key saved. Note: authentication is currently disabled on the server.',
        )
        this.formatter.output({authenticated: true, auth_enabled: false})
        return
      }
    } catch {
      // 서버 연결 실패 — 키만 저장
      this.configManager.saveApiKey(apiKey)
      this.formatter.success(
        'API key saved locally. Could not validate with server (connection failed).',
      )
      return
    }

    // 서버에서 키 검증
    try {
      const validation = await this.apiClient.post<AuthValidateResponse>(
        '/api/auth/validate',
        undefined,
        {headers: {'X-API-Key': apiKey}},
      )

      if (validation.valid) {
        this.configManager.saveApiKey(apiKey)
        this.formatter.success(`Authenticated as "${validation.name}" (${validation.prefix}...)`)
        this.formatter.output({
          authenticated: true,
          name: validation.name,
          prefix: validation.prefix,
          scopes: validation.scopes,
        })
      } else {
        this.formatter.error('Invalid API key.')
        this.exit(1)
      }
    } catch (error) {
      this.formatter.error(`Authentication failed: ${(error as Error).message}`)
      this.exit(1)
    }
  }
}
