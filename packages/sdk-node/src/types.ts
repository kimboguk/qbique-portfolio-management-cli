/**
 * Qbique SDK type definitions.
 */

export interface QbiqueClientOptions {
  apiKey: string
  endpoint?: string
  timeout?: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  meta: {
    request_id: string
    timestamp: string
    version: string
  }
  error: {
    message: string
    code: string
    details?: unknown
  } | null
}

export interface BacktestRunOptions {
  tickers: string[]
  start: string
  end: string
  schedule?: string
  freq?: string
  driftThreshold?: number
  benchmark?: string
  capital?: number
}

/** Web-app-parity strategy backtest (greedy cluster selection). */
export interface BacktestStrategyOptions {
  start: string
  end: string
  /** max_sharpe | risk_parity | hrp | min_variance | equal_weight */
  portfolioStrategy?: string
  rebalanceFreq?: string
  /** ALL | US */
  universe?: string
  initialCapital?: number
  kMaxPerCluster?: number
  improvementThreshold?: number
  expectedReturnMethod?: string
  /** sample | ledoit_wolf */
  covarianceMethod?: string
  lookbackDays?: number
  covLookbackDays?: number
  benchmarks?: string[]
  regimeEnabled?: boolean
  regimeMethod?: string
  creditSpreadEnabled?: boolean
  creditSpreadThreshold?: number
  creditSpreadMode?: string
  stopLossEnabled?: boolean
  stopLossThreshold?: number
  /** share_based | weight_based */
  evaluationMethod?: string
  useRealisticPricing?: boolean
}

export interface OptimizeRunOptions {
  problemId: number
  engine?: 'classical' | 'quantum'
  greedy?: boolean
  tickers?: string[]
  useCache?: boolean
  timeout?: number
}

export interface DataFetchOptions {
  universe?: string
  tickers?: string[]
  startDate?: string
  endDate?: string
}

export interface DataExportOptions {
  dataset: string
  tickers?: string[]
  startDate?: string
  endDate?: string
  format?: 'json' | 'csv'
}

export interface StrategyPushOptions {
  name: string
  strategyYaml: string
  spec: Record<string, unknown>
  description?: string
  tag?: string
  sourceFile?: string
}
