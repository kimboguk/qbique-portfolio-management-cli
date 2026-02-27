import {Args, Flags} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class ContractOos extends BaseCommand {
  static override description = 'List or inspect OOS backtest runs for a contract'

  static override examples = [
    '<%= config.bin %> contract oos 42',
    '<%= config.bin %> contract oos 42 -o json',
    '<%= config.bin %> contract oos 42 abc-uuid-123',
    '<%= config.bin %> contract oos 42 abc-uuid-123 --delete',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    delete: Flags.boolean({
      description: 'Delete the specified OOS run',
      default: false,
    }),
  }

  static override args = {
    request_id: Args.string({
      description: 'Contract request ID',
      required: true,
    }),
    run_uuid: Args.string({
      description: 'OOS run UUID (omit to list all runs)',
      required: false,
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(ContractOos)

    if (args.run_uuid) {
      if (flags.delete) {
        await this.apiClient.delete(`/api/oos-backtest/runs/${args.run_uuid}`)
        this.formatter.success(`OOS run ${args.run_uuid} deleted`)
      } else {
        const result = await this.apiClient.get(`/api/oos-backtest/runs/${args.run_uuid}`)
        this.formatter.output(result)
      }
    } else {
      const result = await this.apiClient.get(`/api/oos-backtest/${args.request_id}/runs`)
      this.formatter.output(result)
    }
  }
}
