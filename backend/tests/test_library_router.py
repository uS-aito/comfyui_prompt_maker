"""
タスク 4.1: ライブラリ API ルーター実装 - ユニットテスト

対象エンドポイント:
  GET /api/scenes
  GET /api/environments
  GET /api/settings/defaults
"""
import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.models.library_models import (
    ComfyUIConfigModel,
    DefaultPromptsModel,
    LibraryEnvironment,
    LibraryScene,
    LibraryTechDefaults,
    WorkflowConfigParamsModel,
)
from backend.routers.library_router import router
from backend.services.library_service import LibraryService


# ---------------------------------------------------------------------------
# テスト用アプリ・フィクスチャ
# ---------------------------------------------------------------------------


def create_test_app(library_service: LibraryService) -> FastAPI:
    """テスト用 FastAPI アプリを生成する。"""
    app = FastAPI()
    app.state.library_service = library_service
    app.include_router(router, prefix="/api")
    return app


@pytest.fixture
def mock_service():
    """テスト用 LibraryService モック。"""
    return MagicMock(spec=LibraryService)


@pytest.fixture
def sample_scenes():
    return [
        LibraryScene(
            name="studying",
            display_name="勉強シーン",
            positive_prompt="sitting at desk, studying",
            negative_prompt="bad quality",
            batch_size=1,
            preview_image="scenes/studying.jpg",
        ),
        LibraryScene(
            name="sleeping",
            display_name="睡眠シーン",
            positive_prompt="lying in bed, sleeping",
            negative_prompt="",
            batch_size=2,
            preview_image=None,
        ),
    ]


@pytest.fixture
def sample_environments():
    return [
        LibraryEnvironment(
            name="indoor",
            display_name="室内",
            environment_prompt="indoor room, soft lighting",
            thumbnail="thumbnails/indoor.jpg",
        ),
        LibraryEnvironment(
            name="outdoor",
            display_name="屋外",
            environment_prompt="outdoor, sunny day",
            thumbnail=None,
        ),
    ]


@pytest.fixture
def sample_tech_defaults():
    return LibraryTechDefaults(
        comfyui_config=ComfyUIConfigModel(
            server_address="127.0.0.1:8188",
            client_id="t2i_client",
        ),
        workflow_config=WorkflowConfigParamsModel(
            workflow_json_path="/path/to/workflow.json",
            image_output_path="/path/to/output",
            library_file_path="/path/to/library.yaml",
            seed_node_id=164,
            batch_size_node_id=22,
            negative_prompt_node_id=174,
            positive_prompt_node_id=257,
            environment_prompt_node_id=303,
            default_prompts=DefaultPromptsModel(
                base_positive_prompt="masterpiece, best quality",
                environment_prompt="",
                positive_prompt="",
                negative_prompt="lowres, bad anatomy",
                batch_size=1,
            ),
        ),
    )


# ---------------------------------------------------------------------------
# GET /api/scenes
# ---------------------------------------------------------------------------


class TestGetScenes:
    """GET /api/scenes エンドポイントのテスト。"""

    def test_returns_200(self, mock_service, sample_scenes):
        """シーン一覧取得で 200 が返ること。"""
        mock_service.get_scenes.return_value = sample_scenes
        client = TestClient(create_test_app(mock_service))

        response = client.get("/api/scenes")

        assert response.status_code == 200

    def test_returns_all_scenes(self, mock_service, sample_scenes):
        """シーンテンプレート一覧の件数が一致すること。"""
        mock_service.get_scenes.return_value = sample_scenes
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/scenes").json()

        assert len(data) == 2

    def test_scene_name_field(self, mock_service, sample_scenes):
        """name フィールドが正しく変換されること。"""
        mock_service.get_scenes.return_value = sample_scenes
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/scenes").json()

        assert data[0]["name"] == "studying"

    def test_scene_display_name_field(self, mock_service, sample_scenes):
        """display_name フィールドが正しく変換されること。"""
        mock_service.get_scenes.return_value = sample_scenes
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/scenes").json()

        assert data[0]["display_name"] == "勉強シーン"

    def test_scene_prompt_fields(self, mock_service, sample_scenes):
        """positive_prompt・negative_prompt・batch_size が正しく変換されること。"""
        mock_service.get_scenes.return_value = sample_scenes
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/scenes").json()
        scene = data[0]

        assert scene["positive_prompt"] == "sitting at desk, studying"
        assert scene["negative_prompt"] == "bad quality"
        assert scene["batch_size"] == 1

    def test_preview_image_url_when_image_exists(self, mock_service, sample_scenes):
        """preview_image が設定されている場合、/api/images/ プレフィックスの URL が返ること。"""
        mock_service.get_scenes.return_value = sample_scenes
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/scenes").json()

        assert data[0]["preview_image_url"] == "/api/images/scenes/studying.jpg"

    def test_preview_image_url_is_null_when_no_image(self, mock_service, sample_scenes):
        """preview_image が None の場合、preview_image_url は null であること。"""
        mock_service.get_scenes.return_value = sample_scenes
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/scenes").json()

        assert data[1]["preview_image_url"] is None

    def test_empty_scene_list_returns_empty_array(self, mock_service):
        """シーンが空の場合、空配列を返すこと。"""
        mock_service.get_scenes.return_value = []
        client = TestClient(create_test_app(mock_service))

        response = client.get("/api/scenes")

        assert response.status_code == 200
        assert response.json() == []


