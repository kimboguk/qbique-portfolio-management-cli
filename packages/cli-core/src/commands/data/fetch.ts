import {Flags} from '@oclif/core'
import {writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {BaseCommand} from '../../lib/base-command.js'

export default class DataFetch extends BaseCommand {
  static override description = 'Fetch market data for a universe or specific tickers'

  static override examples = [
    '<%= config.bin %> data fetch --universe KOSPI200',
    '<%= config.bin %> data fetch --tickers 005930,000660 --from 2020-01-01',
    '<%= config.bin %> data fetch --universe KOSPI200 --from 2023-01-01 --to 2024-12-31 --save ./data.json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    universe: Flags.string({
      char: 'u',
      description: 'Asset universe (e.g., KOSPI200, KOSDAQ150)',
    }),
    tickers: Flags.string({
      description: 'Comma-separated ticker codes',
    }),
    from: Flags.string({
      description: 'Start date (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'End date (YYYY-MM-DD)',
    }),
    save: Flags.string({
      description: 'Save result to file path',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(DataFetch)

    if (!flags.universe && !flags.tickers) {
      this.formatter.error('Either --universe or --tickers is required.')
      this.exit(1)
      return
    }

    const params: Record<string, unknown> = {}
    if (flags.universe) params.universe = flags.universe
    if (flags.tickers) params.tickers = flags.tickers.split(',').map((t) => t.trim())
    if (flags.from) params.start_date = flags.from
    if (flags.to) params.end_date = flags.to

    const label = flags.universe ?? flags.tickers
    this.formatter.info(`Fetching market data for ${label}...`)

    const result = await this.apiClient.post<Record<string, unknown>>(
      '/api/cli/data/fetch',
      params,
    )

    if (flags.save) {
      const outputPath = resolve(flags.save)
      writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8')
      this.formatter.success(`Data saved to ${outputPath}`)
    } else {
      this.formatter.output(result)
    }
  }
}
