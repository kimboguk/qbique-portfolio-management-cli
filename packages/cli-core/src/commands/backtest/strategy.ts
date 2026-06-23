import {Flags} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class BacktestStrategy extends BaseCommand {
  static override description =
    'Run a web-app-parity strategy backtest (greedy cluster selection). ' +
    'Reproduces the platform web backtest: portfolio method (RP/EW/MV/MS/HRP), ' +
    'universe, regime, covariance, lookback, stop-loss.'

  static override examples = [
    '<%= config.bin %> backtest strategy --start 2023-01-01 --end 2024-12-31 --strategy-method risk_parity --rebalance-freq monthly --universe US',
    '<%= config.bin %> backtest strategy --start 2010-01-01 --end 2025-12-31 --strategy-method equal_weight --universe US --cov-method ledoit_wolf',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    start: Flags.string({description: 'Start date (YYYY-MM-DD)', required: true}),
    end: Flags.string({description: 'End date (YYYY-MM-DD)', required: true}),
    'strategy-method': Flags.string({
      description: 'Portfolio method',
      options: ['max_sharpe', 'risk_parity', 'hrp', 'min_variance', 'equal_weight'],
      default: 'max_sharpe',
    }),
    'rebalance-freq': Flags.string({
      description: 'Rebalancing frequency (monthly, quarterly, semi_annual, annual, weekly)',
      default: 'monthly',
    }),
    universe: Flags.string({
      description: 'Asset universe',
      options: ['ALL', 'US'],
      default: 'US',
    }),
    'cov-method': Flags.string({
      description: 'Covariance estimator',
      options: ['sample', 'ledoit_wolf'],
      default: 'sample',
    }),
    'expected-return-method': Flags.string({
      description: 'Expected-return estimator',
      default: 'bayes_stein',
    }),
    'lookback-days': Flags.integer({description: 'Return lookback window (days)'}),
    'cov-lookback-days': Flags.integer({description: 'Covariance lookback window (days)'}),
    'k-max-per-cluster': Flags.integer({description: 'Max assets selected per cluster'}),
    'improvement-threshold': Flags.string({
      description: 'Greedy improvement threshold',
      default: '0.01',
    }),
    regime: Flags.boolean({description: 'Enable regime switching', default: false}),
    'regime-method': Flags.string({description: 'Regime detector method'}),
    'credit-spread': Flags.boolean({description: 'Enable credit-spread bond shelter', default: false}),
    'stop-loss': Flags.boolean({description: 'Enable stop-loss', default: false}),
    'stop-loss-threshold': Flags.string({
      description: 'Stop-loss threshold (fraction)',
      default: '0.20',
    }),
    'eval-method': Flags.string({
      description: 'Evaluation method',
      options: ['share_based', 'weight_based'],
      default: 'share_based',
    }),
    'realistic-pricing': Flags.boolean({description: 'Use open-entry/close-exit pricing', default: false}),
    benchmarks: Flags.string({description: 'Comma-separated benchmark tickers (e.g. SPY,QQQ)'}),
    capital: Flags.integer({description: 'Initial capital', default: 100_000_000}),
    wait: Flags.boolean({
      description: 'Wait for the backtest to complete',
      default: true,
      allowNo: true,
    }),
    timeout: Flags.integer({description: 'Max wait time in seconds', default: 300}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(BacktestStrategy)

    this.formatter.info(
      `Submitting ${flags['strategy-method']} backtest ` +
        `(${flags.universe}, ${flags['rebalance-freq']}, ${flags.start} ~ ${flags.end})...`,
    )

    const result = (await this.sdkClient.backtest.strategy({
      start: flags.start,
      end: flags.end,
      portfolioStrategy: flags['strategy-method'],
      rebalanceFreq: flags['rebalance-freq'],
      universe: flags.universe,
      initialCapital: flags.capital,
      improvementThreshold: Number.parseFloat(flags['improvement-threshold']),
      expectedReturnMethod: flags['expected-return-method'],
      covarianceMethod: flags['cov-method'],
      lookbackDays: flags['lookback-days'],
      covLookbackDays: flags['cov-lookback-days'],
      kMaxPerCluster: flags['k-max-per-cluster'],
      regimeEnabled: flags.regime,
      regimeMethod: flags['regime-method'],
      creditSpreadEnabled: flags['credit-spread'],
      stopLossEnabled: flags['stop-loss'],
      stopLossThreshold: Number.parseFloat(flags['stop-loss-threshold']),
      evaluationMethod: flags['eval-method'],
      useRealisticPricing: flags['realistic-pricing'],
      benchmarks: flags.benchmarks
        ? flags.benchmarks.split(',').map((b) => b.trim())
        : undefined,
    })) as Record<string, unknown>

    const jobId = result.job_id as string
    if (!jobId) {
      this.formatter.error('No job_id returned from backend.')
      this.exit(1)
      return
    }

    if (!flags.wait) {
      this.formatter.success(`Backtest submitted: ${jobId}`)
      this.formatter.output({job_id: jobId, status: result.status})
      return
    }

    await this.pollForCompletion(jobId, flags.timeout)
  }

  private async pollForCompletion(jobId: string, timeoutSec: number): Promise<void> {
    this.formatter.info(`Backtest job: ${jobId} — polling for results...`)
    const deadline = Date.now() + timeoutSec * 1000
    const pollInterval = 3000

    while (Date.now() < deadline) {
      const status = (await this.sdkClient.backtest.strategyStatus(jobId)) as Record<string, unknown>

      if (status.status === 'completed') {
        process.stderr.write('\n')
        this.formatter.success('Backtest completed')
        const results = await this.sdkClient.backtest.strategyResult(jobId)
        this.formatter.output(results)
        return
      }

      if (status.status === 'failed') {
        process.stderr.write('\n')
        this.formatter.error(`Backtest failed: ${status.message ?? status.error ?? 'unknown error'}`)
        this.exit(1)
        return
      }

      const prog = typeof status.progress === 'number' ? ` (${Math.round(status.progress * 100)}%)` : ''
      process.stderr.write(`\r  ${status.status}${prog}...`)

      await new Promise((r) => {
        setTimeout(r, pollInterval)
      })
    }

    process.stderr.write('\n')
    this.formatter.error(
      `Backtest timed out after ${timeoutSec}s. Check status with: qbique backtest status ${jobId}`,
    )
    this.exit(1)
  }
}
