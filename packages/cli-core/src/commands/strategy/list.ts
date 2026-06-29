import {BaseCommand} from '../../lib/base-command.js'

interface MethodInfo {
  id: string
  name: string
  description: string
  optimizer_class?: string
  method_name?: string
}

export default class StrategyList extends BaseCommand {
  static override description = 'List available optimization methods'

  static override examples = [
    '<%= config.bin %> strategy list',
    '<%= config.bin %> strategy list -o json',
  ]

  async run(): Promise<void> {
    const result = await this.sdkClient.strategy.list()
    const data = result as Record<string, unknown>
    // 백엔드 응답: { success, methods: [...] }. (구버전 호환: data.data)
    const methods = (data.methods as MethodInfo[]) ?? (data.data as MethodInfo[]) ?? []

    if (!methods || methods.length === 0) {
      this.formatter.info('No optimization methods available.')
      return
    }

    this.formatter.outputTable(
      methods.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
      })),
      ['id', 'name', 'description'],
    )
  }
}
