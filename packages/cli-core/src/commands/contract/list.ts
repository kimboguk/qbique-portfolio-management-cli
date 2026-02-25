import {BaseCommand} from '../../lib/base-command.js'

export default class ContractList extends BaseCommand {
  static override description = 'List all contracts'

  static override examples = [
    '<%= config.bin %> contract list',
    '<%= config.bin %> contract list -o json',
  ]

  async run(): Promise<void> {
    const result = await this.apiClient.get<Record<string, unknown>[]>(
      '/api/contracts/list',
    )
    this.formatter.output(result)
  }
}
