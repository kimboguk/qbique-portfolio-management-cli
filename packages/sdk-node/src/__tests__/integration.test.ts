/**
 * Live integration tests (Option B) — exercise the Node SDK against a running
 * dev backend (onboarding-be gateway, default http://localhost:9001).
 *
 * Mirror of sdk-python tests/test_integration.py. The gateway fronts every
 * route the SDK uses and proxies optimization/backtest compute to
 * optimization_engine (9002) internally, so a single endpoint is enough.
 *
 * These tests are SKIPPED automatically when the backend is unreachable, so the
 * default unit run stays green without a live server. To run them explicitly:
 *
 *     QBIQUE_ENDPOINT=http://localhost:9001 npm test
 *
 * Scope mirrors the Python suite: read-only smoke over the path-mismatch-fix
 * endpoints plus the core read surface, then the web-parity greedy backtest
 * submit. (sdk-node has no contract resource yet, so that case is omitted.)
 * The write/compute E2E flow (strategy.create -> optimize.run -> backtest) is
 * a follow-up once spec fixtures are settled.
 */

import {beforeAll, describe, expect, it} from 'vitest'
import {QbiqueClient} from '../client.js'

const ENDPOINT = process.env.QBIQUE_ENDPOINT ?? 'http://localhost:9001'
const API_KEY = process.env.QBIQUE_API_KEY ?? 'qbi_test'

async function backendUp(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${ENDPOINT}/health`, {signal: controller.signal})
    clearTimeout(timer)
    return res.status === 200
  } catch {
    return false
  }
}

const up = await backendUp()

describe.skipIf(!up)('live integration (backend @ ' + ENDPOINT + ')', () => {
  let client: QbiqueClient

  beforeAll(() => {
    client = new QbiqueClient({apiKey: API_KEY, endpoint: ENDPOINT})
  })

  // --- endpoints corrected by the path-mismatch fix ---------------------

  it('health.check -> GET /health', async () => {
    const res = await client.health.check()
    expect(res).toBeTypeOf('object')
  })

  it('health.version -> GET /api/version/current', async () => {
    const res = await client.health.version()
    expect(res).toBeTypeOf('object')
  })

  // --- core read surface ------------------------------------------------

  it('strategy.list -> GET /api/optimization/methods', async () => {
    const res = await client.strategy.list()
    expect(res).toBeTypeOf('object')
  })

  it('data.validate -> POST /api/optimization/validate-tickers', async () => {
    const res = await client.data.validate(['AAPL', 'MSFT'])
    expect(res).toBeTypeOf('object')
  })

  // --- web-parity strategy backtest (greedy) ----------------------------

  it('backtest.availableRange -> GET /api/backtest/strategy/available-range', async () => {
    const res = await client.backtest.availableRange()
    expect(res).toBeTypeOf('object')
  })

  it('backtest.strategy -> POST /api/backtest/strategy/greedy (submit only)', async () => {
    // Submit only (no completion poll — greedy backtests take ~1min). Asserts a
    // job descriptor comes back, which proves the web-parity wiring is correct.
    const job = (await client.backtest.strategy({
      start: '2023-01-01',
      end: '2023-06-30',
      portfolioStrategy: 'risk_parity',
      rebalanceFreq: 'monthly',
      universe: 'US',
    })) as Record<string, unknown>
    expect(job).toBeTypeOf('object')
    expect(job.job_id).toBeTruthy()
  })
})

// Guard: keep a non-empty test run when the backend is down, otherwise vitest
// reports "no tests" as a failure in CI.
describe.runIf(!up)('live integration (skipped — backend down)', () => {
  it('skipped: dev backend not reachable at ' + ENDPOINT, () => {
    expect(true).toBe(true)
  })
})
