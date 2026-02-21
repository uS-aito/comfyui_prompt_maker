"""
ライブラリ API ルーター

エンドポイント:
  GET /api/scenes           - シーンテンプレート一覧を返す
  GET /api/environments     - 環境一覧を返す
  GET /api/settings/defaults - デフォルト技術設定を返す（未設定時は 404）
"""
from fastapi import APIRouter, Depends, HTTPException, Request

from ..models.api_models import (
    EnvironmentResponse,
    SceneTemplateResponse,
    TechDefaultsResponse,
)
from ..services.library_service import LibraryService

router = APIRouter()


def get_library_service(request: Request) -> LibraryService:
    """app.state から LibraryService を取得する依存関数。"""
    return request.app.state.library_service


@router.get("/scenes", response_model=list[SceneTemplateResponse])
async def get_scenes(service: LibraryService = Depends(get_library_service)):
    """シーンテンプレート一覧を返す。"""
    return [
        SceneTemplateResponse(
            name=s.name,
            display_name=s.display_name,
            positive_prompt=s.positive_prompt,
            negative_prompt=s.negative_prompt,
            batch_size=s.batch_size,
            preview_image_url=(
                f"/api/images/{s.preview_image}" if s.preview_image else None
            ),
        )
        for s in service.get_scenes()
    ]


@router.get("/environments", response_model=list[EnvironmentResponse])
async def get_environments(service: LibraryService = Depends(get_library_service)):
    """環境一覧を返す。"""
    return [
        EnvironmentResponse(
            name=e.name,
            display_name=e.display_name,
            environment_prompt=e.environment_prompt,
            thumbnail_url=(
                f"/api/images/{e.thumbnail}" if e.thumbnail else None
            ),
        )
        for e in service.get_environments()
    ]


@router.get("/settings/defaults", response_model=TechDefaultsResponse)
async def get_settings_defaults(service: LibraryService = Depends(get_library_service)):
    """デフォルト技術設定を返す。未設定の場合は 404 を返す。"""
    defaults = service.get_tech_defaults()
    if defaults is None:
        raise HTTPException(
            status_code=404, detail="デフォルト技術設定が設定されていません"
        )
    return TechDefaultsResponse(
        comfyui_config=defaults.comfyui_config,
        workflow_config=defaults.workflow_config,
    )
