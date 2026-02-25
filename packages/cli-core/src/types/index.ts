/**
 * Qbique CLI 공통 타입 정의
 */

export type OutputFormat = 'json' | 'table' | 'yaml'

export interface QbiqueConfig {
  endpoint: string
  defaultOutput: OutputFormat
  timeout: number
  profile: string
}

export interface Credentials {
  apiKey: string
  endpoint: string
  savedAt: string
}

export interface ProfileCredentials {
  [profile: string]: Credentials
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

export interface HealthResponse {
  status: string
  message: string
  environment: string
  api_prefix: string
  version: string
}

export interface VersionResponse {
  current_version: string
  versions?: Array<{
    version: string
    release_date: string
    description: string
  }>
}

export interface OptimizationMethod {
  id: string
  name: string
  description: string
  category?: string
  framework?: string
}

export interface AuthValidateResponse {
  valid: boolean
  prefix?: string
  name?: string
  scopes?: string[]
}

export interface AuthStatusResponse {
  auth_enabled: boolean
  method: string
}
