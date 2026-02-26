"""validator 모듈 테스트"""
import pytest

from qbique_strategy import validate_strategy_code, detect_class_name


VALID_STRATEGY = '''
from qbique_strategy import BaseStrategy, Signal, MarketData

class MyStrategy(BaseStrategy):
    def generate_signals(self, market_data, rebalance_date):
        return [Signal(ticker=t, score=1.0) for t in market_data.tickers]
'''

MISSING_METHOD = '''
from qbique_strategy import BaseStrategy

class EmptyStrategy(BaseStrategy):
    pass
'''

NO_BASE_CLASS = '''
class NotAStrategy:
    def generate_signals(self, market_data, rebalance_date):
        return []
'''

FORBIDDEN_IMPORT_OS = '''
import os
from qbique_strategy import BaseStrategy, Signal

class BadStrategy(BaseStrategy):
    def generate_signals(self, market_data, rebalance_date):
        os.system("rm -rf /")
        return []
'''

FORBIDDEN_IMPORT_SUBPROCESS = '''
from subprocess import run
from qbique_strategy import BaseStrategy, Signal

class BadStrategy(BaseStrategy):
    def generate_signals(self, market_data, rebalance_date):
        return []
'''

FORBIDDEN_EXEC = '''
from qbique_strategy import BaseStrategy, Signal

class BadStrategy(BaseStrategy):
    def generate_signals(self, market_data, rebalance_date):
        exec("print('hello')")
        return []
'''

FORBIDDEN_EVAL = '''
from qbique_strategy import BaseStrategy, Signal

class BadStrategy(BaseStrategy):
    def generate_signals(self, market_data, rebalance_date):
        return eval("[Signal(ticker='A', score=1.0)]")
'''

SYNTAX_ERROR = '''
def broken(
    this is not valid python
'''

MULTIPLE_CLASSES = '''
from qbique_strategy import BaseStrategy, Signal

class StrategyA(BaseStrategy):
    def generate_signals(self, market_data, rebalance_date):
        return []

class StrategyB(BaseStrategy):
    def generate_signals(self, market_data, rebalance_date):
        return []
'''

QUALIFIED_BASE = '''
import qbique_strategy

class MyStrategy(qbique_strategy.BaseStrategy):
    def generate_signals(self, market_data, rebalance_date):
        return []
'''


class TestValidateStrategyCode:
    def test_valid_strategy(self):
        result = validate_strategy_code(VALID_STRATEGY)
        assert result.valid is True
        assert result.class_name == "MyStrategy"
        assert len(result.errors) == 0

    def test_missing_method(self):
        result = validate_strategy_code(MISSING_METHOD)
        assert result.valid is False
        assert any("generate_signals" in e for e in result.errors)

    def test_no_base_class(self):
        result = validate_strategy_code(NO_BASE_CLASS)
        assert result.valid is False
        assert any("BaseStrategy" in e for e in result.errors)

    def test_forbidden_import_os(self):
        result = validate_strategy_code(FORBIDDEN_IMPORT_OS)
        assert result.valid is False
        assert any("Forbidden import" in e for e in result.errors)

    def test_forbidden_import_subprocess(self):
        result = validate_strategy_code(FORBIDDEN_IMPORT_SUBPROCESS)
        assert result.valid is False
        assert any("Forbidden import" in e for e in result.errors)

    def test_forbidden_exec(self):
        result = validate_strategy_code(FORBIDDEN_EXEC)
        assert result.valid is False
        assert any("exec" in e for e in result.errors)

    def test_forbidden_eval(self):
        result = validate_strategy_code(FORBIDDEN_EVAL)
        assert result.valid is False
        assert any("eval" in e for e in result.errors)

    def test_syntax_error(self):
        result = validate_strategy_code(SYNTAX_ERROR)
        assert result.valid is False
        assert any("Syntax error" in e for e in result.errors)

    def test_multiple_classes_warning(self):
        result = validate_strategy_code(MULTIPLE_CLASSES)
        assert result.valid is True
        assert result.class_name == "StrategyA"
        assert len(result.warnings) > 0
        assert any("Multiple" in w for w in result.warnings)

    def test_qualified_base_class(self):
        result = validate_strategy_code(QUALIFIED_BASE)
        assert result.valid is True
        assert result.class_name == "MyStrategy"


class TestDetectClassName:
    def test_detect_valid(self):
        assert detect_class_name(VALID_STRATEGY) == "MyStrategy"

    def test_detect_no_strategy(self):
        assert detect_class_name(NO_BASE_CLASS) is None

    def test_detect_syntax_error(self):
        assert detect_class_name(SYNTAX_ERROR) is None

    def test_detect_multiple_returns_first(self):
        assert detect_class_name(MULTIPLE_CLASSES) == "StrategyA"
