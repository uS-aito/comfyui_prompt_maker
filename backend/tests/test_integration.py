"""
タスク 12.3: バックエンド統合テスト

実際のサービス層（LibraryService, ConfigGeneratorService, ConfigValidatorService）と
YAML ファイルを使用した往復テスト。モックを使用せず、フルスタックで動作を検証する。

対象:
  GET /api/scenes        → LibraryService → YAML ファイル
  GET /api/environments  → LibraryService → YAML ファイル
  GET /api/settings/defaults → LibraryService → YAML ファイル
  POST /api/generate     → ConfigGeneratorService → ConfigValidatorService → YAML レスポンス
  GET /api/images/{path} → LibraryService → 画像ファイル
"""

import sys
from pathlib import Path
from textwrap import dedent

import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

SCHEMA_PATH = PROJECT_ROOT / "docs" / "workflow_config_schema.json"

# ---------------------------------------------------------------------------
# テスト用 YAML フィクスチャ
# ---------------------------------------------------------------------------

LIBRARY_YAML_FULL = dedent("""\
    default_tech_settings:
      comfyui_config:
        server_address: "127.0.0.1:8188"
        client_id: "t2i_client"
      workflow_config:
        workflow_json_path: "/path/to/workflow.json"
        image_output_path: "/path/to/output"
        library_file_path: "/path/to/library.yaml"
        seed_node_id: 164
        batch_size_node_id: 22
        negative_prompt_node_id: 174
        positive_prompt_node_id: 257
        environment_prompt_node_id: 303
        default_prompts:
          base_positive_prompt: "masterpiece, best quality"
          environment_prompt: ""
          positive_prompt: ""
          negative_prompt: "lowres"
          batch_size: 1

    environments:
      - name: "indoor"
        display_name: "室内"
        environment_prompt: "indoor room, soft lighting"
        thumbnail: "thumbnails/indoor.jpg"
      - name: "outdoor"
        display_name: "屋外"
        environment_prompt: "outdoor, sunny"

    scenes:
      - name: "studying"
        display_name: "勉強しているシーン"
        positive_prompt: "sitting at desk, studying"
        negative_prompt: "blurry"
        batch_size: 2
        preview_image: "scenes/studying.jpg"
      - name: "sleeping"
        display_name: "寝ているシーン"
        positive_prompt: "lying in bed"
""")

LIBRARY_YAML_NO_DEFAULTS = dedent("""\
    environments:
      - name: "indoor"
        display_name: "室内"
        environment_prompt: "indoor room"

    scenes:
      - name: "studying"
        display_name: "勉強"
        positive_prompt: "studying"
""")


# ---------------------------------------------------------------------------
# ヘルパー
# ---------------------------------------------------------------------------


def _create_library_file(tmp_path: Path, content: str, filename: str = "library.yaml") -> Path:
    p = tmp_path / filename
    p.write_text(content, encoding="utf-8")
    return p


def _create_test_client(library_path: Path) -> TestClient:
    """実際のサービス層を使ったテスト用クライアントを生成する。"""
    from backend.main import create_app
    from backend.services.config_generator import ConfigGeneratorService
    from backend.services.config_validator import ConfigValidatorService
    from backend.services.library_service import LibraryService

    library_service = LibraryService()
    library_service.load(library_path)
    config_generator = ConfigGeneratorService()
    config_validator = ConfigValidatorService(SCHEMA_PATH)

    app = create_app(
        frontend_dist=Path("/nonexistent"),  # テストでは静的ファイル配信不要
        library_service=library_service,
        config_generator=config_generator,
        config_validator=config_validator,
    )
    return TestClient(app)


def _make_generate_request_body() -> dict:
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


# ---------------------------------------------------------------------------
# GET /api/scenes → LibraryService → YAML ファイル
# ---------------------------------------------------------------------------


