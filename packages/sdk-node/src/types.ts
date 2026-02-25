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
