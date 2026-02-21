"""ConfigGeneratorService: GenerateRequest から workflow_config_schema 準拠の dict を生成する"""

from backend.models.api_models import GenerateRequest


class ConfigGenerationError(Exception):
    """コンフィグ生成に失敗した場合の例外"""
    pass


class ConfigGeneratorService:
    def generate(self, request: GenerateRequest) -> dict:
        """GenerateRequest から workflow_config_schema 準拠の dict を生成する。

        Raises:
            ConfigGenerationError: シーンが空の場合など生成不可の場合
        """
        if not request.scenes:
            raise ConfigGenerationError("シーンが1件以上必要です")

        return {
            "comfyui_config": self._build_comfyui_config(request),
            "workflow_config": self._build_workflow_config(request),
            "scenes": self._build_scenes(request),
        }

    def _build_comfyui_config(self, request: GenerateRequest) -> dict:
        cfg = request.tech_settings.comfyui_config
        return {
            "server_address": cfg.server_address,
            "client_id": cfg.client_id,
        }

    def _build_workflow_config(self, request: GenerateRequest) -> dict:
        wc = request.tech_settings.workflow_config
        dp = wc.default_prompts

        parts = [request.global_settings.character_name, request.global_settings.environment_prompt]
        combined_env_prompt = " ".join(p for p in parts if p)

        return {
            "workflow_json_path": wc.workflow_json_path,
            "image_output_path": wc.image_output_path,
            "library_file_path": wc.library_file_path,
            "seed_node_id": wc.seed_node_id,
            "batch_size_node_id": wc.batch_size_node_id,
            "negative_prompt_node_id": wc.negative_prompt_node_id,
            "positive_prompt_node_id": wc.positive_prompt_node_id,
            "environment_prompt_node_id": wc.environment_prompt_node_id,
            "default_prompts": {
                "base_positive_prompt": dp.base_positive_prompt,
                "environment_prompt": combined_env_prompt,
                "positive_prompt": dp.positive_prompt,
                "negative_prompt": dp.negative_prompt,
                "batch_size": dp.batch_size,
            },
        }

    def _build_scenes(self, request: GenerateRequest) -> list[dict]:
        dp = request.tech_settings.workflow_config.default_prompts
        scenes = []

        for scene_item in request.scenes:
            overrides = scene_item.overrides

            name = overrides.name if overrides.name is not None else scene_item.template_name
            scene_dict: dict = {"name": name}

            # positive_prompt: override が None なら default を使用。空文字なら omit
            positive_prompt = (
                overrides.positive_prompt
                if overrides.positive_prompt is not None
                else dp.positive_prompt
            )
            if positive_prompt:
                scene_dict["positive_prompt"] = positive_prompt

            # negative_prompt: override が None なら default を使用。空文字なら omit
            negative_prompt = (
                overrides.negative_prompt
                if overrides.negative_prompt is not None
                else dp.negative_prompt
            )
            if negative_prompt:
                scene_dict["negative_prompt"] = negative_prompt

            # batch_size: override が None なら default を使用（常に含める）
            batch_size = (
                overrides.batch_size
                if overrides.batch_size is not None
                else dp.batch_size
            )
            scene_dict["batch_size"] = batch_size

            scenes.append(scene_dict)

        return scenes
