/**
 * Low-level HTTP client wrapper around axios.
 */
import axios, {type AxiosInstance, type AxiosError} from 'axios'
import {
  QbiqueError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  ServerError,
  ConnectionError,
} from './errors.js'

export class HttpClient {
  private client: AxiosInstance

  constructor(baseURL: string, apiKey: string, timeout: number) {
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'User-Agent': 'qbique-node-sdk/0.1.0',
      },
    })
  }

  async get<T = unknown>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>('GET', path, undefined, params)
  }

  async post<T = unknown>(path: string, data?: unknown, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>('POST', path, data, params)
  }

  async delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  private async request<T>(
    method: string,
    url: string,
    data?: unknown,
    params?: Record<string, unknown>,
  ): Promise<T> {
    try {
      const response = await this.client.request<T>({method, url, data, params})
      return response.data
    } catch (error) {
      throw this.mapError(error as AxiosError)
    }
  }

  private mapError(error: AxiosError): Error {
    if (error.response) {
      const {status, data} = error.response
      const body = data as Record<string, unknown> | undefined
      const detail = body?.detail ?? body?.error ?? body?.message ?? 'Unknown error'
      const message = typeof detail === 'string' ? detail : JSON.stringify(detail)

      switch (status) {
        case 401:
          return new AuthenticationError()
        case 404:
          return new NotFoundError(`Resource not found: ${error.config?.url}`)
        case 422:
          return new ValidationError(`Validation error: ${message}`, body)
        default:
          if (status >= 500) return new ServerError(`Server error (${status}): ${message}`, status)
          return new QbiqueError(`API error (${status}): ${message}`, status, body)
      }
    }

    if (error.code === 'ECONNREFUSED') {
      return new ConnectionError(
        `Cannot connect to Qbique server. Is the backend running?`,
      )
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new QbiqueError('Request timed out.')
    }

    return new QbiqueError(`Network error: ${error.message}`)
  }
}
