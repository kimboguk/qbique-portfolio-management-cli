"""Qbique SDK type definitions."""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ApiResponse:
    """Standard API response envelope."""
    success: bool
    data: Any
    meta: dict = field(default_factory=dict)
    error: dict | None = None

    @classmethod
    def from_dict(cls, d: dict) -> ApiResponse:
        return cls(
            success=d.get("success", True),
            data=d.get("data"),
            meta=d.get("meta", {}),
            error=d.get("error"),
        )


@dataclass
class BacktestResult:
    """Backtest execution result."""
    job_id: str
    status: str
    data: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict) -> BacktestResult:
        return cls(
            job_id=d.get("job_id", ""),
            status=d.get("status", ""),
            data=d,
        )


@dataclass
class OptimizationResult:
    """Optimization execution result."""
    problem_id: int | None = None
    method: str = ""
    weights: dict = field(default_factory=dict)
    data: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict) -> OptimizationResult:
        return cls(
            problem_id=d.get("problem_id"),
            method=d.get("selected_method", d.get("method", "")),
            weights=d.get("weights", {}),
            data=d,
        )
