"""ライブラリ YAML 読み込み用 Pydantic モデル定義"""

from pydantic import BaseModel, Field


class ComfyUIConfigModel(BaseModel):
    server_address: str
    client_id: str


class DefaultPromptsModel(BaseModel):
    base_positive_prompt: str
    environment_prompt: str = ""
    positive_prompt: str = ""
    negative_prompt: str = ""
    batch_size: int = Field(default=1, ge=1)


class WorkflowConfigParamsModel(BaseModel):
    workflow_json_path: str
    image_output_path: str
    library_file_path: str
    seed_node_id: int
    batch_size_node_id: int
    negative_prompt_node_id: int
    positive_prompt_node_id: int
    environment_prompt_node_id: int
    default_prompts: DefaultPromptsModel


class LibraryScene(BaseModel):
    name: str
    display_name: str
    positive_prompt: str
    negative_prompt: str = ""
    batch_size: int = Field(default=1, ge=1)
    preview_image: str | None = None


class LibraryEnvironment(BaseModel):
    name: str
    display_name: str
    environment_prompt: str
    thumbnail: str | None = None


class LibraryTechDefaults(BaseModel):
    comfyui_config: ComfyUIConfigModel
    workflow_config: WorkflowConfigParamsModel


class LibraryFile(BaseModel):
    scenes: list[LibraryScene]
    environments: list[LibraryEnvironment]
    default_tech_settings: LibraryTechDefaults | None = None
