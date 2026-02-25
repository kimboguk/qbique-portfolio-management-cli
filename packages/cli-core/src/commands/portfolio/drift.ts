import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class PortfolioDrift extends BaseCommand {
  static override description = 'Get portfolio drift analysis'

  static override examples = [
    '<%= config.bin %> portfolio drift 1',
  ]

  static override args = {
    id: Args.string({
      description: 'Request ID',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(PortfolioDrift)
    const result = await this.apiClient.get<Record<string, unknown>>(
      `/api/portfolio/drift/${args.id}`,
    )
    this.formatter.output(result)
  }
}
