"""
FastAPI アプリ定義・起動エントリポイント
"""
import sys
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .app_config import AppConfig
from .routers.generate_router import router as generate_router
from .routers.image_router import router as image_router
from .routers.library_router import router as library_router
from .services.config_generator import ConfigGeneratorService
from .services.config_validator import ConfigValidatorService
from .services.library_service import LibraryService

# React ビルド成果物のデフォルトパス（プロジェクトルート基準）
FRONTEND_DIST: Path = Path(__file__).parent.parent / "frontend" / "dist"

# workflow_config_schema.json のパス
SCHEMA_PATH: Path = Path(__file__).parent.parent / "docs" / "workflow_config_schema.json"


def create_app(
    frontend_dist: Path = FRONTEND_DIST,
    library_service: LibraryService | None = None,
    config_generator: ConfigGeneratorService | None = None,
    config_validator: ConfigValidatorService | None = None,
) -> FastAPI:
    """FastAPI アプリを生成する。

    API ルーターを登録できる構成にし、frontend/dist/ が存在する場合は
    静的ファイルとして配信する設定を行う（静的マウントは最後に行い API ルートを優先）。

    Args:
        frontend_dist: React ビルド成果物のディレクトリパス。
        library_service: LibraryService インスタンス。提供時は app.state に格納する。
        config_generator: ConfigGeneratorService インスタンス。提供時は app.state に格納する。
        config_validator: ConfigValidatorService インスタンス。提供時は app.state に格納する。

    Returns:
        設定済み FastAPI インスタンス。
    """
    app = FastAPI(title="ComfyUI Workflow Config Generator")

    if library_service is not None:
        app.state.library_service = library_service
    if config_generator is not None:
        app.state.config_generator = config_generator
    if config_validator is not None:
        app.state.config_validator = config_validator

    # API ルーターを登録する
    app.include_router(library_router, prefix="/api")
    app.include_router(image_router, prefix="/api")
    app.include_router(generate_router, prefix="/api")

    # React ビルド成果物の静的ファイル配信（API ルートより後に登録）
    if frontend_dist.exists():
        app.mount(
            "/",
            StaticFiles(directory=frontend_dist, html=True),
            name="static",
        )

    return app


def start_server(config: AppConfig, frontend_dist: Path = FRONTEND_DIST) -> None:
    """uvicorn でサーバを起動する。

    Args:
        config: 起動設定（ポート番号を含む）。
        frontend_dist: React ビルド成果物のディレクトリパス（テスト用に注入可能）。

    Raises:
        SystemExit: サーバの起動に失敗した場合（終了コード 1）。
    """
    library_service = LibraryService()
    library_service.load(config.library_path)
    config_generator = ConfigGeneratorService()
    config_validator = ConfigValidatorService(SCHEMA_PATH)
    app = create_app(
        frontend_dist,
        library_service=library_service,
        config_generator=config_generator,
        config_validator=config_validator,
    )
    print(f"サーバを起動しています: http://localhost:{config.port}")

    try:
        uvicorn.run(app, host="0.0.0.0", port=config.port)
    except Exception as e:
        print(f"エラー: サーバの起動に失敗しました: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    config = AppConfig.from_args()
    start_server(config)
