import {Flags} from '@oclif/core'
import {readFileSync, existsSync} from 'node:fs'
import {resolve, extname} from 'node:path'
import * as YAML from 'yaml'
import {BaseCommand} from '../../lib/base-command.js'

export default class BacktestRun extends BaseCommand {
  static override description = 'Run a portfolio backtest'

  static override examples = [
    '<%= config.bin %> backtest run --tickers 005930,000660 --start 2023-01-01 --end 2024-12-31',
    '<%= config.bin %> backtest run --strategy ./momentum.yaml --start 2020-01-01 --end 2024-12-31',
    '<%= config.bin %> backtest run --tickers 005930,000660,035420 --start 2020-01-01 --end 2025-12-31 --schedule quarterly',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    strategy: Flags.string({
      char: 's',
      description: 'Path to YAML strategy file (alternative to --tickers)',
    }),
    tickers: Flags.string({
      description: 'Comma-separated ticker list',
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

    let request: Record<string, unknown>

    if (flags.strategy) {
      request = await this.buildStrategyRequest(flags)
    } else if (flags.tickers) {
      request = this.buildTickerRequest(flags)
    } else {
      this.formatter.error('Either --strategy or --tickers is required.')
      this.exit(1)
      return
    }

    const tickerCount = (request.tickers as string[])?.length ?? 'strategy-defined'
    this.formatter.info(`Starting backtest with ${tickerCount} tickers (${flags.start} ~ ${flags.end})...`)

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

    await this.pollForCompletion(jobId, flags.timeout)
  }

  private buildTickerRequest(flags: Record<string, unknown>): Record<string, unknown> {
    const tickers = (flags.tickers as string).split(',').map((t: string) => t.trim())
    return {
      tickers,
      start_date: flags.start,
      end_date: flags.end,
      schedule_type: flags.schedule,
      calendar_freq: flags.freq,
      drift_threshold: Number.parseFloat(flags['drift-threshold'] as string),
      benchmark: flags.benchmark,
      initial_capital: flags.capital,
    }
  }

  private async buildStrategyRequest(flags: Record<string, unknown>): Promise<Record<string, unknown>> {
    const filePath = resolve(flags.strategy as string)

    if (!existsSync(filePath)) {
      this.formatter.error(`Strategy file not found: ${filePath}`)
      this.exit(1)
    }

    const ext = extname(filePath).toLowerCase()
    if (ext !== '.yaml' && ext !== '.yml') {
      this.formatter.error(`Unsupported file format: ${ext}. Use YAML (.yaml, .yml).`)
      this.exit(1)
    }

    let raw: string
    try {
      raw = readFileSync(filePath, 'utf8')
    } catch {
      this.formatter.error(`Cannot read file: ${filePath}`)
      this.exit(1)
      return {}
    }

    let doc: Record<string, unknown>
    try {
      doc = YAML.parse(raw) as Record<string, unknown>
    } catch (error) {
      this.formatter.error(`Invalid YAML: ${(error as Error).message}`)
      this.exit(1)
      return {}
    }

    // Push strategy to server first
    const metadata = doc.metadata as Record<string, unknown> | undefined
    const spec = doc.spec as Record<string, unknown> | undefined
    const optimization = spec?.optimization as Record<string, unknown> | undefined
    const parameters = spec?.parameters as Record<string, unknown> | undefined
    const constraints = spec?.constraints as Array<Record<string, unknown>> | undefined
    const assets = spec?.assets as Record<string, unknown> | undefined

    this.formatter.info(`Pushing strategy "${metadata?.name ?? 'unnamed'}" to server...`)

    const pushResult = await this.apiClient.post<{
      success: boolean
      strategy_id?: number
    }>('/api/cli/strategy/push', {
      name: (metadata?.name as string) ?? 'backtest-strategy',
      description: (metadata?.description as string) ?? '',
      strategy_yaml: raw,
      spec: {
        method: (optimization?.method as string) ?? 'sharpe_ratio',
        framework: (optimization?.framework as string) ?? 'mvo',
        objective: (optimization?.objective as string) ?? 'sharpe_ratio',
        risk_function: (optimization?.risk_function as string) ?? 'volatility',
        constraints: (constraints ?? []).map((c) => ({
          type: c.type as string,
          value: c.value ?? null,
          enabled: (c.enabled as boolean) ?? true,
        })),
        risk_free_rate: (parameters?.risk_free_rate as number) ?? 0.02,
        lookback_days: (parameters?.lookback_days as number) ?? 504,
        optimization_period: (parameters?.optimization_period as string) ?? 'single',
        asset_universe: (assets?.universe as string) ?? 'all',
        tickers: (assets?.tickers as string[]) ?? null,
      },
    })

    // Build backtest request using pushed strategy's tickers or overridden tickers
    const tickers = flags.tickers
      ? (flags.tickers as string).split(',').map((t: string) => t.trim())
      : (assets?.tickers as string[]) ?? []

    return {
      strategy_id: pushResult.strategy_id,
      tickers,
      start_date: flags.start,
      end_date: flags.end,
      schedule_type: flags.schedule,
      calendar_freq: flags.freq,
      drift_threshold: Number.parseFloat(flags['drift-threshold'] as string),
      benchmark: flags.benchmark,
      initial_capital: flags.capital,
      strategy_yaml: raw,
    }
  }

  private async pollForCompletion(jobId: string, timeoutSec: number): Promise<void> {
    this.formatter.info(`Backtest job: ${jobId} — polling for results...`)
    const deadline = Date.now() + timeoutSec * 1000
    const pollInterval = 2000

    while (Date.now() < deadline) {
      const status = await this.apiClient.get<{
        job_id: string
        status: string
        progress?: number
        message?: string
      }>(`/api/backtest/status/${jobId}`)

      if (status.status === 'completed') {
        process.stderr.write('\n')
        this.formatter.success('Backtest completed')
        const results = await this.apiClient.get<Record<string, unknown>>(
          `/api/backtest/results/${jobId}`,
        )
        this.formatter.output(results)
        return
      }

      if (status.status === 'failed') {
        process.stderr.write('\n')
        this.formatter.error(`Backtest failed: ${status.message ?? 'unknown error'}`)
        this.exit(1)
        return
      }

      const pct = status.progress ? ` (${status.progress}%)` : ''
      process.stderr.write(`\r  ${status.status}${pct}...`)

      await new Promise((r) => {
        setTimeout(r, pollInterval)
      })
    }

    process.stderr.write('\n')
    this.formatter.error(`Backtest timed out after ${timeoutSec}s. Check status with: qbique backtest status ${jobId}`)
    this.exit(1)
  }
}
