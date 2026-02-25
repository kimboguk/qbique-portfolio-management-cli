"""Qbique SDK exceptions."""


class QbiqueError(Exception):
    """Base exception for all Qbique SDK errors."""

    def __init__(self, message: str, status_code: int | None = None, details: dict | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details


class AuthenticationError(QbiqueError):
    """API key is invalid or missing."""
    pass


class NotFoundError(QbiqueError):
    """Requested resource not found."""
    pass


class ValidationError(QbiqueError):
    """Request validation failed."""
    pass


class ServerError(QbiqueError):
    """Server-side error."""
    pass


class ConnectionError(QbiqueError):
    """Cannot connect to the Qbique server."""
    pass
