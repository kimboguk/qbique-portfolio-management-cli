import {Flags} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class BacktestRun extends BaseCommand {
  static override description = 'Run a portfolio backtest'

  static override examples = [
    '<%= config.bin %> backtest run --tickers 005930,000660 --start 2023-01-01 --end 2024-12-31',
    '<%= config.bin %> backtest run --tickers 005930,000660,035420 --start 2020-01-01 --end 2025-12-31 --schedule quarterly',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    tickers: Flags.string({
      description: 'Comma-separated ticker list',
      required: true,
    }),
    start: Flags.string({
      description: 'Start date (YYYY-MM-DD)',
      required: true,
    }),
    end: Flags.string({
      description: 'End date (YYYY-MM-DD)',
      required: true,
    }),
    schedule: Flags.string({
      description: 'Rebalancing schedule type (calendar, custom, drift)',
      default: 'calendar',
    }),
    freq: Flags.string({
      description: 'Calendar rebalancing frequency (monthly, quarterly, semi_annual, annual)',
      default: 'quarterly',
    }),
    'drift-threshold': Flags.string({
      description: 'Drift threshold percentage (1.0-20.0)',
      default: '5.0',
    }),
    benchmark: Flags.string({
      description: 'Benchmark index (default: KOSPI)',
      default: 'KOSPI',
    }),
    capital: Flags.integer({
      description: 'Initial capital (default: 100000000)',
      default: 100_000_000,
    }),
    wait: Flags.boolean({
      description: 'Wait for backtest to complete (default: true)',
      default: true,
      allowNo: true,
    }),
    timeout: Flags.integer({
      description: 'Max wait time in seconds (default: 300)',
      default: 300,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(BacktestRun)

    const tickers = flags.tickers.split(',').map((t) => t.trim())
    const request = {
      tickers,
      start_date: flags.start,
      end_date: flags.end,
      schedule_type: flags.schedule,
      calendar_freq: flags.freq,
      drift_threshold: Number.parseFloat(flags['drift-threshold']),
      benchmark: flags.benchmark,
      initial_capital: flags.capital,
    }

    this.formatter.info(`Starting backtest with ${tickers.length} tickers (${flags.start} ~ ${flags.end})...`)

    const result = await this.apiClient.post<{
      job_id: string
      status: string
      message?: string
    }>('/api/backtest/run', request)

    const jobId = result.job_id

    if (!flags.wait) {
      this.formatter.success(`Backtest submitted: ${jobId}`)
      this.formatter.output({job_id: jobId, status: result.status})
      return
    }

    // Poll for completion
    this.formatter.info(`Backtest job: ${jobId} — polling for results...`)
    const deadline = Date.now() + flags.timeout * 1000
    const pollInterval = 2000

    while (Date.now() < deadline) {
      const status = await this.apiClient.get<{
        job_id: string
        status: string
        progress?: number
        message?: string
      }>(`/api/backtest/status/${jobId}`)

      if (status.status === 'completed') {
        this.formatter.success('Backtest completed')
        const results = await this.apiClient.get<Record<string, unknown>>(
          `/api/backtest/results/${jobId}`,
        )
        this.formatter.output(results)
        return
      }

      if (status.status === 'failed') {
        this.formatter.error(`Backtest failed: ${status.message ?? 'unknown error'}`)
        this.exit(1)
        return
      }

      // Still running
      const pct = status.progress ? ` (${status.progress}%)` : ''
      process.stderr.write(`\r  ${status.status}${pct}...`)

      await new Promise((resolve) => {
        setTimeout(resolve, pollInterval)
      })
    }

    this.formatter.error(`Backtest timed out after ${flags.timeout}s. Check status with: qbique backtest status ${jobId}`)
    this.exit(1)
  }
}
