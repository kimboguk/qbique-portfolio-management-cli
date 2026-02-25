import {BaseCommand} from '../../lib/base-command.js'
import {PluginManager} from '../../lib/plugin-manager.js'

export default class PluginsAvailable extends BaseCommand {
  static override description = 'List available Qbique plugins'

  static override examples = [
    '<%= config.bin %> plugins available',
    '<%= config.bin %> plugins available -o json',
  ]

  async run(): Promise<void> {
    const plugins = PluginManager.listAvailablePlugins()

    this.formatter.outputTable(
      plugins.map((p) => ({
        name: p.name,
        tier: p.tier,
        description: p.description,
        features: p.features.join(', '),
      })),
      ['name', 'tier', 'description', 'features'],
    )

    this.formatter.info(
      '\nInstall a plugin: qbique plugins install <plugin-name>',
    )
  }
}
