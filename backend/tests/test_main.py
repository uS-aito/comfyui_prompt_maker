"""
タスク 2.2: FastAPI アプリ起動エントリポイント実装 - ユニットテスト
"""
import sys
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app_config import AppConfig
from backend.main import FRONTEND_DIST, create_app, start_server


class TestCreateApp:
    """create_app() のテスト"""

    def test_returns_fastapi_instance(self, tmp_path):
        """create_app() が FastAPI インスタンスを返すこと"""
        app = create_app(tmp_path)
        assert isinstance(app, FastAPI)

    def test_serves_index_html_when_frontend_dist_exists(self, tmp_path):
        """frontend/dist が存在するとき、GET / で index.html が配信されること"""
        (tmp_path / "index.html").write_text("<html><body>Hello SPA</body></html>")
        app = create_app(tmp_path)
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/")
        assert response.status_code == 200
        assert "Hello SPA" in response.text

    def test_returns_app_when_frontend_dist_missing(self, tmp_path):
        """frontend/dist が存在しないとき、エラーなく FastAPI インスタンスを返すこと"""
        nonexistent = tmp_path / "nonexistent"
        app = create_app(nonexistent)
        assert isinstance(app, FastAPI)

    def test_api_routes_accessible_without_frontend_dist(self, tmp_path):
        """frontend/dist がなくても /api エンドポイントが機能すること"""
        nonexistent = tmp_path / "nonexistent"
        app = create_app(nonexistent)

        @app.get("/api/ping")
        def ping():
            return {"status": "ok"}

        client = TestClient(app)
        response = client.get("/api/ping")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_api_routes_registered_before_mount_are_accessible(self, tmp_path):
        """静的マウント前に登録された /api/* ルートはアクセス可能であること（ルート優先順の確認）"""
        (tmp_path / "index.html").write_text("<html>SPA</html>")

        # create_app と同様の順序でアプリを構築する: ルート → 静的マウント
        app = FastAPI()

        @app.get("/api/health")
        def health():
            return {"ok": True}

        # 静的マウントは最後に追加（create_app の実装と同じ順序）
        from fastapi.staticfiles import StaticFiles
        app.mount("/", StaticFiles(directory=tmp_path, html=True), name="static")

        client = TestClient(app)
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"ok": True}

    def test_frontend_dist_constant_is_defined(self):
        """FRONTEND_DIST 定数が定義されていること"""
        assert FRONTEND_DIST is not None
        assert isinstance(FRONTEND_DIST, Path)

    def test_frontend_dist_points_to_frontend_dist_directory(self):
        """FRONTEND_DIST が frontend/dist を指すこと"""
        assert FRONTEND_DIST.name == "dist"
        assert FRONTEND_DIST.parent.name == "frontend"


class TestStartServer:
    """start_server() のテスト"""

    def _make_config(self, tmp_path: Path, port: int = 8080) -> AppConfig:
        library_file = tmp_path / "library.yaml"
        library_file.write_text("scenes: []\nenvironments: []\n")
        return AppConfig(port=port, library_path=library_file)

    def test_calls_uvicorn_run_with_correct_port(self, tmp_path):
        """start_server() が AppConfig のポートで uvicorn.run を呼ぶこと"""
        config = self._make_config(tmp_path, port=9999)

        with patch("backend.main.uvicorn.run") as mock_run:
            start_server(config, tmp_path)
            mock_run.assert_called_once()
            _, kwargs = mock_run.call_args
            assert kwargs.get("port") == 9999

    def test_calls_uvicorn_run_with_app_instance(self, tmp_path):
        """start_server() が FastAPI インスタンスを uvicorn.run に渡すこと"""
        config = self._make_config(tmp_path)

        with patch("backend.main.uvicorn.run") as mock_run:
            start_server(config, tmp_path)
            mock_run.assert_called_once()
            args, _ = mock_run.call_args
            assert isinstance(args[0], FastAPI)

    def test_prints_access_url_to_stdout(self, tmp_path, capsys):
        """start_server() 起動前にアクセス URL（http://... ポート番号含む）をコンソールへ表示すること"""
        config = self._make_config(tmp_path, port=8080)

        with patch("backend.main.uvicorn.run"):
            start_server(config, tmp_path)

        captured = capsys.readouterr()
        assert "8080" in captured.out
        assert "http" in captured.out.lower()

    def test_exits_with_code_1_on_uvicorn_error(self, tmp_path):
        """uvicorn.run が例外を raise した場合、sys.exit(1) が呼ばれること"""
        config = self._make_config(tmp_path)

        with patch("backend.main.uvicorn.run", side_effect=OSError("Port in use")):
            with pytest.raises(SystemExit) as exc_info:
                start_server(config, tmp_path)
            assert exc_info.value.code == 1

    def test_prints_error_on_uvicorn_failure(self, tmp_path, capsys):
        """uvicorn.run が失敗した場合、エラーメッセージがコンソールへ出力されること"""
        config = self._make_config(tmp_path)

        with patch("backend.main.uvicorn.run", side_effect=OSError("Port in use")):
            with pytest.raises(SystemExit):
                start_server(config, tmp_path)

        captured = capsys.readouterr()
        assert len(captured.err) > 0 or len(captured.out) > 0

    def test_start_server_uses_host_0000(self, tmp_path):
        """start_server() が host="0.0.0.0" で uvicorn.run を呼ぶこと（全 IF からアクセス可能）"""
        config = self._make_config(tmp_path)

        with patch("backend.main.uvicorn.run") as mock_run:
            start_server(config, tmp_path)
            _, kwargs = mock_run.call_args
            assert kwargs.get("host") == "0.0.0.0"
