import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class ContractStatus extends BaseCommand {
  static override description = 'Get contract status'

  static override examples = [
    '<%= config.bin %> contract status 1',
    '<%= config.bin %> contract status 1 -o json',
  ]

  static override args = {
    id: Args.string({
      description: 'Request ID',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(ContractStatus)
    const result = await this.apiClient.get<Record<string, unknown>>(
      `/api/contracts/${args.id}/status`,
    )
    this.formatter.output(result)
  }
}
