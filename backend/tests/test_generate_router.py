"""Task 5.4: Generate ルーター実装 - ユニットテスト"""

import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.services.config_generator import ConfigGeneratorService
from backend.services.config_validator import ConfigValidationError, ConfigValidatorService


def _create_test_app(generator, validator) -> FastAPI:
    from backend.routers.generate_router import router
    app = FastAPI()
    app.state.config_generator = generator
    app.state.config_validator = validator
    app.include_router(router, prefix="/api")
    return app


def _make_valid_request_body() -> dict:
    return {
        "global_settings": {
            "character_name": "Hana",
            "environment_name": "indoor",
            "environment_prompt": "indoor room, soft lighting",
        },
        "tech_settings": {
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
        },
        "scenes": [
            {"template_name": "studying", "overrides": {}},
        ],
    }


def _make_valid_config_dict() -> dict:
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
                "environment_prompt": "Hana indoor room, soft lighting",
                "positive_prompt": "",
                "negative_prompt": "lowres",
                "batch_size": 1,
            },
        },
        "scenes": [{"name": "studying", "batch_size": 1}],
    }


def _make_success_client(config_dict=None):
    mock_generator = MagicMock(spec=ConfigGeneratorService)
    mock_validator = MagicMock(spec=ConfigValidatorService)
    mock_generator.generate.return_value = config_dict or _make_valid_config_dict()
    mock_validator.validate.return_value = None
    return TestClient(_create_test_app(mock_generator, mock_validator))


class TestGenerateRouterSuccess:
    def test_returns_200_on_valid_request(self):
        client = _make_success_client()
        response = client.post("/api/generate", json=_make_valid_request_body())
        assert response.status_code == 200

    def test_response_content_type_is_yaml(self):
        client = _make_success_client()
        response = client.post("/api/generate", json=_make_valid_request_body())
        assert "yaml" in response.headers["content-type"].lower()

    def test_response_has_content_disposition_attachment(self):
        client = _make_success_client()
        response = client.post("/api/generate", json=_make_valid_request_body())
        disposition = response.headers.get("content-disposition", "")
        assert "attachment" in disposition

    def test_response_body_is_parseable_yaml(self):
        import yaml
        client = _make_success_client()
        response = client.post("/api/generate", json=_make_valid_request_body())
        parsed = yaml.safe_load(response.content)
        assert parsed is not None
        assert "comfyui_config" in parsed

    def test_generator_is_called_once(self):
        mock_generator = MagicMock(spec=ConfigGeneratorService)
        mock_validator = MagicMock(spec=ConfigValidatorService)
        mock_generator.generate.return_value = _make_valid_config_dict()
        client = TestClient(_create_test_app(mock_generator, mock_validator))
        client.post("/api/generate", json=_make_valid_request_body())
        mock_generator.generate.assert_called_once()

    def test_validator_is_called_with_generated_dict(self):
        mock_generator = MagicMock(spec=ConfigGeneratorService)
        mock_validator = MagicMock(spec=ConfigValidatorService)
        generated = _make_valid_config_dict()
        mock_generator.generate.return_value = generated
        client = TestClient(_create_test_app(mock_generator, mock_validator))
        client.post("/api/generate", json=_make_valid_request_body())
        mock_validator.validate.assert_called_once_with(generated)

    def test_filename_in_content_disposition(self):
        client = _make_success_client()
        response = client.post("/api/generate", json=_make_valid_request_body())
        disposition = response.headers.get("content-disposition", "")
        assert "workflow_config.yaml" in disposition


class TestGenerateRouterValidationFailure:
    def _make_client_with_error(self, error_message="スキーマ違反: 必須フィールドが欠損"):
        mock_generator = MagicMock(spec=ConfigGeneratorService)
        mock_validator = MagicMock(spec=ConfigValidatorService)
        mock_generator.generate.return_value = _make_valid_config_dict()
        mock_validator.validate.side_effect = ConfigValidationError(error_message)
        return TestClient(_create_test_app(mock_generator, mock_validator))

    def test_returns_422_on_schema_validation_failure(self):
        client = self._make_client_with_error()
        response = client.post("/api/generate", json=_make_valid_request_body())
        assert response.status_code == 422

    def test_422_response_contains_detail(self):
        client = self._make_client_with_error("スキーマ違反: 必須フィールドが欠損")
        response = client.post("/api/generate", json=_make_valid_request_body())
        data = response.json()
        assert "detail" in data

    def test_422_response_detail_contains_violation_message(self):
        client = self._make_client_with_error("スキーマ違反: 必須フィールドが欠損")
        response = client.post("/api/generate", json=_make_valid_request_body())
        data = response.json()
        assert "スキーマ違反" in str(data["detail"])


class TestGenerateRouterInvalidRequest:
    def _make_client(self):
        mock_generator = MagicMock(spec=ConfigGeneratorService)
        mock_validator = MagicMock(spec=ConfigValidatorService)
        return TestClient(_create_test_app(mock_generator, mock_validator))

    def test_returns_422_on_empty_scenes(self):
        client = self._make_client()
        body = _make_valid_request_body()
        body["scenes"] = []
        response = client.post("/api/generate", json=body)
        assert response.status_code == 422

    def test_returns_422_on_missing_global_settings(self):
        client = self._make_client()
        body = _make_valid_request_body()
        del body["global_settings"]
        response = client.post("/api/generate", json=body)
        assert response.status_code == 422

    def test_returns_422_on_missing_tech_settings(self):
        client = self._make_client()
        body = _make_valid_request_body()
        del body["tech_settings"]
        response = client.post("/api/generate", json=body)
        assert response.status_code == 422
