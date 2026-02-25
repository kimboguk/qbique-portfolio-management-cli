import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class ConfigSet extends BaseCommand {
  static override description = 'Set a configuration value'

  static override examples = [
    '<%= config.bin %> config set endpoint http://10.0.0.5:8001',
    '<%= config.bin %> config set defaultOutput json',
    '<%= config.bin %> config set timeout 60000',
  ]

  static override args = {
    key: Args.string({
      description: 'Config key (endpoint, defaultOutput, timeout, profile)',
      required: true,
    }),
    value: Args.string({
      description: 'Value to set',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(ConfigSet)

    try {
      this.configManager.setFromString(args.key, args.value)
      this.formatter.success(`${args.key} = ${args.value}`)
    } catch (error) {
      this.formatter.error((error as Error).message)
      this.exit(1)
    }
  }
}
