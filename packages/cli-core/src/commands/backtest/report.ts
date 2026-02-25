import {Args, Flags} from '@oclif/core'
import {writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {BaseCommand} from '../../lib/base-command.js'

export default class BacktestReport extends BaseCommand {
  static override description = 'Generate a backtest report'

  static override examples = [
    '<%= config.bin %> backtest report abc-123',
    '<%= config.bin %> backtest report abc-123 --format json --output ./report.json',
    '<%= config.bin %> backtest report abc-123 --format csv',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    format: Flags.string({
      char: 'f',
      description: 'Report format (json, csv)',
      options: ['json', 'csv'],
      default: 'json',
    }),
    output: Flags.string({
      description: 'Output file path (prints to stdout if omitted)',
    }),
  }

  static override args = {
    id: Args.string({
      description: 'Backtest job ID',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(BacktestReport)

    this.formatter.info(`Generating ${flags.format} report for backtest ${args.id}...`)

    const result = await this.apiClient.get<Record<string, unknown>>(
      `/api/backtest/results/${args.id}`,
    )

    let content: string
    if (flags.format === 'csv') {
      content = this.toCsv(result)
    } else {
      content = JSON.stringify(result, null, 2)
    }

    if (flags.output) {
      const outputPath = resolve(flags.output)
      writeFileSync(outputPath, content, 'utf8')
      this.formatter.success(`Report saved to ${outputPath}`)
    } else {
      process.stdout.write(content + '\n')
    }
  }

  private toCsv(data: Record<string, unknown>): string {
    // Flatten nested data to rows
    const rows: string[][] = []
    const flatEntries = this.flatten(data)

    rows.push(['metric', 'value'])
    for (const [key, value] of Object.entries(flatEntries)) {
      rows.push([key, String(value ?? '')])
    }

    return rows.map((row) => row.map((cell) => this.escapeCsv(cell)).join(',')).join('\n')
  }

  private flatten(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flatten(value as Record<string, unknown>, fullKey))
      } else {
        result[fullKey] = value
      }
    }

    return result
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"'
    }

    return value
  }
}
