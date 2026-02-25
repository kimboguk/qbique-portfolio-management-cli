/**
 * Qbique SDK error classes.
 */

export class QbiqueError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'QbiqueError'
  }
}

export class AuthenticationError extends QbiqueError {
  constructor(message = 'Invalid or missing API key.') {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}

export class NotFoundError extends QbiqueError {
  constructor(message: string) {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends QbiqueError {
  constructor(message: string, details?: unknown) {
    super(message, 422, details)
    this.name = 'ValidationError'
  }
}

export class ServerError extends QbiqueError {
  constructor(message: string, statusCode = 500) {
    super(message, statusCode)
    this.name = 'ServerError'
  }
}

export class ConnectionError extends QbiqueError {
  constructor(message: string) {
    super(message)
    this.name = 'ConnectionError'
  }
}
