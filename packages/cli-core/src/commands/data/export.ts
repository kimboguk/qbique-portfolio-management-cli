import {Flags} from '@oclif/core'
import {writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {BaseCommand} from '../../lib/base-command.js'

export default class DataExport extends BaseCommand {
  static override description = 'Export market data from the platform'

  static override examples = [
    '<%= config.bin %> data export --dataset prices --tickers 005930,000660',
    '<%= config.bin %> data export --dataset prices --format csv --output ./export.csv',
    '<%= config.bin %> data export --dataset returns --tickers 005930 --from 2023-01-01',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    dataset: Flags.string({
      description: 'Dataset to export (prices, returns, signals)',
      required: true,
    }),
    tickers: Flags.string({
      description: 'Comma-separated ticker codes to filter',
    }),
    from: Flags.string({
      description: 'Start date (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'End date (YYYY-MM-DD)',
    }),
    format: Flags.string({
      char: 'f',
      description: 'Export format (json, csv)',
      options: ['json', 'csv'],
      default: 'json',
    }),
    output: Flags.string({
      description: 'Output file path (prints to stdout if omitted)',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(DataExport)

    const params: Record<string, unknown> = {
      dataset: flags.dataset,
      format: flags.format,
    }
    if (flags.tickers) params.tickers = flags.tickers.split(',').map((t) => t.trim())
    if (flags.from) params.start_date = flags.from
    if (flags.to) params.end_date = flags.to

    this.formatter.info(`Exporting ${flags.dataset} data...`)

    const result = await this.apiClient.post<{
      data: unknown
      count?: number
      format?: string
    }>(
      '/api/cli/data/export',
      params,
    )

    let content: string
    if (flags.format === 'csv' && typeof result.data === 'string') {
      content = result.data
    } else {
      content = JSON.stringify(result.data ?? result, null, 2)
    }

    if (flags.output) {
      const outputPath = resolve(flags.output)
      writeFileSync(outputPath, content, 'utf8')
      this.formatter.success(`Exported ${result.count ?? '?'} records to ${outputPath}`)
    } else {
      process.stdout.write(content + '\n')
    }
  }
}
