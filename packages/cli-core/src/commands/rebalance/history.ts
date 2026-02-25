import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class RebalanceHistory extends BaseCommand {
  static override description = 'Get rebalancing history'

  static override examples = [
    '<%= config.bin %> rebalance history 1',
  ]

  static override args = {
    id: Args.string({
      description: 'Request ID',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(RebalanceHistory)
    const result = await this.apiClient.get<Record<string, unknown>>(
      `/api/rebalancing/history/${args.id}`,
    )
    this.formatter.output(result)
  }
}