class TestScenesIntegration:
    """GET /api/scenes の往復テスト（モックなし）。"""

    def test_returns_200(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        assert client.get("/api/scenes").status_code == 200

    def test_returns_all_scenes_from_yaml(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        data = client.get("/api/scenes").json()
        assert len(data) == 2

    def test_scene_fields_match_yaml(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        data = client.get("/api/scenes").json()
        studying = next(s for s in data if s["name"] == "studying")

        assert studying["display_name"] == "勉強しているシーン"
        assert studying["positive_prompt"] == "sitting at desk, studying"
        assert studying["negative_prompt"] == "blurry"
        assert studying["batch_size"] == 2

    def test_preview_image_url_uses_api_images_prefix(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        data = client.get("/api/scenes").json()
        studying = next(s for s in data if s["name"] == "studying")

        assert studying["preview_image_url"] == "/api/images/scenes/studying.jpg"

    def test_scene_without_preview_image_has_null_url(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        data = client.get("/api/scenes").json()
        sleeping = next(s for s in data if s["name"] == "sleeping")

        assert sleeping["preview_image_url"] is None

    def test_default_batch_size_applied(self, tmp_path):
        """batch_size 省略シーンのデフォルト値（1）が適用されること。"""
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        data = client.get("/api/scenes").json()
        sleeping = next(s for s in data if s["name"] == "sleeping")

        assert sleeping["batch_size"] == 1


# ---------------------------------------------------------------------------
# GET /api/environments → LibraryService → YAML ファイル
# ---------------------------------------------------------------------------


class TestEnvironmentsIntegration:
    """GET /api/environments の往復テスト（モックなし）。"""

    def test_returns_200(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        assert client.get("/api/environments").status_code == 200

    def test_returns_all_environments_from_yaml(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        data = client.get("/api/environments").json()
        assert len(data) == 2

    def test_environment_fields_match_yaml(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        data = client.get("/api/environments").json()
        indoor = next(e for e in data if e["name"] == "indoor")

        assert indoor["display_name"] == "室内"
        assert indoor["environment_prompt"] == "indoor room, soft lighting"

    def test_thumbnail_url_uses_api_images_prefix(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        data = client.get("/api/environments").json()
        indoor = next(e for e in data if e["name"] == "indoor")

        assert indoor["thumbnail_url"] == "/api/images/thumbnails/indoor.jpg"

    def test_environment_without_thumbnail_has_null_url(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        data = client.get("/api/environments").json()
        outdoor = next(e for e in data if e["name"] == "outdoor")

        assert outdoor["thumbnail_url"] is None


# ---------------------------------------------------------------------------
# GET /api/settings/defaults → LibraryService → YAML ファイル
# ---------------------------------------------------------------------------


class TestSettingsDefaultsIntegration:
    """GET /api/settings/defaults の往復テスト（モックなし）。"""

    def test_returns_200_when_defaults_defined(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        assert client.get("/api/settings/defaults").status_code == 200

    def test_comfyui_config_from_yaml(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        data = client.get("/api/settings/defaults").json()

        assert data["comfyui_config"]["server_address"] == "127.0.0.1:8188"
        assert data["comfyui_config"]["client_id"] == "t2i_client"

    def test_workflow_config_from_yaml(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        data = client.get("/api/settings/defaults").json()
        wc = data["workflow_config"]

        assert wc["workflow_json_path"] == "/path/to/workflow.json"
        assert wc["seed_node_id"] == 164
        assert wc["batch_size_node_id"] == 22

    def test_default_prompts_from_yaml(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        data = client.get("/api/settings/defaults").json()
        dp = data["workflow_config"]["default_prompts"]

        assert dp["base_positive_prompt"] == "masterpiece, best quality"
        assert dp["negative_prompt"] == "lowres"
        assert dp["batch_size"] == 1

    def test_returns_404_when_no_default_tech_settings(self, tmp_path):
        """default_tech_settings が YAML に存在しない場合は 404 を返すこと。"""
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_NO_DEFAULTS))
        assert client.get("/api/settings/defaults").status_code == 404


# ---------------------------------------------------------------------------
# POST /api/generate → ConfigGeneratorService → ConfigValidatorService → YAML
# ---------------------------------------------------------------------------


class TestGenerateIntegration:
    """POST /api/generate の往復テスト（モックなし）。"""

    def test_returns_200_on_valid_request(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        response = client.post("/api/generate", json=_make_generate_request_body())
        assert response.status_code == 200

    def test_response_is_parseable_yaml(self, tmp_path):
        import yaml
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        response = client.post("/api/generate", json=_make_generate_request_body())
        parsed = yaml.safe_load(response.content)
        assert parsed is not None

    def test_generated_yaml_has_required_sections(self, tmp_path):
        import yaml
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        response = client.post("/api/generate", json=_make_generate_request_body())
        parsed = yaml.safe_load(response.content)

        assert "comfyui_config" in parsed
        assert "workflow_config" in parsed
        assert "scenes" in parsed

    def test_environment_prompt_combines_character_and_environment(self, tmp_path):
        """character_name と environment_prompt が結合されること。"""
        import yaml
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        response = client.post("/api/generate", json=_make_generate_request_body())
        parsed = yaml.safe_load(response.content)

        env_prompt = parsed["workflow_config"]["default_prompts"]["environment_prompt"]
        assert "Hana" in env_prompt
        assert "indoor room, soft lighting" in env_prompt

    def test_scene_override_batch_size_is_applied(self, tmp_path):
        """scenes の override が反映されること。"""
        import yaml
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        body = _make_generate_request_body()
        body["scenes"] = [
            {"template_name": "studying", "overrides": {"batch_size": 5}},
        ]
        response = client.post("/api/generate", json=body)
        parsed = yaml.safe_load(response.content)

        assert parsed["scenes"][0]["batch_size"] == 5

    def test_multiple_scenes_preserved_in_output(self, tmp_path):
        import yaml
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        body = _make_generate_request_body()
        body["scenes"] = [
            {"template_name": "studying", "overrides": {}},
            {"template_name": "sleeping", "overrides": {"batch_size": 3}},
        ]
        response = client.post("/api/generate", json=body)
        parsed = yaml.safe_load(response.content)

        assert len(parsed["scenes"]) == 2
        assert parsed["scenes"][1]["batch_size"] == 3

    def test_content_disposition_attachment(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        response = client.post("/api/generate", json=_make_generate_request_body())
        disposition = response.headers.get("content-disposition", "")

        assert "attachment" in disposition
        assert "workflow_config.yaml" in disposition

    def test_content_type_is_yaml(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        response = client.post("/api/generate", json=_make_generate_request_body())

        assert "yaml" in response.headers["content-type"].lower()

    def test_empty_scenes_returns_422(self, tmp_path):
        """scenes が空のリクエストは Pydantic バリデーションで 422 を返すこと。"""
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        body = _make_generate_request_body()
        body["scenes"] = []
        response = client.post("/api/generate", json=body)

        assert response.status_code == 422

    def test_generated_yaml_passes_schema_validation(self, tmp_path):
        """生成された YAML が workflow_config_schema.json に準拠すること。"""
        import jsonschema
        import json
        import yaml

        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))
        response = client.post("/api/generate", json=_make_generate_request_body())
        parsed = yaml.safe_load(response.content)

        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        # スキーマ検証で例外が発生しないこと
        jsonschema.validate(instance=parsed, schema=schema)


# ---------------------------------------------------------------------------
# GET /api/images/{path} → LibraryService → 画像ファイル
# ---------------------------------------------------------------------------


class TestImageDeliveryIntegration:
    """GET /api/images/{path} の往復テスト（モックなし）。"""

    def test_serves_existing_image(self, tmp_path):
        (tmp_path / "scenes").mkdir()
        img_path = tmp_path / "scenes" / "studying.jpg"
        img_path.write_bytes(b"fake jpeg content")
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))

        response = client.get("/api/images/scenes/studying.jpg")

        assert response.status_code == 200
        assert response.content == b"fake jpeg content"

    def test_returns_404_for_nonexistent_image(self, tmp_path):
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))

        assert client.get("/api/images/nonexistent.jpg").status_code == 404

    def test_content_type_jpeg_for_jpg_file(self, tmp_path):
        (tmp_path / "scenes").mkdir()
        (tmp_path / "scenes" / "test.jpg").write_bytes(b"jpeg data")
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))

        response = client.get("/api/images/scenes/test.jpg")

        assert "image/jpeg" in response.headers["content-type"]

    def test_content_type_png_for_png_file(self, tmp_path):
        (tmp_path / "icon.png").write_bytes(b"png data")
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))

        response = client.get("/api/images/icon.png")

        assert "image/png" in response.headers["content-type"]

    def test_library_thumbnail_is_accessible(self, tmp_path):
        """ライブラリ YAML で定義されたサムネイルが実際に取得できること。"""
        (tmp_path / "thumbnails").mkdir()
        (tmp_path / "thumbnails" / "indoor.jpg").write_bytes(b"thumbnail data")
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))

        response = client.get("/api/images/thumbnails/indoor.jpg")

        assert response.status_code == 200
        assert response.content == b"thumbnail data"

    def test_deeply_nested_path_is_served(self, tmp_path):
        nested = tmp_path / "a" / "b"
        nested.mkdir(parents=True)
        (nested / "img.png").write_bytes(b"nested image")
        client = _create_test_client(_create_library_file(tmp_path, LIBRARY_YAML_FULL))

        response = client.get("/api/images/a/b/img.png")

        assert response.status_code == 200
        assert response.content == b"nested image"
