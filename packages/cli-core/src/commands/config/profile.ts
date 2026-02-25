import {Args, Flags} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'

export default class ConfigProfile extends BaseCommand {
  static override description = 'Manage configuration profiles'

  static override examples = [
    '<%= config.bin %> config profile list',
    '<%= config.bin %> config profile create production',
    '<%= config.bin %> config profile use production',
    '<%= config.bin %> config profile delete staging',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    endpoint: Flags.string({
      description: 'API endpoint for the new profile',
    }),
  }

  static override args = {
    action: Args.string({
      description: 'Action: list, create, use, delete',
      required: true,
      options: ['list', 'create', 'use', 'delete'],
    }),
    name: Args.string({
      description: 'Profile name',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(ConfigProfile)

    switch (args.action) {
      case 'list':
        this.listProfiles()
        break
      case 'create':
        this.createProfile(args.name, flags.endpoint)
        break
      case 'use':
        this.useProfile(args.name)
        break
      case 'delete':
        this.deleteProfile(args.name)
        break
    }
  }

  private listProfiles(): void {
    const profiles = this.configManager.listProfiles()
    const currentProfile = this.configManager.get('profile')

    if (profiles.length === 0) {
      this.formatter.info('No profiles configured. Create one with: qbique config profile create <name>')
      return
    }

    const rows = profiles.map((name) => ({
      name,
      active: name === currentProfile ? '*' : '',
      authenticated: this.configManager.getApiKey(name) ? 'yes' : 'no',
    }))

    this.formatter.outputTable(rows, ['name', 'active', 'authenticated'])
  }

  private createProfile(name: string | undefined, endpoint: string | undefined): void {
    if (!name) {
      this.formatter.error('Profile name is required. Usage: qbique config profile create <name>')
      this.exit(1)
      return
    }

    const existing = this.configManager.listProfiles()
    if (existing.includes(name)) {
      this.formatter.error(`Profile "${name}" already exists.`)
      this.exit(1)
      return
    }

    // Save an empty credential entry to register the profile
    const ep = endpoint ?? this.configManager.get('endpoint')
    this.configManager.saveApiKey('', ep, name)
    this.formatter.success(`Profile "${name}" created. Authenticate with: qbique auth login --profile ${name}`)
  }

  private useProfile(name: string | undefined): void {
    if (!name) {
      this.formatter.error('Profile name is required. Usage: qbique config profile use <name>')
      this.exit(1)
      return
    }

    const existing = this.configManager.listProfiles()
    if (!existing.includes(name)) {
      this.formatter.error(`Profile "${name}" does not exist. Create it first with: qbique config profile create ${name}`)
      this.exit(1)
      return
    }

    this.configManager.set('profile', name)
    this.formatter.success(`Switched to profile "${name}"`)
  }

  private deleteProfile(name: string | undefined): void {
    if (!name) {
      this.formatter.error('Profile name is required. Usage: qbique config profile delete <name>')
      this.exit(1)
      return
    }

    const currentProfile = this.configManager.get('profile')
    if (name === currentProfile) {
      this.formatter.error(`Cannot delete the active profile "${name}". Switch to another profile first.`)
      this.exit(1)
      return
    }

    const existing = this.configManager.listProfiles()
    if (!existing.includes(name)) {
      this.formatter.error(`Profile "${name}" does not exist.`)
      this.exit(1)
      return
    }

    this.configManager.removeApiKey(name)
    this.formatter.success(`Profile "${name}" deleted.`)
  }
}
