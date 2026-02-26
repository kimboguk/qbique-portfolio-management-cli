import {Args, Flags} from '@oclif/core'
import {readFileSync} from 'node:fs'
import {resolve, basename, extname} from 'node:path'
import * as YAML from 'yaml'
import {BaseCommand} from '../../lib/base-command.js'

export default class StrategyPush extends BaseCommand {
  static override description = 'Push a local strategy file (YAML or Python) to the server'

  static override examples = [
    '<%= config.bin %> strategy push ./my_strategy.yaml',
    '<%= config.bin %> strategy push ./momentum.yaml --name "Momentum V2"',
    '<%= config.bin %> strategy push ./balanced.yaml --tag production',
    '<%= config.bin %> strategy push ./momentum.py --name "Momentum20"',
    '<%= config.bin %> strategy push ./custom.py --classname MyCustomStrategy',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      description: 'Override strategy name (default: from file metadata or filename)',
    }),
    tag: Flags.string({
      description: 'Tag for version tracking (e.g., production, staging, dev)',
    }),
    description: Flags.string({
      description: 'Override strategy description',
    }),
    classname: Flags.string({
      description: 'Python strategy class name (auto-detected if omitted)',
    }),
  }

  static override args = {
    file: Args.string({
      description: 'Path to strategy file (.yaml, .yml, or .py)',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(StrategyPush)

    const filePath = resolve(args.file)
    const ext = extname(filePath).toLowerCase()

    if (ext === '.py') {
      await this.pushPythonStrategy(filePath, flags)
    } else if (ext === '.yaml' || ext === '.yml') {
      await this.pushYamlStrategy(filePath, flags)
    } else {
      this.formatter.error(`Unsupported file format: ${ext}. Use .yaml, .yml, or .py`)
      this.exit(1)
    }
  }

  private async pushPythonStrategy(
    filePath: string,
    flags: Record<string, unknown>,
  ): Promise<void> {
    let raw: string
    try {
      raw = readFileSync(filePath, 'utf8')
    } catch {
      this.formatter.error(`Cannot read file: ${filePath}`)
      this.exit(1)
      return
    }

    // 클래스명 자동 감지 (regex: class XxxStrategy(BaseStrategy) 또는 class Xxx(BaseStrategy))
    const classMatch = raw.match(/class\s+(\w+)\s*\(\s*(?:\w+\.)?BaseStrategy\s*\)/)
    const className = (flags.classname as string) ?? classMatch?.[1] ?? null

    if (!className) {
      this.formatter.error(
        'Could not detect BaseStrategy subclass. ' +
        'Use --classname to specify it manually.',
      )
      this.exit(1)
      return
    }

    const strategyName =
      (flags.name as string) ?? className ?? basename(filePath, '.py')

    const payload = {
      name: strategyName,
      description: (flags.description as string) ?? '',
      tag: (flags.tag as string) ?? null,
      source_file: basename(filePath),
      strategy_type: 'python',
      strategy_code: raw,
      strategy_class_name: className,
    }

    this.formatter.info(`Pushing Python strategy "${strategyName}" (class: ${className}) to server...`)

    const result = await this.apiClient.post<{
      success: boolean
      strategy_id?: number
      version?: string
      class_name?: string
      message?: string
      warnings?: string[]
    }>(
      '/api/cli/strategy/push',
      payload,
    )

    if (result.success) {
      this.formatter.success(
        `Strategy "${strategyName}" pushed successfully` +
        (result.strategy_id ? ` (ID: ${result.strategy_id})` : '') +
        (result.version ? ` [version: ${result.version}]` : ''),
      )
      if (result.warnings) {
        for (const w of result.warnings) {
          this.formatter.info(`Warning: ${w}`)
        }
      }
    }

    this.formatter.output(result)
  }

  private async pushYamlStrategy(
    filePath: string,
    flags: Record<string, unknown>,
  ): Promise<void> {
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
    const assets = spec?.assets as Record<string, unknown> | undefined

    const strategyName = (flags.name as string) ?? (metadata?.name as string) ?? basename(filePath, '.yaml')

    const payload = {
      name: strategyName,
      description: (flags.description as string) ?? (metadata?.description as string) ?? '',
      tag: (flags.tag as string) ?? null,
      source_file: basename(filePath),
      strategy_type: 'yaml',
      strategy_yaml: raw,
      spec: {
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
        optimization_period: (parameters?.optimization_period as string) ?? 'single',
        asset_universe: (assets?.universe as string) ?? 'all',
        tickers: (assets?.tickers as string[]) ?? null,
      },
    }

    this.formatter.info(`Pushing strategy "${strategyName}" to server...`)

    const result = await this.apiClient.post<{
      success: boolean
      strategy_id?: number
      version?: string
      message?: string
    }>(
      '/api/cli/strategy/push',
      payload,
    )

    if (result.success) {
      this.formatter.success(
        `Strategy "${strategyName}" pushed successfully` +
        (result.strategy_id ? ` (ID: ${result.strategy_id})` : '') +
        (result.version ? ` [version: ${result.version}]` : ''),
      )
    }

    this.formatter.output(result)
  }
}
