import {Flags} from '@oclif/core'
import {readFileSync} from 'node:fs'
import {extname} from 'node:path'
import * as YAML from 'yaml'
import {BaseCommand} from '../../lib/base-command.js'

export default class StrategyValidate extends BaseCommand {
  static override description = 'Validate a strategy file (YAML or Python) without creating it'

  static override examples = [
    '<%= config.bin %> strategy validate --file strategy.yaml',
    '<%= config.bin %> strategy validate -f examples/balanced.yaml -o json',
    '<%= config.bin %> strategy validate -f momentum.py',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({
      char: 'f',
      description: 'Path to strategy file (.yaml, .yml, or .py)',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(StrategyValidate)

    const ext = extname(flags.file).toLowerCase()

    if (ext === '.py') {
      await this.validatePython(flags.file)
    } else if (ext === '.yaml' || ext === '.yml') {
      await this.validateYaml(flags.file)
    } else {
      this.formatter.error(`Unsupported file format: ${ext}. Use .yaml, .yml, or .py`)
      this.exit(1)
    }
  }

  private async validatePython(filePath: string): Promise<void> {
    let raw: string
    try {
      raw = readFileSync(filePath, 'utf8')
    } catch {
      this.formatter.error(`Cannot read file: ${filePath}`)
      this.exit(1)
      return
    }

    const result = await this.apiClient.post<Record<string, unknown>>(
      '/api/cli/strategy/validate/python',
      {strategy_code: raw},
    )

    const resultData = result as {success?: boolean; data?: {class_name?: string; warnings?: string[]}; error?: {details?: string[]}}
    if (resultData.success) {
      this.formatter.success(
        `Python strategy is valid` +
        (resultData.data?.class_name ? ` (class: ${resultData.data.class_name})` : ''),
      )
      if (resultData.data?.warnings) {
        for (const w of resultData.data.warnings) {
          this.formatter.info(`Warning: ${w}`)
        }
      }
    } else {
      this.formatter.error('Python strategy validation failed')
      const details = resultData.error?.details
      if (Array.isArray(details)) {
        for (const d of details) {
          this.formatter.error(`  - ${d}`)
        }
      }
    }

    this.formatter.output(result)
  }

  private async validateYaml(filePath: string): Promise<void> {
    let raw: string
    try {
      raw = readFileSync(filePath, 'utf8')
    } catch {
      this.formatter.error(`Cannot read file: ${filePath}`)
      this.exit(1)
      return
    }

    let doc: Record<string, unknown>
    try {
      doc = YAML.parse(raw) as Record<string, unknown>
    } catch (error) {
      this.formatter.error(`Invalid YAML: ${(error as Error).message}`)
      this.exit(1)
      return
    }

    const metadata = doc.metadata as Record<string, unknown> | undefined
    const spec = doc.spec as Record<string, unknown> | undefined
    const optimization = spec?.optimization as Record<string, unknown> | undefined
    const parameters = spec?.parameters as Record<string, unknown> | undefined
    const constraints = spec?.constraints as Array<Record<string, unknown>> | undefined

    const apiSpec = {
      name: (metadata?.name as string) ?? 'unnamed-strategy',
      method: (optimization?.method as string) ?? 'sharpe_ratio',
      framework: (optimization?.framework as string) ?? 'mvo',
      objective: (optimization?.objective as string) ?? 'sharpe_ratio',
      risk_function: (optimization?.risk_function as string) ?? 'volatility',
      constraints: (constraints ?? []).map((c) => ({
        type: c.type as string,
        value: c.value ?? null,
        enabled: (c.enabled as boolean) ?? true,
      })),
      risk_free_rate: (parameters?.risk_free_rate as number) ?? 0.02,
      lookback_days: (parameters?.lookback_days as number) ?? 504,
    }

    const result = await this.apiClient.post<Record<string, unknown>>(
      '/api/cli/strategy/validate',
      apiSpec,
    )

    const resultData = result as {success?: boolean; error?: {details?: string[]}}
    if (resultData.success) {
      this.formatter.success('Strategy is valid')
    } else {
      this.formatter.error('Strategy validation failed')
      const details = resultData.error?.details
      if (Array.isArray(details)) {
        for (const d of details) {
          this.formatter.error(`  - ${d}`)
        }
      }
    }

    this.formatter.output(result)
  }
}
