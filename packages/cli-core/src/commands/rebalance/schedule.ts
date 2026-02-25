import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class RebalanceSchedule extends BaseCommand {
  static override description = 'Get rebalancing schedule'

  static override examples = [
    '<%= config.bin %> rebalance schedule 1',
  ]

  static override args = {
    id: Args.string({
      description: 'Request ID',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(RebalanceSchedule)
    const result = await this.apiClient.get<Record<string, unknown>>(
      `/api/rebalancing/schedules/${args.id}`,
    )
    this.formatter.output(result)
  }
}
