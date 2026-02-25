import {Args, Flags} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class BacktestCompare extends BaseCommand {
  static override description = 'Compare two backtest results side by side'

  static override examples = [
    '<%= config.bin %> backtest compare abc-123 def-456',
    '<%= config.bin %> backtest compare abc-123 def-456 -o json',
    '<%= config.bin %> backtest compare abc-123 def-456 --metrics sharpe,maxdd,cagr',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    metrics: Flags.string({
      description: 'Comma-separated metrics to compare (default: all)',
    }),
  }

  static override args = {
    id_a: Args.string({
      description: 'First backtest job ID',
      required: true,
    }),
    id_b: Args.string({
      description: 'Second backtest job ID',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(BacktestCompare)

    this.formatter.info(`Comparing backtests: ${args.id_a} vs ${args.id_b}...`)

    const [resultA, resultB] = await Promise.all([
      this.apiClient.get<Record<string, unknown>>(`/api/backtest/results/${args.id_a}`),
      this.apiClient.get<Record<string, unknown>>(`/api/backtest/results/${args.id_b}`),
    ])

    const metricsFilter = flags.metrics?.split(',').map((m) => m.trim()) ?? null

    const comparison = this.buildComparison(resultA, resultB, args.id_a, args.id_b, metricsFilter)

    this.formatter.output(comparison)
  }

  private buildComparison(
    a: Record<string, unknown>,
    b: Record<string, unknown>,
    idA: string,
    idB: string,
    metricsFilter: string[] | null,
  ): Record<string, unknown>[] {
    // Extract performance metrics from both results
    const metricsA = this.extractMetrics(a)
    const metricsB = this.extractMetrics(b)

    const allKeys = [...new Set([...Object.keys(metricsA), ...Object.keys(metricsB)])]
    const filteredKeys = metricsFilter
      ? allKeys.filter((k) => metricsFilter.some((f) => k.toLowerCase().includes(f.toLowerCase())))
      : allKeys

    return filteredKeys.map((key) => {
      const valA = metricsA[key]
      const valB = metricsB[key]
      const diff = typeof valA === 'number' && typeof valB === 'number'
        ? valB - valA
        : null

      return {
        metric: key,
        [idA.slice(0, 8)]: this.formatValue(valA),
        [idB.slice(0, 8)]: this.formatValue(valB),
        diff: diff !== null ? this.formatDiff(diff) : '-',
      }
    })
  }

  private extractMetrics(result: Record<string, unknown>): Record<string, unknown> {
    // Try common metric locations in the response
    const metrics: Record<string, unknown> = {}

    const performance = result.performance as Record<string, unknown> | undefined
    const summary = result.summary as Record<string, unknown> | undefined
    const data = performance ?? summary ?? result

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number' || typeof value === 'string') {
        metrics[key] = value
      }
    }

    return metrics
  }

  private formatValue(value: unknown): string {
    if (value === undefined || value === null) return '-'
    if (typeof value === 'number') {
      return Math.abs(value) < 1 ? (value * 100).toFixed(2) + '%' : value.toFixed(4)
    }

    return String(value)
  }

  private formatDiff(diff: number): string {
    const prefix = diff > 0 ? '+' : ''
    if (Math.abs(diff) < 1) {
      return prefix + (diff * 100).toFixed(2) + '%'
    }

    return prefix + diff.toFixed(4)
  }
}
