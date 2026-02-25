import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class BacktestStatus extends BaseCommand {
  static override description = 'Check backtest job status'

  static override examples = [
    '<%= config.bin %> backtest status abc-123',
    '<%= config.bin %> backtest status abc-123 -o json',
  ]

  static override args = {
    id: Args.string({
      description: 'Backtest job ID',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(BacktestStatus)

    const result = await this.apiClient.get<Record<string, unknown>>(
      `/api/backtest/status/${args.id}`,
    )

    this.formatter.output(result)
  }
}
