"""
AppConfig: CLI 引数解析・起動設定管理
"""
import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

# デフォルト値定数
DEFAULT_PORT: int = 8080
DEFAULT_LIBRARY_PATH: Path = Path("library.yaml")


@dataclass(frozen=True)
class AppConfig:
    """起動設定を保持する不変データクラス。"""

    port: int
    library_path: Path

    @classmethod
    def from_args(cls, args: list[str] | None = None) -> "AppConfig":
        """CLI 引数またはデフォルト値から AppConfig を構築する。

        Args:
            args: コマンドライン引数のリスト。None の場合は sys.argv[1:] を使用。

        Returns:
            AppConfig インスタンス。library_path は存在するファイルを指す。

        Raises:
            SystemExit: ライブラリファイルが存在しない場合（終了コード 1）
        """
        parser = argparse.ArgumentParser(
            description="ComfyUI Workflow Config Generator"
        )
        parser.add_argument(
            "--port",
            type=int,
            default=DEFAULT_PORT,
            help=f"HTTP サーバのポート番号（デフォルト: {DEFAULT_PORT}）",
        )
        parser.add_argument(
            "--library-path",
            type=Path,
            default=DEFAULT_LIBRARY_PATH,
            dest="library_path",
            help=f"ライブラリ YAML ファイルのパス（デフォルト: {DEFAULT_LIBRARY_PATH}）",
        )

        parsed = parser.parse_args(args)
        library_path: Path = parsed.library_path

        if not library_path.exists():
            print(
                f"エラー: ライブラリファイルが見つかりません: {library_path}",
                file=sys.stderr,
            )
            sys.exit(1)

        return cls(port=parsed.port, library_path=library_path)
