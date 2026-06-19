import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class DataValidate extends BaseCommand {
  static override description = 'Validate ticker codes'

  static override examples = [
    '<%= config.bin %> data validate 005930,000660,035420',
    '<%= config.bin %> data validate 005930 -o json',
  ]

  static override args = {
    tickers: Args.string({
      description: 'Comma-separated ticker codes',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(DataValidate)

    const tickers = args.tickers.split(',').map((t) => t.trim())

    const result = await this.sdkClient.data.validate(tickers)

    this.formatter.output(result)
  }
}
