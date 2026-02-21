"""ConfigValidatorService: 生成された dict を workflow_config_schema.json で検証する"""

import json
from pathlib import Path

import jsonschema


class ConfigValidationError(Exception):
    """スキーマ検証に失敗した場合の例外"""
    pass


class ConfigValidatorService:
    def __init__(self, schema_path: Path) -> None:
        if not schema_path.exists():
            raise FileNotFoundError(f"スキーマファイルが見つかりません: {schema_path}")
        with schema_path.open(encoding="utf-8") as f:
            self._schema = json.load(f)

    def validate(self, config_dict: dict) -> None:
        """dict を JSON スキーマで検証する。

        Raises:
            ConfigValidationError: スキーマ違反の場合（違反内容を含む）
        """
        try:
            jsonschema.validate(instance=config_dict, schema=self._schema)
        except jsonschema.ValidationError as e:
            raise ConfigValidationError(e.message) from e
