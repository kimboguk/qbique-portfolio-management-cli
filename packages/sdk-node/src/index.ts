/**
 * @qbique/sdk-node — Qbique Node.js SDK
 *
 * Usage:
 *   import { QbiqueClient } from '@qbique/sdk-node'
 *   const client = new QbiqueClient({ apiKey: 'qbi_xxx' })
 */

export {QbiqueClient} from './client.js'
export {
  QbiqueError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  ServerError,
  ConnectionError,
} from './errors.js'
export type {
  QbiqueClientOptions,
  ApiResponse,
  BacktestRunOptions,
  OptimizeRunOptions,
  DataFetchOptions,
  DataExportOptions,
  StrategyPushOptions,
} from './types.js'
