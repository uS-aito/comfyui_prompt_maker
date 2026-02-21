"""
タスク 1.1: Python バックエンドのプロジェクト初期化 - 構造テスト
"""
import importlib
from pathlib import Path

BACKEND_ROOT = Path(__file__).parent.parent
PROJECT_ROOT = BACKEND_ROOT.parent


def test_backend_models_package_exists():
    """backend/models/ パッケージが存在すること"""
    assert (BACKEND_ROOT / "models" / "__init__.py").exists()


def test_backend_services_package_exists():
    """backend/services/ パッケージが存在すること"""
    assert (BACKEND_ROOT / "services" / "__init__.py").exists()


def test_backend_routers_package_exists():
    """backend/routers/ パッケージが存在すること"""
    assert (BACKEND_ROOT / "routers" / "__init__.py").exists()


def test_backend_init_exists():
    """backend/__init__.py が存在すること"""
    assert (BACKEND_ROOT / "__init__.py").exists()


def test_requirements_txt_exists():
    """requirements.txt がプロジェクトルートに存在すること"""
    assert (PROJECT_ROOT / "requirements.txt").exists()


def test_requirements_txt_contains_fastapi():
    """requirements.txt に fastapi が含まれること"""
    content = (PROJECT_ROOT / "requirements.txt").read_text()
    assert "fastapi" in content


def test_requirements_txt_contains_uvicorn():
    """requirements.txt に uvicorn[standard] が含まれること"""
    content = (PROJECT_ROOT / "requirements.txt").read_text()
    assert "uvicorn[standard]" in content


def test_requirements_txt_contains_ruamel_yaml():
    """requirements.txt に ruamel.yaml が含まれること"""
    content = (PROJECT_ROOT / "requirements.txt").read_text()
    assert "ruamel.yaml" in content


def test_requirements_txt_contains_jsonschema():
    """requirements.txt に jsonschema が含まれること"""
    content = (PROJECT_ROOT / "requirements.txt").read_text()
    assert "jsonschema" in content


def test_requirements_txt_contains_pydantic():
    """requirements.txt に pydantic が含まれること"""
    content = (PROJECT_ROOT / "requirements.txt").read_text()
    assert "pydantic" in content


def test_backend_models_importable():
    """backend.models が import 可能であること"""
    spec = importlib.util.find_spec("backend.models")
    assert spec is not None


def test_backend_services_importable():
    """backend.services が import 可能であること"""
    spec = importlib.util.find_spec("backend.services")
    assert spec is not None


def test_backend_routers_importable():
    """backend.routers が import 可能であること"""
    spec = importlib.util.find_spec("backend.routers")
    assert spec is not None
