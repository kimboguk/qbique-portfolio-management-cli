import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class PortfolioPnl extends BaseCommand {
  static override description = 'Get portfolio profit & loss data'

  static override examples = [
    '<%= config.bin %> portfolio pnl 1',
  ]

  static override args = {
    id: Args.string({
      description: 'Request ID',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(PortfolioPnl)
    const result = await this.apiClient.get<Record<string, unknown>>(
      `/api/portfolio/pnl/${args.id}`,
    )
    this.formatter.output(result)
  }
}
