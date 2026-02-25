import {Flags} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class OptimizeFrontier extends BaseCommand {
  static override description = 'Calculate efficient frontier'

  static override examples = [
    '<%= config.bin %> optimize frontier --request-id GREEDY_1234567890_abc',
    '<%= config.bin %> optimize frontier --request-id GREEDY_1234567890_abc --points 100',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    'request-id': Flags.string({
      description: 'Greedy selection request ID',
      required: true,
    }),
    points: Flags.integer({
      description: 'Number of frontier points (default: 50)',
      default: 50,
    }),
    'max-volatility': Flags.string({
      description: 'Maximum volatility limit (default: 2.5)',
      default: '2.5',
    }),
    timeout: Flags.integer({
      description: 'Request timeout in seconds (default: 300)',
      default: 300,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(OptimizeFrontier)

    this.formatter.info('Calculating efficient frontier...')

    const params = new URLSearchParams({
      request_id: flags['request-id'],
      n_points: String(flags.points),
      max_volatility: flags['max-volatility'],
    })

    const result = await this.apiClient.post<Record<string, unknown>>(
      `/api/optimization/efficient-frontier?${params.toString()}`,
      undefined,
      {timeout: flags.timeout * 1000},
    )

    this.formatter.success('Efficient frontier calculated')
    this.formatter.output(result)
  }
}
