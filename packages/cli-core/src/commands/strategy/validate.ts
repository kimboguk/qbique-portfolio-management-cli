import {Flags} from '@oclif/core'
import {readFileSync} from 'node:fs'
import * as YAML from 'yaml'
import {BaseCommand} from '../../lib/base-command.js'

export default class StrategyValidate extends BaseCommand {
  static override description = 'Validate a YAML strategy file without creating it'

  static override examples = [
    '<%= config.bin %> strategy validate --file strategy.yaml',
    '<%= config.bin %> strategy validate -f examples/balanced.yaml -o json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({
      char: 'f',
      description: 'Path to YAML strategy file',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(StrategyValidate)

    let raw: string
    try {
      raw = readFileSync(flags.file, 'utf8')
    } catch {
      this.formatter.error(`Cannot read file: ${flags.file}`)
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
