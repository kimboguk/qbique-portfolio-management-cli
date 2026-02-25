"""Low-level HTTP client wrapper around httpx."""

from __future__ import annotations

import httpx

from qbique.exceptions import (
    QbiqueError,
    AuthenticationError,
    NotFoundError,
    ValidationError,
    ServerError,
    ConnectionError,
)


class HttpClient:
    """Thin httpx wrapper with error mapping."""

    def __init__(self, base_url: str, api_key: str, timeout: float = 30.0):
        self._client = httpx.Client(
            base_url=base_url,
            timeout=timeout,
            headers={
                "Content-Type": "application/json",
                "X-API-Key": api_key,
                "User-Agent": "qbique-python-sdk/0.1.0",
            },
        )

    def get(self, path: str, params: dict | None = None) -> dict:
        return self._request("GET", path, params=params)

    def post(self, path: str, json: dict | None = None, params: dict | None = None) -> dict:
        return self._request("POST", path, json=json, params=params)

    def delete(self, path: str) -> dict:
        return self._request("DELETE", path)

    def close(self) -> None:
        self._client.close()

    def _request(self, method: str, path: str, **kwargs) -> dict:
        try:
            response = self._client.request(method, path, **kwargs)
        except httpx.ConnectError as e:
            raise ConnectionError(
                f"Cannot connect to Qbique server at {self._client.base_url}. "
                f"Is the backend running? Error: {e}"
            ) from e
        except httpx.TimeoutException as e:
            raise QbiqueError(f"Request timed out: {e}") from e

        if response.status_code == 401:
            raise AuthenticationError("Invalid or missing API key.", status_code=401)
        if response.status_code == 404:
            raise NotFoundError(f"Resource not found: {path}", status_code=404)
        if response.status_code == 422:
            body = response.json() if response.content else {}
            raise ValidationError(
                f"Validation error: {body.get('detail', body)}",
                status_code=422,
                details=body,
            )
        if response.status_code >= 500:
            raise ServerError(
                f"Server error ({response.status_code}): {response.text}",
                status_code=response.status_code,
            )
        if response.status_code >= 400:
            body = response.json() if response.content else {}
            raise QbiqueError(
                f"API error ({response.status_code}): {body}",
                status_code=response.status_code,
                details=body,
            )

        return response.json()
