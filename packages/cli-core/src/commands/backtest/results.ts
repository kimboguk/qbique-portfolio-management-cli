import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class BacktestResults extends BaseCommand {
  static override description = 'Get backtest results'

  static override examples = [
    '<%= config.bin %> backtest results abc-123',
    '<%= config.bin %> backtest results abc-123 -o json',
  ]

  static override args = {
    id: Args.string({
      description: 'Backtest job ID',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(BacktestResults)

    const result = await this.apiClient.get<Record<string, unknown>>(
      `/api/backtest/results/${args.id}`,
    )

    this.formatter.output(result)
  }
}
