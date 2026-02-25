import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class DataSearch extends BaseCommand {
  static override description = 'Search for tickers by name or code'

  static override examples = [
    '<%= config.bin %> data search 삼성',
    '<%= config.bin %> data search samsung -o json',
  ]

  static override args = {
    query: Args.string({
      description: 'Search query (ticker code or company name)',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(DataSearch)

    const result = await this.apiClient.post<Record<string, unknown>>(
      '/api/optimization/search-tickers',
      {query: args.query},
    )

    this.formatter.output(result)
  }
}
