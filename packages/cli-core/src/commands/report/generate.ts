import {Flags} from '@oclif/core'
import {readFileSync} from 'node:fs'
import {BaseCommand} from '../../lib/base-command.js'

export default class ReportGenerate extends BaseCommand {
  static override description = 'Generate an interpretation report from optimization results'

  static override examples = [
    '<%= config.bin %> report generate --data results.json',
    '<%= config.bin %> report generate --data results.json -o json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    data: Flags.string({
      description: 'Path to JSON file with frontier_data, greedy_result, problem_definition',
      required: true,
    }),
    timeout: Flags.integer({
      description: 'Request timeout in seconds (default: 120)',
      default: 120,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ReportGenerate)

    let body: Record<string, unknown>
    try {
      const raw = readFileSync(flags.data, 'utf8')
      body = JSON.parse(raw)
    } catch (error) {
      this.formatter.error(`Cannot read/parse file: ${(error as Error).message}`)
      this.exit(1)
      return
    }

    this.formatter.info('Generating report (this may take a moment)...')

    const result = await this.apiClient.post<Record<string, unknown>>(
      '/api/reports/generate',
      body,
      {timeout: flags.timeout * 1000},
    )

    this.formatter.success('Report generated')
    this.formatter.output(result)
  }
}