# ---------------------------------------------------------------------------
# GET /api/environments
# ---------------------------------------------------------------------------


class TestGetEnvironments:
    """GET /api/environments エンドポイントのテスト。"""

    def test_returns_200(self, mock_service, sample_environments):
        """環境一覧取得で 200 が返ること。"""
        mock_service.get_environments.return_value = sample_environments
        client = TestClient(create_test_app(mock_service))

        response = client.get("/api/environments")

        assert response.status_code == 200

    def test_returns_all_environments(self, mock_service, sample_environments):
        """環境一覧の件数が一致すること。"""
        mock_service.get_environments.return_value = sample_environments
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/environments").json()

        assert len(data) == 2

    def test_environment_name_field(self, mock_service, sample_environments):
        """name フィールドが正しく変換されること。"""
        mock_service.get_environments.return_value = sample_environments
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/environments").json()

        assert data[0]["name"] == "indoor"

    def test_environment_display_name_field(self, mock_service, sample_environments):
        """display_name フィールドが正しく変換されること。"""
        mock_service.get_environments.return_value = sample_environments
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/environments").json()

        assert data[0]["display_name"] == "室内"

    def test_environment_prompt_field(self, mock_service, sample_environments):
        """environment_prompt フィールドが正しく変換されること。"""
        mock_service.get_environments.return_value = sample_environments
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/environments").json()

        assert data[0]["environment_prompt"] == "indoor room, soft lighting"

    def test_thumbnail_url_when_thumbnail_exists(self, mock_service, sample_environments):
        """thumbnail が設定されている場合、/api/images/ プレフィックスの URL が返ること。"""
        mock_service.get_environments.return_value = sample_environments
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/environments").json()

        assert data[0]["thumbnail_url"] == "/api/images/thumbnails/indoor.jpg"

    def test_thumbnail_url_is_null_when_no_thumbnail(self, mock_service, sample_environments):
        """thumbnail が None の場合、thumbnail_url は null であること。"""
        mock_service.get_environments.return_value = sample_environments
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/environments").json()

        assert data[1]["thumbnail_url"] is None

    def test_empty_environment_list_returns_empty_array(self, mock_service):
        """環境が空の場合、空配列を返すこと。"""
        mock_service.get_environments.return_value = []
        client = TestClient(create_test_app(mock_service))

        response = client.get("/api/environments")

        assert response.status_code == 200
        assert response.json() == []


# ---------------------------------------------------------------------------
# GET /api/settings/defaults
# ---------------------------------------------------------------------------


class TestGetSettingsDefaults:
    """GET /api/settings/defaults エンドポイントのテスト。"""

    def test_returns_200_when_defaults_exist(self, mock_service, sample_tech_defaults):
        """デフォルト技術設定が存在するとき、200 が返ること。"""
        mock_service.get_tech_defaults.return_value = sample_tech_defaults
        client = TestClient(create_test_app(mock_service))

        response = client.get("/api/settings/defaults")

        assert response.status_code == 200

    def test_returns_comfyui_config(self, mock_service, sample_tech_defaults):
        """comfyui_config フィールドが正しく返ること。"""
        mock_service.get_tech_defaults.return_value = sample_tech_defaults
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/settings/defaults").json()

        assert data["comfyui_config"]["server_address"] == "127.0.0.1:8188"
        assert data["comfyui_config"]["client_id"] == "t2i_client"

    def test_returns_workflow_config(self, mock_service, sample_tech_defaults):
        """workflow_config フィールドが正しく返ること。"""
        mock_service.get_tech_defaults.return_value = sample_tech_defaults
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/settings/defaults").json()
        wc = data["workflow_config"]

        assert wc["workflow_json_path"] == "/path/to/workflow.json"
        assert wc["seed_node_id"] == 164
        assert wc["batch_size_node_id"] == 22

    def test_returns_default_prompts(self, mock_service, sample_tech_defaults):
        """workflow_config 内の default_prompts が正しく返ること。"""
        mock_service.get_tech_defaults.return_value = sample_tech_defaults
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/settings/defaults").json()
        dp = data["workflow_config"]["default_prompts"]

        assert dp["base_positive_prompt"] == "masterpiece, best quality"
        assert dp["negative_prompt"] == "lowres, bad anatomy"

    def test_returns_404_when_no_defaults(self, mock_service):
        """デフォルト設定が未設定の場合（None）、404 を返すこと。"""
        mock_service.get_tech_defaults.return_value = None
        client = TestClient(create_test_app(mock_service))

        response = client.get("/api/settings/defaults")

        assert response.status_code == 404

    def test_404_response_has_detail(self, mock_service):
        """404 レスポンスに detail フィールドが含まれること。"""
        mock_service.get_tech_defaults.return_value = None
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/settings/defaults").json()

        assert "detail" in data
