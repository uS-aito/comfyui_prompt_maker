"""
画像配信 API ルーター

エンドポイント:
  GET /api/images/{image_path:path} - ライブラリ基準の相対パスから画像ファイルを配信する
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse

from ..services.library_service import LibraryService

router = APIRouter()


def get_library_service(request: Request) -> LibraryService:
    """app.state から LibraryService を取得する依存関数。"""
    return request.app.state.library_service


@router.get("/images/{image_path:path}")
async def get_image(
    image_path: str,
    service: LibraryService = Depends(get_library_service),
):
    """ライブラリ基準の相対パスから画像ファイルを取得して配信する。

    画像形式に応じた Content-Type ヘッダを付与する。
    対応ファイルが存在しない場合は HTTP 404 を返す。
    """
    abs_path = service.resolve_image_path(image_path)
    if abs_path is None:
        raise HTTPException(status_code=404, detail="画像ファイルが見つかりません")
    return FileResponse(abs_path)
