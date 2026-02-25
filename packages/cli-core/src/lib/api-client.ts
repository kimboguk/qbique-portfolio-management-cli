/**
 * HTTP API 클라이언트
 * 백엔드 REST API 호출을 위한 axios 래퍼
 */
import axios, {type AxiosInstance, type AxiosRequestConfig, type AxiosError} from 'axios'
import {ConfigManager} from './config-manager.js'

export class ApiClient {
  private client: AxiosInstance

  constructor(
    private configManager: ConfigManager,
    private apiKeyOverride?: string,
  ) {
    const config = this.configManager.getConfig()

    this.client = axios.create({
      baseURL: config.endpoint,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'qbique-cli/0.1.0',
      },
    })

    // 요청 인터셉터: API Key 자동 주입
    this.client.interceptors.request.use((reqConfig) => {
      const key = this.apiKeyOverride ?? this.configManager.getApiKey()
      if (key) {
        reqConfig.headers['X-API-Key'] = key
      }

      return reqConfig
    })
  }

  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.request<T>('GET', path, undefined, config)
    return response
  }

  async post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.request<T>('POST', path, data, config)
    return response
  }

  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.request<T>('DELETE', path, undefined, config)
    return response
  }

  private async request<T>(
    method: string,
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await this.client.request<T>({
        method,
        url: path,
        data,
        ...config,
      })
      return response.data
    } catch (error) {
      throw this.formatError(error as AxiosError)
    }
  }

  private formatError(error: AxiosError): Error {
    if (error.response) {
      const {status, data} = error.response
      const body = data as Record<string, unknown> | undefined
      const detail = body?.detail ?? body?.error ?? body?.message ?? 'Unknown error'
      return new Error(`API Error (${status}): ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`)
    }

    if (error.code === 'ECONNREFUSED') {
      const endpoint = this.configManager.get('endpoint')
      return new Error(
        `Cannot connect to server at ${endpoint}. Is the backend running?\n` +
        `  Start it with: cd client_onboarding/backend && python main.py`,
      )
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new Error('Request timed out. Try increasing timeout with: qbique config set timeout 60000')
    }

    return new Error(`Network error: ${error.message}`)
  }
}
