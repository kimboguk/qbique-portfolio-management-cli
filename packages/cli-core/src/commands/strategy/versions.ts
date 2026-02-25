import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class StrategyVersions extends BaseCommand {
  static override description = 'List version history of a strategy'

  static override examples = [
    '<%= config.bin %> strategy versions 1',
    '<%= config.bin %> strategy versions 1 -o json',
  ]

  static override args = {
    id: Args.integer({
      description: 'Strategy ID',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(StrategyVersions)

    const result = await this.apiClient.get<{
      strategy_id: number
      name: string
      versions: Array<{
        version: string
        tag?: string
        created_at: string
        description?: string
      }>
    }>(
      `/api/cli/strategy/${args.id}/versions`,
    )

    if (!result.versions || result.versions.length === 0) {
      this.formatter.info(`No versions found for strategy #${args.id}`)
      return
    }

    this.formatter.info(`Strategy: ${result.name} (#${result.strategy_id})`)
    this.formatter.outputTable(
      result.versions.map((v) => ({
        version: v.version,
        tag: v.tag ?? '-',
        created_at: v.created_at,
        description: v.description ?? '',
      })),
      ['version', 'tag', 'created_at', 'description'],
    )
  }
}
