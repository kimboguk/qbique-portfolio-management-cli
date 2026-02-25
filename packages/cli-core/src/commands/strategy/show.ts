import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class StrategyShow extends BaseCommand {
  static override description = 'Show optimization problem details'

  static override examples = [
    '<%= config.bin %> strategy show 1',
    '<%= config.bin %> strategy show 1 -o json',
  ]

  static override args = {
    id: Args.integer({
      description: 'Optimization problem ID',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(StrategyShow)

    const problem = await this.apiClient.get<Record<string, unknown>>(
      `/api/onboarding/problem/${args.id}`,
    )

    this.formatter.output(problem)
  }
}
