import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class OptimizeStatus extends BaseCommand {
  static override description = 'Get optimization result by result ID'

  static override examples = [
    '<%= config.bin %> optimize status 1',
    '<%= config.bin %> optimize status 1 -o json',
  ]

  static override args = {
    id: Args.integer({
      description: 'Optimization result ID',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(OptimizeStatus)

    const result = await this.apiClient.get<Record<string, unknown>>(
      `/api/optimization/result/${args.id}`,
    )

    this.formatter.output(result)
  }
}
