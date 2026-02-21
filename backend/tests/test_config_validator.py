"""Task 5.3: ConfigValidatorService ユニットテスト"""

from pathlib import Path

import pytest

SCHEMA_PATH = Path(__file__).parents[2] / "docs" / "workflow_config_schema.json"


def _make_valid_config() -> dict:
    """スキーマに準拠した最小有効コンフィグを返す"""
    return {
        "comfyui_config": {
            "server_address": "127.0.0.1:8188",
            "client_id": "t2i_client",
        },
        "workflow_config": {
            "workflow_json_path": "/path/to/workflow.json",
            "image_output_path": "/path/to/output",
            "library_file_path": "/path/to/library.yaml",
            "seed_node_id": 164,
            "batch_size_node_id": 22,
            "negative_prompt_node_id": 174,
            "positive_prompt_node_id": 257,
            "environment_prompt_node_id": 303,
            "default_prompts": {
                "base_positive_prompt": "masterpiece",
                "environment_prompt": "",
                "positive_prompt": "",
                "negative_prompt": "lowres",
                "batch_size": 1,
            },
        },
        "scenes": [
            {"name": "studying"},
        ],
    }


class TestConfigValidatorServiceInit:
    def test_loads_schema_from_path(self):
        from backend.services.config_validator import ConfigValidatorService
        svc = ConfigValidatorService(SCHEMA_PATH)
        assert svc is not None

    def test_raises_if_schema_file_not_found(self):
        from backend.services.config_validator import ConfigValidatorService
        with pytest.raises(FileNotFoundError):
            ConfigValidatorService(Path("/nonexistent/schema.json"))


class TestConfigValidatorServiceValidate:
    def _service(self):
        from backend.services.config_validator import ConfigValidatorService
        return ConfigValidatorService(SCHEMA_PATH)

    def test_valid_config_passes(self):
        svc = self._service()
        svc.validate(_make_valid_config())  # 例外なし

    def test_valid_config_with_multiple_scenes(self):
        svc = self._service()
        config = _make_valid_config()
        config["scenes"].append({"name": "sleeping", "batch_size": 2})
        svc.validate(config)  # 例外なし

    def test_missing_comfyui_config_raises(self):
        from backend.services.config_validator import ConfigValidationError
        svc = self._service()
        config = _make_valid_config()
        del config["comfyui_config"]
        with pytest.raises(ConfigValidationError):
            svc.validate(config)

    def test_missing_workflow_config_raises(self):
        from backend.services.config_validator import ConfigValidationError
        svc = self._service()
        config = _make_valid_config()
        del config["workflow_config"]
        with pytest.raises(ConfigValidationError):
            svc.validate(config)

    def test_missing_scenes_raises(self):
        from backend.services.config_validator import ConfigValidationError
        svc = self._service()
        config = _make_valid_config()
        del config["scenes"]
        with pytest.raises(ConfigValidationError):
            svc.validate(config)

    def test_missing_comfyui_server_address_raises(self):
        from backend.services.config_validator import ConfigValidationError
        svc = self._service()
        config = _make_valid_config()
        del config["comfyui_config"]["server_address"]
        with pytest.raises(ConfigValidationError):
            svc.validate(config)

    def test_missing_comfyui_client_id_raises(self):
        from backend.services.config_validator import ConfigValidationError
        svc = self._service()
        config = _make_valid_config()
        del config["comfyui_config"]["client_id"]
        with pytest.raises(ConfigValidationError):
            svc.validate(config)

    def test_missing_workflow_json_path_raises(self):
        from backend.services.config_validator import ConfigValidationError
        svc = self._service()
        config = _make_valid_config()
        del config["workflow_config"]["workflow_json_path"]
        with pytest.raises(ConfigValidationError):
            svc.validate(config)

    def test_missing_default_prompts_raises(self):
        from backend.services.config_validator import ConfigValidationError
        svc = self._service()
        config = _make_valid_config()
        del config["workflow_config"]["default_prompts"]
        with pytest.raises(ConfigValidationError):
            svc.validate(config)

    def test_missing_default_prompts_base_positive_prompt_raises(self):
        from backend.services.config_validator import ConfigValidationError
        svc = self._service()
        config = _make_valid_config()
        del config["workflow_config"]["default_prompts"]["base_positive_prompt"]
        with pytest.raises(ConfigValidationError):
            svc.validate(config)

    def test_wrong_type_seed_node_id_raises(self):
        from backend.services.config_validator import ConfigValidationError
        svc = self._service()
        config = _make_valid_config()
        config["workflow_config"]["seed_node_id"] = "not_an_int"
        with pytest.raises(ConfigValidationError):
            svc.validate(config)

    def test_wrong_type_batch_size_in_default_prompts_raises(self):
        from backend.services.config_validator import ConfigValidationError
        svc = self._service()
        config = _make_valid_config()
        config["workflow_config"]["default_prompts"]["batch_size"] = "not_an_int"
        with pytest.raises(ConfigValidationError):
            svc.validate(config)

    def test_batch_size_zero_in_default_prompts_raises(self):
        from backend.services.config_validator import ConfigValidationError
        svc = self._service()
        config = _make_valid_config()
        config["workflow_config"]["default_prompts"]["batch_size"] = 0
        with pytest.raises(ConfigValidationError):
            svc.validate(config)

    def test_scene_batch_size_zero_raises(self):
        from backend.services.config_validator import ConfigValidationError
        svc = self._service()
        config = _make_valid_config()
        config["scenes"][0]["batch_size"] = 0
        with pytest.raises(ConfigValidationError):
            svc.validate(config)

    def test_scene_missing_name_raises(self):
        from backend.services.config_validator import ConfigValidationError
        svc = self._service()
        config = _make_valid_config()
        config["scenes"] = [{"positive_prompt": "sitting"}]  # name なし
        with pytest.raises(ConfigValidationError):
            svc.validate(config)

    def test_validation_error_contains_violation_detail(self):
        from backend.services.config_validator import ConfigValidationError
        svc = self._service()
        config = _make_valid_config()
        del config["comfyui_config"]
        with pytest.raises(ConfigValidationError) as exc_info:
            svc.validate(config)
        assert str(exc_info.value)  # エラーメッセージが空でない
