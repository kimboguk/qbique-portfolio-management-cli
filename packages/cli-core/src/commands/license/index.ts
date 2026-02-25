import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'
import {LicenseManager} from '../../lib/license-manager.js'

export default class License extends BaseCommand {
  static override description = 'Manage plugin licenses'

  static override examples = [
    '<%= config.bin %> license list',
    '<%= config.bin %> license activate @qbique/plugin-quantum <key>',
    '<%= config.bin %> license deactivate @qbique/plugin-quantum',
  ]

  static override args = {
    action: Args.string({
      description: 'Action: list, activate, deactivate',
      required: true,
      options: ['list', 'activate', 'deactivate'],
    }),
    plugin: Args.string({
      description: 'Plugin name (for activate/deactivate)',
    }),
    key: Args.string({
      description: 'License key (for activate)',
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(License)
    const licenseManager = new LicenseManager()

    switch (args.action) {
      case 'list':
        this.listLicenses(licenseManager)
        break
      case 'activate':
        this.activateLicense(licenseManager, args.plugin, args.key)
        break
      case 'deactivate':
        this.deactivateLicense(licenseManager, args.plugin)
        break
    }
  }

  private listLicenses(lm: LicenseManager): void {
    const licenses = lm.list()

    if (licenses.length === 0) {
      this.formatter.info('No plugin licenses activated.')
      this.formatter.info('  Activate: qbique license activate <plugin> <key>')
      return
    }

    this.formatter.outputTable(
      licenses.map((l) => ({
        plugin: l.plugin,
        tier: l.tier,
        valid: l.valid ? 'yes' : 'no',
        expires: l.expiresAt ?? 'never',
        checked: l.checkedAt.slice(0, 10),
      })),
      ['plugin', 'tier', 'valid', 'expires', 'checked'],
    )
  }

  private activateLicense(lm: LicenseManager, plugin?: string, key?: string): void {
    if (!plugin || !key) {
      this.formatter.error('Usage: qbique license activate <plugin-name> <license-key>')
      this.exit(1)
      return
    }

    // TODO: 서버 검증 후 저장 (현재는 로컬만)
    lm.activate(plugin, key, 'premium')
    this.formatter.success(`License activated for ${plugin}`)
  }

  private deactivateLicense(lm: LicenseManager, plugin?: string): void {
    if (!plugin) {
      this.formatter.error('Usage: qbique license deactivate <plugin-name>')
      this.exit(1)
      return
    }

    lm.deactivate(plugin)
    this.formatter.success(`License deactivated for ${plugin}`)
  }
}
