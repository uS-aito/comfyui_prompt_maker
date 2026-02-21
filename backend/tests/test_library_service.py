"""Task 3.2: LibraryService のユニットテスト"""

import sys
from pathlib import Path
from textwrap import dedent

import pytest


# ---------------------------------------------------------------------------
# YAML フィクスチャ
# ---------------------------------------------------------------------------

VALID_YAML_FULL = dedent("""\
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

VALID_YAML_MINIMAL = dedent("""\
    scenes:
      - name: "s"
        display_name: "S"
        positive_prompt: "p"
    environments:
      - name: "e"
        display_name: "E"
        environment_prompt: "ep"
""")

INVALID_YAML_MISSING_REQUIRED = dedent("""\
    scenes:
      - name: "s"
        display_name: "S"
        # positive_prompt が欠けている
    environments: []
""")

INVALID_YAML_SYNTAX = "scenes: [\n  invalid yaml"

INVALID_YAML_BAD_TYPE = dedent("""\
    scenes:
      - name: "s"
        display_name: "S"
        positive_prompt: "p"
        batch_size: "not_an_integer"
    environments: []
""")


# ---------------------------------------------------------------------------
# ヘルパー
# ---------------------------------------------------------------------------

def write_yaml(tmp_path: Path, content: str, filename: str = "library.yaml") -> Path:
    p = tmp_path / filename
    p.write_text(content, encoding="utf-8")
    return p


# ---------------------------------------------------------------------------
# 正常系: load() とアクセサ
# ---------------------------------------------------------------------------

class TestLibraryServiceLoad:
    def test_load_valid_full_yaml(self, tmp_path):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        path = write_yaml(tmp_path, VALID_YAML_FULL)
        svc.load(path)  # 例外なし

    def test_load_valid_minimal_yaml(self, tmp_path):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        path = write_yaml(tmp_path, VALID_YAML_MINIMAL)
        svc.load(path)

    def test_get_scenes_returns_all_scenes(self, tmp_path):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        svc.load(write_yaml(tmp_path, VALID_YAML_FULL))
        scenes = svc.get_scenes()
        assert len(scenes) == 2
        assert scenes[0].name == "studying"
        assert scenes[0].positive_prompt == "sitting at desk, studying"
        assert scenes[0].batch_size == 2
        assert scenes[1].name == "sleeping"

    def test_get_scenes_defaults_applied(self, tmp_path):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        svc.load(write_yaml(tmp_path, VALID_YAML_FULL))
        scenes = svc.get_scenes()
        # sleeping シーンは batch_size・negative_prompt が省略されている
        sleeping = next(s for s in scenes if s.name == "sleeping")
        assert sleeping.batch_size == 1
        assert sleeping.negative_prompt == ""

    def test_get_environments_returns_all_environments(self, tmp_path):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        svc.load(write_yaml(tmp_path, VALID_YAML_FULL))
        envs = svc.get_environments()
        assert len(envs) == 2
        assert envs[0].name == "indoor"
        assert envs[0].environment_prompt == "indoor room, soft lighting"
        assert envs[0].thumbnail == "thumbnails/indoor.jpg"
        assert envs[1].thumbnail is None

    def test_get_tech_defaults_with_settings(self, tmp_path):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        svc.load(write_yaml(tmp_path, VALID_YAML_FULL))
        td = svc.get_tech_defaults()
        assert td is not None
        assert td.comfyui_config.server_address == "127.0.0.1:8188"
        assert td.comfyui_config.client_id == "t2i_client"
        assert td.workflow_config.seed_node_id == 164
        assert td.workflow_config.default_prompts.base_positive_prompt == "masterpiece, best quality"

    def test_get_tech_defaults_returns_none_when_absent(self, tmp_path):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        svc.load(write_yaml(tmp_path, VALID_YAML_MINIMAL))
        assert svc.get_tech_defaults() is None

    def test_get_scenes_returns_empty_list_for_minimal(self, tmp_path):
        """minimal YAML でもシーンリストは正しく返される"""
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        svc.load(write_yaml(tmp_path, VALID_YAML_MINIMAL))
        assert len(svc.get_scenes()) == 1


# ---------------------------------------------------------------------------
# 正常系: resolve_image_path()
# ---------------------------------------------------------------------------

class TestResolveImagePath:
    def test_returns_absolute_path_for_existing_file(self, tmp_path):
        from backend.services.library_service import LibraryService
        # ライブラリファイルと同じディレクトリに画像を作成
        img = tmp_path / "scenes" / "studying.jpg"
        img.parent.mkdir()
        img.write_bytes(b"fake image")
        svc = LibraryService()
        svc.load(write_yaml(tmp_path, VALID_YAML_FULL))
        result = svc.resolve_image_path("scenes/studying.jpg")
        assert result is not None
        assert result.is_absolute()
        assert result == img

    def test_returns_none_for_nonexistent_file(self, tmp_path):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        svc.load(write_yaml(tmp_path, VALID_YAML_FULL))
        result = svc.resolve_image_path("nonexistent/image.jpg")
        assert result is None

    def test_resolves_relative_to_library_directory(self, tmp_path):
        from backend.services.library_service import LibraryService
        # サブディレクトリにライブラリファイルを置く
        subdir = tmp_path / "data"
        subdir.mkdir()
        img = subdir / "thumb.png"
        img.write_bytes(b"png")
        lib_path = subdir / "library.yaml"
        lib_path.write_text(VALID_YAML_MINIMAL, encoding="utf-8")
        svc = LibraryService()
        svc.load(lib_path)
        result = svc.resolve_image_path("thumb.png")
        assert result == img


# ---------------------------------------------------------------------------
# 異常系: 不正な YAML
# ---------------------------------------------------------------------------

class TestLibraryServiceErrors:
    def test_invalid_yaml_syntax_exits(self, tmp_path):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        with pytest.raises(SystemExit) as exc_info:
            svc.load(write_yaml(tmp_path, INVALID_YAML_SYNTAX))
        assert exc_info.value.code == 1

    def test_invalid_yaml_syntax_prints_error(self, tmp_path, capsys):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        with pytest.raises(SystemExit):
            svc.load(write_yaml(tmp_path, INVALID_YAML_SYNTAX))
        captured = capsys.readouterr()
        assert captured.err != "" or captured.out != ""

    def test_missing_required_field_exits(self, tmp_path):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        with pytest.raises(SystemExit) as exc_info:
            svc.load(write_yaml(tmp_path, INVALID_YAML_MISSING_REQUIRED))
        assert exc_info.value.code == 1

    def test_missing_required_field_prints_error(self, tmp_path, capsys):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        with pytest.raises(SystemExit):
            svc.load(write_yaml(tmp_path, INVALID_YAML_MISSING_REQUIRED))
        captured = capsys.readouterr()
        assert captured.err != "" or captured.out != ""

    def test_bad_type_exits(self, tmp_path):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        with pytest.raises(SystemExit) as exc_info:
            svc.load(write_yaml(tmp_path, INVALID_YAML_BAD_TYPE))
        assert exc_info.value.code == 1

    def test_file_not_found_exits(self, tmp_path):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        with pytest.raises(SystemExit) as exc_info:
            svc.load(tmp_path / "nonexistent.yaml")
        assert exc_info.value.code == 1

    def test_file_not_found_prints_error(self, tmp_path, capsys):
        from backend.services.library_service import LibraryService
        svc = LibraryService()
        with pytest.raises(SystemExit):
            svc.load(tmp_path / "nonexistent.yaml")
        captured = capsys.readouterr()
        assert captured.err != "" or captured.out != ""
