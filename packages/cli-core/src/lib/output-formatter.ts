/**
 * 출력 포맷터
 * JSON / Table / YAML 형식으로 데이터 출력
 */
import Table from 'cli-table3'
import * as YAML from 'yaml'
import type {OutputFormat} from '../types/index.js'

export class OutputFormatter {
  constructor(private format: OutputFormat = 'table') {}

  /**
   * 데이터를 지정된 형식으로 stdout에 출력
   */
  output(data: unknown): void {
    switch (this.format) {
      case 'json':
        process.stdout.write(JSON.stringify(data, null, 2) + '\n')
        break
      case 'yaml':
        process.stdout.write(YAML.stringify(data))
        break
      case 'table':
        // table 모드에서 단순 객체/배열이면 기본 테이블로 변환
        if (Array.isArray(data)) {
          this.outputArrayAsTable(data)
        } else if (typeof data === 'object' && data !== null) {
          this.outputObjectAsTable(data as Record<string, unknown>)
        } else {
          console.log(data)
        }

        break
    }
  }

  /**
   * 키-값 쌍 테이블 출력 (전략 상세 등)
   */
  outputKeyValue(data: Record<string, unknown>): void {
    if (this.format !== 'table') {
      this.output(data)
      return
    }

    this.outputObjectAsTable(data)
  }

  /**
   * 배열 데이터를 컬럼 테이블로 출력
   */
  outputTable(rows: Record<string, unknown>[], columns?: string[]): void {
    if (this.format !== 'table') {
      this.output(rows)
      return
    }

    if (rows.length === 0) {
      this.info('No data to display.')
      return
    }

    const cols = columns ?? Object.keys(rows[0])
    const table = new Table({
      head: cols,
      style: {head: ['cyan']},
    })

    for (const row of rows) {
      table.push(cols.map((c) => String(row[c] ?? '')))
    }

    console.log(table.toString())
  }

  /**
   * 성공 메시지 출력 (json 모드에서는 stderr)
   */
  success(message: string): void {
    if (this.format === 'json') {
      process.stderr.write(`✓ ${message}\n`)
    } else {
      console.log(`✓ ${message}`)
    }
  }

  /**
   * 에러 메시지 출력 (항상 stderr)
   */
  error(message: string): void {
    process.stderr.write(`✗ ${message}\n`)
  }

  /**
   * 정보 메시지 출력 (json 모드에서는 stderr)
   */
  info(message: string): void {
    if (this.format === 'json') {
      process.stderr.write(`${message}\n`)
    } else {
      console.log(message)
    }
  }

  private outputObjectAsTable(data: Record<string, unknown>): void {
    const table = new Table({
      style: {head: ['cyan']},
    })

    for (const [key, value] of Object.entries(data)) {
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')
      table.push({[key]: displayValue})
    }

    console.log(table.toString())
  }

  private outputArrayAsTable(data: unknown[]): void {
    if (data.length === 0) {
      this.info('No data to display.')
      return
    }

    if (typeof data[0] === 'object' && data[0] !== null) {
      this.outputTable(data as Record<string, unknown>[])
    } else {
      for (const item of data) {
        console.log(String(item))
      }
    }
  }
}
