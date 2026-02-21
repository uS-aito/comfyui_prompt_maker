"""
Generate ルーター

エンドポイント:
  POST /api/generate - GenerateRequest を受信し、YAML コンフィグをレスポンスとして返す
"""

import io

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from ruamel.yaml import YAML

from ..models.api_models import GenerateRequest
from ..services.config_generator import ConfigGeneratorService
from ..services.config_validator import ConfigValidationError, ConfigValidatorService

router = APIRouter()


def get_config_generator(request: Request) -> ConfigGeneratorService:
    """app.state から ConfigGeneratorService を取得する依存関数。"""
    return request.app.state.config_generator


def get_config_validator(request: Request) -> ConfigValidatorService:
    """app.state から ConfigValidatorService を取得する依存関数。"""
    return request.app.state.config_validator


@router.post("/generate")
async def generate_config(
    generate_request: GenerateRequest,
    generator: ConfigGeneratorService = Depends(get_config_generator),
    validator: ConfigValidatorService = Depends(get_config_validator),
) -> Response:
    """GenerateRequest を受信し、スキーマ準拠の YAML をダウンロードレスポンスとして返す。

    Raises:
        HTTPException(422): JSON Schema 検証失敗時。違反内容を detail に含める。
    """
    config_dict = generator.generate(generate_request)

    try:
        validator.validate(config_dict)
    except ConfigValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))

    yaml = YAML()
    yaml.default_flow_style = False
    stream = io.StringIO()
    yaml.dump(config_dict, stream)
    yaml_content = stream.getvalue()

    return Response(
        content=yaml_content,
        media_type="application/yaml",
        headers={"Content-Disposition": "attachment; filename=workflow_config.yaml"},
    )
