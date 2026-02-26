"""
AST 기반 Python 전략 파일 검증기
"""
from __future__ import annotations

import ast
from dataclasses import dataclass, field
from typing import List, Optional


# 보안상 금지되는 모듈
FORBIDDEN_MODULES = frozenset({
    "os", "subprocess", "socket", "requests", "urllib",
    "http", "shutil", "pathlib", "sys", "importlib",
    "ctypes", "multiprocessing", "threading", "signal",
    "pickle", "shelve", "tempfile", "glob", "fnmatch",
    "webbrowser", "smtplib", "ftplib", "telnetlib",
})

# 금지되는 builtin 호출
FORBIDDEN_BUILTINS = frozenset({
    "exec", "eval", "compile", "__import__", "breakpoint",
    "open", "input",
})


@dataclass
class ValidationResult:
    """검증 결과"""
    valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    class_name: Optional[str] = None


def validate_strategy_code(source_code: str) -> ValidationResult:
    """
    Python 전략 코드를 AST로 파싱하여 검증한다.

    검증 항목:
    1. 유효한 Python 구문
    2. BaseStrategy를 상속하는 클래스 존재
    3. generate_signals() 메서드 존재
    4. 금지 import 차단
    5. exec/eval/compile 호출 차단

    Args:
        source_code: Python 소스 코드 문자열

    Returns:
        ValidationResult
    """
    errors: List[str] = []
    warnings: List[str] = []

    # 1. 파싱
    try:
        tree = ast.parse(source_code)
    except SyntaxError as e:
        return ValidationResult(
            valid=False,
            errors=[f"Syntax error at line {e.lineno}: {e.msg}"],
        )

    # 2. 금지 import 검사
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                root_module = alias.name.split(".")[0]
                if root_module in FORBIDDEN_MODULES:
                    errors.append(
                        f"Forbidden import '{alias.name}' at line {node.lineno}"
                    )

        elif isinstance(node, ast.ImportFrom):
            if node.module:
                root_module = node.module.split(".")[0]
                if root_module in FORBIDDEN_MODULES:
                    errors.append(
                        f"Forbidden import from '{node.module}' at line {node.lineno}"
                    )

    # 3. 금지 builtin 호출 검사
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            func_name = _get_call_name(node)
            if func_name in FORBIDDEN_BUILTINS:
                errors.append(
                    f"Forbidden call '{func_name}()' at line {node.lineno}"
                )

    # 4. BaseStrategy 상속 클래스 검사
    strategy_classes = _find_strategy_classes(tree)

    if not strategy_classes:
        errors.append(
            "No class inheriting from BaseStrategy found. "
            "Your strategy must subclass BaseStrategy."
        )
        return ValidationResult(valid=False, errors=errors, warnings=warnings)

    if len(strategy_classes) > 1:
        warnings.append(
            f"Multiple strategy classes found: {[c.name for c in strategy_classes]}. "
            f"Using first: {strategy_classes[0].name}"
        )

    cls = strategy_classes[0]

    # 5. generate_signals 메서드 존재 확인
    has_generate_signals = False
    for item in cls.body:
        if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
            if item.name == "generate_signals":
                has_generate_signals = True
                break

    if not has_generate_signals:
        errors.append(
            f"Class '{cls.name}' must implement generate_signals() method"
        )

    valid = len(errors) == 0

    return ValidationResult(
        valid=valid,
        errors=errors,
        warnings=warnings,
        class_name=cls.name if valid else None,
    )


def detect_class_name(source_code: str) -> Optional[str]:
    """
    전략 코드에서 BaseStrategy 상속 클래스명을 감지한다.

    Args:
        source_code: Python 소스 코드

    Returns:
        클래스명 또는 None
    """
    try:
        tree = ast.parse(source_code)
    except SyntaxError:
        return None

    classes = _find_strategy_classes(tree)
    return classes[0].name if classes else None


def _find_strategy_classes(tree: ast.Module) -> List[ast.ClassDef]:
    """BaseStrategy를 상속하는 클래스 노드를 찾는다."""
    result = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            for base in node.bases:
                base_name = _get_base_name(base)
                if base_name and "BaseStrategy" in base_name:
                    result.append(node)
                    break
    return result


def _get_base_name(node: ast.expr) -> Optional[str]:
    """AST base 노드에서 이름 추출"""
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return f"{_get_base_name(node.value)}.{node.attr}"
    return None


def _get_call_name(node: ast.Call) -> Optional[str]:
    """AST Call 노드에서 함수명 추출"""
    func = node.func
    if isinstance(func, ast.Name):
        return func.id
    if isinstance(func, ast.Attribute):
        return func.attr
    return None
