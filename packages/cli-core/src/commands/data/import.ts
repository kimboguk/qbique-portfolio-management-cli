import {Flags} from '@oclif/core'
import {readFileSync} from 'node:fs'
import {resolve, extname} from 'node:path'
import * as YAML from 'yaml'
import {BaseCommand} from '../../lib/base-command.js'

export default class DataImport extends BaseCommand {
  static override description = 'Import market data from a local file via backend API'

  static override examples = [
    '<%= config.bin %> data import --file ./prices.csv --dataset prices',
    '<%= config.bin %> data import --file ./signals.json --dataset signals',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({
      char: 'f',
      description: 'Path to data file (CSV, JSON, YAML)',
      required: true,
    }),
    dataset: Flags.string({
      description: 'Target dataset name (e.g., prices, signals, returns)',
      required: true,
    }),
    'date-column': Flags.string({
      description: 'Name of the date column in CSV (default: date)',
      default: 'date',
    }),
    'ticker-column': Flags.string({
      description: 'Name of the ticker column in CSV (default: ticker)',
      default: 'ticker',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(DataImport)

    const filePath = resolve(flags.file)
    let raw: string
    try {
      raw = readFileSync(filePath, 'utf8')
    } catch {
      this.formatter.error(`Cannot read file: ${filePath}`)
      this.exit(1)
      return
    }

    const ext = extname(filePath).toLowerCase()
    let data: unknown

    if (ext === '.csv') {
      data = this.parseCsv(raw)
    } else if (ext === '.json') {
      try {
        data = JSON.parse(raw)
      } catch {
        this.formatter.error('Invalid JSON file.')
        this.exit(1)
        return
      }
    } else if (ext === '.yaml' || ext === '.yml') {
      try {
        data = YAML.parse(raw)
      } catch {
        this.formatter.error('Invalid YAML file.')
        this.exit(1)
        return
      }
    } else {
      this.formatter.error(`Unsupported file format: ${ext}. Use CSV, JSON, or YAML.`)
      this.exit(1)
      return
    }

    this.formatter.info(`Importing ${flags.dataset} from ${flags.file}...`)

    const result = await this.apiClient.post<Record<string, unknown>>(
      '/api/cli/data/import',
      {
        dataset: flags.dataset,
        data,
        metadata: {
          source_file: flags.file,
          date_column: flags['date-column'],
          ticker_column: flags['ticker-column'],
        },
      },
    )

    this.formatter.success('Data imported successfully')
    this.formatter.output(result)
  }

  private parseCsv(raw: string): Record<string, string>[] {
    const lines = raw.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"(.*)"$/, '$1'))
    const rows: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"(.*)"$/, '$1'))
      const row: Record<string, string> = {}
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] ?? ''
      }

      rows.push(row)
    }

    return rows
  }
}
