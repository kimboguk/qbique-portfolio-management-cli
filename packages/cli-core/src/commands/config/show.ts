import {BaseCommand} from '../../lib/base-command.js'

export default class ConfigShow extends BaseCommand {
  static override description = 'Show current configuration'

  static override examples = [
    '<%= config.bin %> config show',
    '<%= config.bin %> config show -o json',
  ]

  async run(): Promise<void> {
    const config = this.configManager.getConfig()
    const apiKey = this.configManager.getApiKey()
    const profiles = this.configManager.listProfiles()

    this.formatter.output({
      ...config,
      authenticated: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.slice(0, 8) + '...' : null,
      profiles,
    })
  }
}
