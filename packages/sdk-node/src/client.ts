/**
 * QbiqueClient — Main entry point for the Qbique Node.js SDK.
 *
 * Usage:
 *   import { QbiqueClient } from '@qbique/sdk-node'
 *
 *   const client = new QbiqueClient({ apiKey: 'qbi_xxx' })
 *   const methods = await client.strategy.list()
 *   const result = await client.backtest.run({ tickers: ['005930'], start: '2023-01-01', end: '2024-12-31' })
 */
import {HttpClient} from './http-client.js'
import type {
  QbiqueClientOptions,
  BacktestRunOptions,
  OptimizeRunOptions,
  DataFetchOptions,
  DataExportOptions,
  StrategyPushOptions,
} from './types.js'

class StrategyResource {
  constructor(private http: HttpClient) {}

  async list() {
    return this.http.get('/api/optimization/methods')
  }

  async show(problemId: number) {
    return this.http.get(`/api/onboarding/problem/${problemId}`)
  }

  async create(spec: Record<string, unknown>) {
    return this.http.post('/api/cli/strategy/create', spec)
  }

  async validate(spec: Record<string, unknown>) {
    return this.http.post('/api/cli/strategy/validate', spec)
  }

  async push(options: StrategyPushOptions) {
    return this.http.post('/api/cli/strategy/push', {
      name: options.name,
      description: options.description ?? '',
      tag: options.tag ?? null,
      source_file: options.sourceFile ?? null,
      strategy_yaml: options.strategyYaml,
      spec: options.spec,
    })
  }

  async versions(strategyId: number) {
    return this.http.get(`/api/cli/strategy/${strategyId}/versions`)
  }
}

class OptimizeResource {
  constructor(private http: HttpClient) {}

  async run(options: OptimizeRunOptions) {
    if (options.greedy) {
      return this.http.post('/api/optimization/greedy-cluster', {
        request_id: options.problemId,
      })
    }

    return this.http.post('/api/optimization/execute', {
      problem_id: options.problemId,
      asset_tickers: options.tickers ?? null,
      use_cache: options.useCache ?? true,
    })
  }

  async status(jobId: string) {
    return this.http.get(`/api/optimization/status/${jobId}`)
  }

  async frontier(requestId: string, nPoints = 50) {
    return this.http.post('/api/optimization/efficient-frontier', {
      request_id: requestId,
      n_points: nPoints,
    })
  }
}

class BacktestResource {
  constructor(private http: HttpClient) {}

  async run(options: BacktestRunOptions) {
    return this.http.post('/api/backtest/run', {
      tickers: options.tickers,
      start_date: options.start,
      end_date: options.end,
      schedule_type: options.schedule ?? 'calendar',
      calendar_freq: options.freq ?? 'quarterly',
      drift_threshold: options.driftThreshold ?? 5.0,
      benchmark: options.benchmark ?? 'KOSPI',
      initial_capital: options.capital ?? 100_000_000,
    })
  }

  async status(jobId: string) {
    return this.http.get(`/api/backtest/status/${jobId}`)
  }

  async results(jobId: string) {
    return this.http.get(`/api/backtest/results/${jobId}`)
  }
}

class DataResource {
  constructor(private http: HttpClient) {}

  async search(query: string, limit = 10) {
    return this.http.post('/api/optimization/search-tickers', {query, limit})
  }

  async validate(tickers: string[]) {
    return this.http.post('/api/optimization/validate-tickers', {tickers})
  }

  async fetch(options: DataFetchOptions) {
    const payload: Record<string, unknown> = {}
    if (options.universe) payload.universe = options.universe
    if (options.tickers) payload.tickers = options.tickers
    if (options.startDate) payload.start_date = options.startDate
    if (options.endDate) payload.end_date = options.endDate
    return this.http.post('/api/cli/data/fetch', payload)
  }

  async export(options: DataExportOptions) {
    const payload: Record<string, unknown> = {
      dataset: options.dataset,
      format: options.format ?? 'json',
    }
    if (options.tickers) payload.tickers = options.tickers
    if (options.startDate) payload.start_date = options.startDate
    if (options.endDate) payload.end_date = options.endDate
    return this.http.post('/api/cli/data/export', payload)
  }

  async importData(dataset: string, data: unknown, metadata?: Record<string, unknown>) {
    return this.http.post('/api/cli/data/import', {dataset, data, metadata})
  }
}

class PortfolioResource {
  constructor(private http: HttpClient) {}

  async summary(portfolioId: string) {
    return this.http.get(`/api/portfolio/${portfolioId}/summary`)
  }

  async drift(portfolioId: string) {
    return this.http.get(`/api/portfolio/${portfolioId}/drift`)
  }

  async pnl(portfolioId: string) {
    return this.http.get(`/api/portfolio/${portfolioId}/pnl`)
  }
}

class HealthResource {
  constructor(private http: HttpClient) {}

  async check() {
    return this.http.get('/api/health')
  }

  async version() {
    return this.http.get('/api/version')
  }
}

export class QbiqueClient {
  readonly strategy: StrategyResource
  readonly optimize: OptimizeResource
  readonly backtest: BacktestResource
  readonly data: DataResource
  readonly portfolio: PortfolioResource
  readonly health: HealthResource

  private readonly http: HttpClient

  constructor(options: QbiqueClientOptions) {
    const endpoint = options.endpoint ?? 'http://localhost:8001'
    const timeout = options.timeout ?? 30_000

    this.http = new HttpClient(endpoint, options.apiKey, timeout)

    this.strategy = new StrategyResource(this.http)
    this.optimize = new OptimizeResource(this.http)
    this.backtest = new BacktestResource(this.http)
    this.data = new DataResource(this.http)
    this.portfolio = new PortfolioResource(this.http)
    this.health = new HealthResource(this.http)
  }
}
