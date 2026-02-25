import {BaseCommand} from '../lib/base-command.js'
import type {HealthResponse} from '../types/index.js'

export default class Health extends BaseCommand {
  static override description = 'Check backend server health'

  static override examples = [
    '<%= config.bin %> health',
    '<%= config.bin %> health -o json',
  ]

  async run(): Promise<void> {
    const data = await this.apiClient.get<HealthResponse>('/health')
    this.formatter.output(data)
  }
}
