"""ライブラリ API レスポンス用・コンフィグ生成リクエスト用 Pydantic モデル定義"""

from pydantic import BaseModel, Field

from backend.models.library_models import ComfyUIConfigModel, WorkflowConfigParamsModel


class SceneTemplateResponse(BaseModel):
    name: str
    display_name: str
    positive_prompt: str
    negative_prompt: str
    batch_size: int
    preview_image_url: str | None


class EnvironmentResponse(BaseModel):
    name: str
    display_name: str
    environment_prompt: str
    thumbnail_url: str | None


class TechDefaultsResponse(BaseModel):
    comfyui_config: ComfyUIConfigModel
    workflow_config: WorkflowConfigParamsModel


class SceneOverrides(BaseModel):
    name: str | None = None
    positive_prompt: str | None = None
    negative_prompt: str | None = None
    batch_size: int | None = Field(default=None, ge=1)


class GenerateSceneItem(BaseModel):
    template_name: str
    overrides: SceneOverrides


class GlobalSettingsPayload(BaseModel):
    character_name: str
    environment_name: str
    environment_prompt: str


class TechSettingsPayload(BaseModel):
    comfyui_config: ComfyUIConfigModel
    workflow_config: WorkflowConfigParamsModel


class GenerateRequest(BaseModel):
    global_settings: GlobalSettingsPayload
    tech_settings: TechSettingsPayload
    scenes: list[GenerateSceneItem] = Field(min_length=1)
