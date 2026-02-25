/**
 * BaseCommand — 모든 Qbique CLI 명령어의 부모 클래스
 *
 * 제공 기능:
 * - --output json|table|yaml 글로벌 플래그
 * - --no-color 플래그
 * - ApiClient 자동 주입 (인증 헤더 포함)
 * - OutputFormatter 자동 주입
 * - 표준화된 에러 핸들링
 */
import {Command, Flags} from '@oclif/core'
import {ConfigManager} from './config-manager.js'
import {ApiClient} from './api-client.js'
import {OutputFormatter} from './output-formatter.js'
import type {OutputFormat} from '../types/index.js'

export abstract class BaseCommand extends Command {
  static baseFlags = {
    output: Flags.string({
      char: 'o',
      description: 'Output format (json, table, yaml)',
      options: ['json', 'table', 'yaml'],
    }),
    'no-color': Flags.boolean({
      description: 'Disable colored output',
      default: false,
    }),
  }

  protected configManager!: ConfigManager
  protected apiClient!: ApiClient
  protected formatter!: OutputFormatter

  async init(): Promise<void> {
    await super.init()

    const {flags} = await this.parse(this.constructor as typeof BaseCommand)

    this.configManager = new ConfigManager()

    const outputFormat = (flags.output as OutputFormat | undefined)
      ?? this.configManager.get('defaultOutput')
      ?? 'table'

    this.formatter = new OutputFormatter(outputFormat)
    this.apiClient = new ApiClient(this.configManager)
  }

  async catch(error: Error & {exitCode?: number}): Promise<void> {
    if (this.formatter) {
      this.formatter.error(error.message)
    } else {
      process.stderr.write(`✗ ${error.message}\n`)
    }

    this.exit(error.exitCode ?? 1)
  }
}
