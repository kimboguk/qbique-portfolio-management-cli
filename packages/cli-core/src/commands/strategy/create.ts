import {Flags} from '@oclif/core'
import {readFileSync} from 'node:fs'
import * as YAML from 'yaml'
import {BaseCommand} from '../../lib/base-command.js'

interface StrategyYaml {
  apiVersion?: string
  kind?: string
  metadata: {
    name: string
    description?: string
  }
  spec: {
    optimization: {
      method?: string
      framework?: string
      objective?: string
      risk_function?: string
    }
    constraints?: Array<{type: string; value?: unknown; enabled?: boolean}>
    parameters?: {
      risk_free_rate?: number
      lookback_days?: number
      optimization_period?: string
    }
    assets?: {
      universe?: string
      tickers?: string[]
    }
  }
}

export default class StrategyCreate extends BaseCommand {
  static override description = 'Create an optimization problem from a YAML strategy file'

  static override examples = [
    '<%= config.bin %> strategy create --file strategy.yaml',
    '<%= config.bin %> strategy create -f examples/balanced.yaml -o json',
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
    const {flags} = await this.parse(StrategyCreate)

    // Read and parse YAML
    let raw: string
    try {
      raw = readFileSync(flags.file, 'utf8')
    } catch {
      this.formatter.error(`Cannot read file: ${flags.file}`)
      this.exit(1)
      return
    }

    let doc: StrategyYaml
    try {
      doc = YAML.parse(raw) as StrategyYaml
    } catch (error) {
      this.formatter.error(`Invalid YAML: ${(error as Error).message}`)
      this.exit(1)
      return
    }

    // Transform YAML to API spec
    const spec = {
      name: doc.metadata?.name ?? 'unnamed-strategy',
      description: doc.metadata?.description,
      method: doc.spec?.optimization?.method ?? 'sharpe_ratio',
      framework: doc.spec?.optimization?.framework ?? 'mvo',
      objective: doc.spec?.optimization?.objective ?? 'sharpe_ratio',
      risk_function: doc.spec?.optimization?.risk_function ?? 'volatility',
      constraints: (doc.spec?.constraints ?? []).map((c) => ({
        type: c.type,
        value: c.value ?? null,
        enabled: c.enabled ?? true,
      })),
      risk_free_rate: doc.spec?.parameters?.risk_free_rate ?? 0.02,
      lookback_days: doc.spec?.parameters?.lookback_days ?? 504,
      optimization_period: doc.spec?.parameters?.optimization_period ?? 'single',
      asset_universe: doc.spec?.assets?.universe ?? 'all',
      tickers: doc.spec?.assets?.tickers ?? null,
    }

    this.formatter.info(`Creating strategy "${spec.name}"...`)

    const result = await this.apiClient.post<Record<string, unknown>>(
      '/api/cli/strategy/create',
      spec,
    )

    this.formatter.success(`Strategy created successfully`)
    this.formatter.output(result)
  }
}
