"""LibraryService: ライブラリ YAML を起動時に読み込み、シーン・環境・設定データを提供する"""

import sys
from pathlib import Path

from pydantic import ValidationError
from ruamel.yaml import YAML, YAMLError

from backend.models.library_models import (
    LibraryEnvironment,
    LibraryFile,
    LibraryScene,
    LibraryTechDefaults,
)


class LibraryService:
    """ライブラリ YAML を起動時に一度だけ読み込み、メモリで保持・提供するサービス。"""

    def __init__(self) -> None:
        self._library_file: LibraryFile | None = None
        self._library_dir: Path | None = None

    # ------------------------------------------------------------------
    # 起動時ロード
    # ------------------------------------------------------------------

    def load(self, library_path: Path) -> None:
        """ライブラリ YAML を読み込みメモリに保持する。

        フォーマット不正またはファイル不在の場合はエラーをコンソールに出力し
        sys.exit(1) でプロセスを終了する。
        """
        if not library_path.exists():
            print(
                f"エラー: ライブラリファイルが見つかりません: {library_path}",
                file=sys.stderr,
            )
            sys.exit(1)

        yaml = YAML()
        try:
            with open(library_path, encoding="utf-8") as f:
                raw = yaml.load(f)
        except YAMLError as exc:
            print(
                f"エラー: ライブラリ YAML の解析に失敗しました:\n{exc}",
                file=sys.stderr,
            )
            sys.exit(1)

        try:
            self._library_file = LibraryFile.model_validate(raw)
        except ValidationError as exc:
            print(
                f"エラー: ライブラリファイルの形式が不正です:\n{exc}",
                file=sys.stderr,
            )
            sys.exit(1)

        self._library_dir = library_path.parent.resolve()

    # ------------------------------------------------------------------
    # アクセサ
    # ------------------------------------------------------------------

    def get_scenes(self) -> list[LibraryScene]:
        """ロード済みのシーンテンプレート一覧を返す。"""
        assert self._library_file is not None, "load() を先に呼び出してください"
        return self._library_file.scenes

    def get_environments(self) -> list[LibraryEnvironment]:
        """ロード済みの環境一覧を返す。"""
        assert self._library_file is not None, "load() を先に呼び出してください"
        return self._library_file.environments

    def get_tech_defaults(self) -> LibraryTechDefaults | None:
        """ロード済みのデフォルト技術設定を返す。未定義の場合は None。"""
        assert self._library_file is not None, "load() を先に呼び出してください"
        return self._library_file.default_tech_settings

    # ------------------------------------------------------------------
    # 画像パス解決
    # ------------------------------------------------------------------

    def resolve_image_path(self, relative_path: str) -> Path | None:
        """ライブラリディレクトリ基準の相対パスを絶対パスに解決する。

        ファイルが存在しない場合は None を返す。
        """
        assert self._library_dir is not None, "load() を先に呼び出してください"
        abs_path = (self._library_dir / relative_path).resolve()
        return abs_path if abs_path.exists() else None
