import {Args, Flags} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class OptimizeRun extends BaseCommand {
  static override description = 'Run portfolio optimization'

  static override examples = [
    '<%= config.bin %> optimize run --problem-id 1',
    '<%= config.bin %> optimize run --problem-id 1 --greedy',
    '<%= config.bin %> optimize run --problem-id 1 -o json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    'problem-id': Flags.integer({
      description: 'Optimization problem ID',
      required: true,
    }),
    greedy: Flags.boolean({
      description: 'Use greedy cluster optimization',
      default: false,
    }),
    tickers: Flags.string({
      description: 'Comma-separated asset tickers (optional)',
    }),
    'no-cache': Flags.boolean({
      description: 'Disable caching',
      default: false,
    }),
    timeout: Flags.integer({
      description: 'Request timeout in seconds (default: 300)',
      default: 300,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(OptimizeRun)

    const tickers = flags.tickers?.split(',').map((t) => t.trim()) ?? null

    if (flags.greedy) {
      await this.runGreedy(flags['problem-id'], flags.timeout)
    } else {
      await this.runClassical(flags['problem-id'], tickers, !flags['no-cache'], flags.timeout)
    }
  }

  private async runClassical(
    problemId: number,
    tickers: string[] | null,
    useCache: boolean,
    timeout: number,
  ): Promise<void> {
    this.formatter.info(`Running optimization for problem #${problemId}...`)

    const result = await this.apiClient.post<Record<string, unknown>>(
      '/api/optimization/execute',
      {
        problem_id: problemId,
        asset_tickers: tickers,
        use_cache: useCache,
      },
      {timeout: timeout * 1000},
    )

    this.formatter.success('Optimization completed')
    this.formatter.output(result)
  }

  private async runGreedy(problemId: number, timeout: number): Promise<void> {
    this.formatter.info(`Running greedy cluster optimization for problem #${problemId}...`)

    const result = await this.apiClient.post<Record<string, unknown>>(
      '/api/optimization/greedy-cluster',
      {request_id: problemId},
      {timeout: timeout * 1000},
    )

    this.formatter.success('Greedy optimization completed')
    this.formatter.output(result)
  }
}
