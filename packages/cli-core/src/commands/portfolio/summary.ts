import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class PortfolioSummary extends BaseCommand {
  static override description = 'Get portfolio summary'

  static override examples = [
    '<%= config.bin %> portfolio summary 1',
    '<%= config.bin %> portfolio summary 1 -o json',
  ]

  static override args = {
    id: Args.string({
      description: 'Request ID',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(PortfolioSummary)
    const result = await this.apiClient.get<Record<string, unknown>>(
      `/api/portfolio/summary/${args.id}`,
    )
    this.formatter.output(result)
  }
}
