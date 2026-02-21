"""
タスク 1.2: フロントエンドのプロジェクト初期化 - 構造テスト
"""
import json
from pathlib import Path

FRONTEND_ROOT = Path(__file__).parent.parent.parent / "frontend"


def test_frontend_package_json_exists():
    """frontend/package.json が存在すること"""
    assert (FRONTEND_ROOT / "package.json").exists()


def test_frontend_package_json_has_react():
    """package.json に react と react-dom が含まれること"""
    content = json.loads((FRONTEND_ROOT / "package.json").read_text())
    deps = {**content.get("dependencies", {}), **content.get("devDependencies", {})}
    assert "react" in deps
    assert "react-dom" in deps


def test_frontend_package_json_has_typescript():
    """package.json に typescript が含まれること"""
    content = json.loads((FRONTEND_ROOT / "package.json").read_text())
    deps = {**content.get("dependencies", {}), **content.get("devDependencies", {})}
    assert "typescript" in deps


def test_frontend_package_json_has_vite():
    """package.json に vite が含まれること"""
    content = json.loads((FRONTEND_ROOT / "package.json").read_text())
    deps = {**content.get("dependencies", {}), **content.get("devDependencies", {})}
    assert "vite" in deps


def test_frontend_package_json_has_vitejs_plugin_react():
    """package.json に @vitejs/plugin-react が含まれること"""
    content = json.loads((FRONTEND_ROOT / "package.json").read_text())
    deps = {**content.get("dependencies", {}), **content.get("devDependencies", {})}
    assert "@vitejs/plugin-react" in deps


def test_frontend_tsconfig_exists():
    """frontend/tsconfig.json が存在すること"""
    assert (FRONTEND_ROOT / "tsconfig.json").exists()


def test_frontend_vite_config_exists():
    """frontend/vite.config.ts が存在すること"""
    assert (FRONTEND_ROOT / "vite.config.ts").exists()


def test_frontend_vite_config_has_proxy():
    """vite.config.ts にバックエンドへのプロキシ設定が含まれること"""
    content = (FRONTEND_ROOT / "vite.config.ts").read_text()
    # プロキシ設定でバックエンドポート(8080)が指定されていること
    assert "proxy" in content
    assert "8080" in content


def test_frontend_index_html_exists():
    """frontend/index.html が存在すること"""
    assert (FRONTEND_ROOT / "index.html").exists()


def test_frontend_src_directory_exists():
    """frontend/src/ ディレクトリが存在すること"""
    assert (FRONTEND_ROOT / "src").is_dir()


def test_frontend_main_tsx_exists():
    """frontend/src/main.tsx が存在すること"""
    assert (FRONTEND_ROOT / "src" / "main.tsx").exists()


def test_frontend_app_tsx_exists():
    """frontend/src/App.tsx が存在すること"""
    assert (FRONTEND_ROOT / "src" / "App.tsx").exists()
