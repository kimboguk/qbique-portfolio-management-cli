import {Flags} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'
import {PluginManager} from '../../lib/plugin-manager.js'

export default class OptimizeRun extends BaseCommand {
  static override description = 'Run portfolio optimization'

  static override examples = [
    '<%= config.bin %> optimize run --problem-id 1',
    '<%= config.bin %> optimize run --problem-id 1 --engine classical',
    '<%= config.bin %> optimize run --problem-id 1 --engine quantum',
    '<%= config.bin %> optimize run --problem-id 1 --greedy',
    '<%= config.bin %> optimize run --problem-id 1 -o json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    'problem-id': Flags.integer({
      description: 'Optimization problem ID',
      required: true,
    }),
    engine: Flags.string({
      char: 'e',
      description: 'Optimization engine (classical, quantum)',
      options: ['classical', 'quantum'],
      default: 'classical',
    }),
    universe: Flags.string({
      char: 'u',
      description: 'Asset universe (us, kr, all)',
      options: ['us', 'kr', 'all'],
      default: 'us',
    }),
    'covariance-method': Flags.string({
      description: 'Covariance calculation method (standard, ledoit_wolf, downcov)',
      options: ['standard', 'ledoit_wolf', 'downcov'],
      default: 'standard',
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

    // Check engine plugin availability
    const engineCheck = PluginManager.checkEngine(flags.engine)
    if (!engineCheck.available) {
      this.formatter.info(engineCheck.message!)
      this.exit(0)
      return
    }

    const tickers = flags.tickers?.split(',').map((t) => t.trim()) ?? null

    if (flags.greedy) {
      await this.runGreedy(flags['problem-id'], flags.universe, flags['covariance-method'], flags.timeout)
    } else {
      await this.runClassical(flags['problem-id'], tickers, flags.universe, flags['covariance-method'], !flags['no-cache'], flags.timeout)
    }
  }

  private async runClassical(
    problemId: number,
    tickers: string[] | null,
    universe: string,
    covarianceMethod: string,
    useCache: boolean,
    timeout: number,
  ): Promise<void> {
    this.formatter.info(`Running classical optimization for problem #${problemId} (universe=${universe}, covariance_method=${covarianceMethod})...`)

    const result = await this.apiClient.post<Record<string, unknown>>(
      '/api/optimization/execute',
      {
        problem_id: problemId,
        universe: universe,
        covariance_method: covarianceMethod,
        asset_tickers: tickers,
        use_cache: useCache,
      },
      {timeout: timeout * 1000},
    )

    this.formatter.success('Optimization completed')
    this.formatter.output(result)
  }

  private async runGreedy(problemId: number, universe: string, covarianceMethod: string, timeout: number): Promise<void> {
    this.formatter.info(`Running greedy cluster optimization for problem #${problemId} (universe=${universe}, covariance_method=${covarianceMethod})...`)

    const result = await this.apiClient.post<Record<string, unknown>>(
      '/api/optimization/greedy-cluster',
      {request_id: problemId, universe: universe, covariance_method: covarianceMethod},
      {timeout: timeout * 1000},
    )

    this.formatter.success('Greedy optimization completed')
    this.formatter.output(result)
  }
}
