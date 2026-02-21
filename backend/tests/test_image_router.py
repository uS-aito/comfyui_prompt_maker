"""
タスク 4.2: 画像配信 API ルーター実装 - ユニットテスト

対象エンドポイント:
  GET /api/images/{image_path:path}
"""
import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.routers.image_router import router
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


# ---------------------------------------------------------------------------
# GET /api/images/{image_path:path}
# ---------------------------------------------------------------------------


class TestGetImage:
    """GET /api/images/{image_path:path} エンドポイントのテスト。"""

    def test_returns_200_for_existing_image(self, tmp_path, mock_service):
        """画像ファイルが存在するとき、200 が返ること。"""
        img = tmp_path / "test.jpg"
        img.write_bytes(b"fake jpeg data")
        mock_service.resolve_image_path.return_value = img
        client = TestClient(create_test_app(mock_service))

        response = client.get("/api/images/test.jpg")

        assert response.status_code == 200

    def test_returns_404_when_path_not_resolved(self, mock_service):
        """resolve_image_path が None を返すとき、404 が返ること。"""
        mock_service.resolve_image_path.return_value = None
        client = TestClient(create_test_app(mock_service))

        response = client.get("/api/images/nonexistent.jpg")

        assert response.status_code == 404

    def test_404_response_has_detail(self, mock_service):
        """404 レスポンスに detail フィールドが含まれること。"""
        mock_service.resolve_image_path.return_value = None
        client = TestClient(create_test_app(mock_service))

        data = client.get("/api/images/nonexistent.jpg").json()

        assert "detail" in data

    def test_passes_simple_path_to_service(self, tmp_path, mock_service):
        """単純なパスが LibraryService に正しく渡されること。"""
        img = tmp_path / "test.jpg"
        img.write_bytes(b"data")
        mock_service.resolve_image_path.return_value = img
        client = TestClient(create_test_app(mock_service))

        client.get("/api/images/test.jpg")

        mock_service.resolve_image_path.assert_called_once_with("test.jpg")

    def test_passes_subdirectory_path_to_service(self, tmp_path, mock_service):
        """サブディレクトリを含むパスが LibraryService に正しく渡されること。"""
        subdir = tmp_path / "scenes"
        subdir.mkdir()
        img = subdir / "studying.jpg"
        img.write_bytes(b"data")
        mock_service.resolve_image_path.return_value = img
        client = TestClient(create_test_app(mock_service))

        client.get("/api/images/scenes/studying.jpg")

        mock_service.resolve_image_path.assert_called_once_with("scenes/studying.jpg")

    def test_returns_image_content(self, tmp_path, mock_service):
        """レスポンスボディに画像データが含まれること。"""
        img = tmp_path / "test.jpg"
        img.write_bytes(b"fake jpeg data")
        mock_service.resolve_image_path.return_value = img
        client = TestClient(create_test_app(mock_service))

        response = client.get("/api/images/test.jpg")

        assert response.content == b"fake jpeg data"

    def test_content_type_jpeg(self, tmp_path, mock_service):
        """.jpg ファイルに image/jpeg の Content-Type が付与されること。"""
        img = tmp_path / "photo.jpg"
        img.write_bytes(b"fake jpeg")
        mock_service.resolve_image_path.return_value = img
        client = TestClient(create_test_app(mock_service))

        response = client.get("/api/images/photo.jpg")

        assert "image/jpeg" in response.headers["content-type"]

    def test_content_type_png(self, tmp_path, mock_service):
        """.png ファイルに image/png の Content-Type が付与されること。"""
        img = tmp_path / "icon.png"
        img.write_bytes(b"fake png")
        mock_service.resolve_image_path.return_value = img
        client = TestClient(create_test_app(mock_service))

        response = client.get("/api/images/icon.png")

        assert "image/png" in response.headers["content-type"]

    def test_content_type_gif(self, tmp_path, mock_service):
        """.gif ファイルに image/gif の Content-Type が付与されること。"""
        img = tmp_path / "anim.gif"
        img.write_bytes(b"fake gif")
        mock_service.resolve_image_path.return_value = img
        client = TestClient(create_test_app(mock_service))

        response = client.get("/api/images/anim.gif")

        assert "image/gif" in response.headers["content-type"]

    def test_deeply_nested_path(self, tmp_path, mock_service):
        """深くネストしたパスが正しく処理されること。"""
        nested = tmp_path / "a" / "b" / "c"
        nested.mkdir(parents=True)
        img = nested / "img.png"
        img.write_bytes(b"data")
        mock_service.resolve_image_path.return_value = img
        client = TestClient(create_test_app(mock_service))

        client.get("/api/images/a/b/c/img.png")

        mock_service.resolve_image_path.assert_called_once_with("a/b/c/img.png")
