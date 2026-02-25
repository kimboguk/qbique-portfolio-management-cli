import {BaseCommand} from '../lib/base-command.js'

export default class Version extends BaseCommand {
  static override description = 'Show CLI and server version information'

  static override examples = [
    '<%= config.bin %> version',
    '<%= config.bin %> version -o json',
  ]

  async run(): Promise<void> {
    // CLI 버전은 항상 표시
    const cliVersion = this.config.version

    try {
      const server = await this.apiClient.get<{
        current_version: string
        description?: string
      }>('/api/version/current')

      this.formatter.output({
        cli_version: cliVersion,
        server_version: server.current_version,
        server_description: server.description ?? '',
      })
    } catch {
      // 서버 연결 실패 시 CLI 버전만 출력
      this.formatter.output({
        cli_version: cliVersion,
        server_version: 'unavailable',
        server_description: 'Could not connect to server',
      })
    }
  }
}
