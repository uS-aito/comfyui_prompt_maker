"""
タスク 2.1: AppConfig 実装（CLI 引数解析・起動設定）- ユニットテスト
"""
import sys
from pathlib import Path

import pytest

BACKEND_ROOT = Path(__file__).parent.parent
PROJECT_ROOT = BACKEND_ROOT.parent

# backend パッケージのルートをパスに追加
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app_config import AppConfig, DEFAULT_PORT, DEFAULT_LIBRARY_PATH


class TestAppConfigDefaults:
    """デフォルト値のテスト"""

    def test_default_port_is_8080(self):
        """DEFAULT_PORT 定数が 8080 であること"""
        assert DEFAULT_PORT == 8080

    def test_default_library_path_is_defined(self):
        """DEFAULT_LIBRARY_PATH 定数が定義されていること"""
        assert DEFAULT_LIBRARY_PATH is not None

    def test_from_args_no_args_uses_default_port(self, tmp_path):
        """引数なしの場合、デフォルトポート 8080 が使われること"""
        # デフォルトライブラリパスの代わりに一時ファイルを使う
        library_file = tmp_path / "library.yaml"
        library_file.write_text("scenes: []\nenvironments: []\n")
        config = AppConfig.from_args(["--library-path", str(library_file)])
        assert config.port == DEFAULT_PORT

    def test_from_args_no_args_with_env_library_path(self, tmp_path):
        """デフォルトライブラリパスが存在する場合、引数なしで起動できること"""
        library_file = tmp_path / "library.yaml"
        library_file.write_text("scenes: []\nenvironments: []\n")
        # モンキーパッチで DEFAULT_LIBRARY_PATH を一時ファイルに置き換える
        import backend.app_config as mod
        original = mod.DEFAULT_LIBRARY_PATH
        mod.DEFAULT_LIBRARY_PATH = library_file
        try:
            config = AppConfig.from_args([])
            assert config.port == DEFAULT_PORT
            assert config.library_path == library_file
        finally:
            mod.DEFAULT_LIBRARY_PATH = original


class TestAppConfigWithArgs:
    """引数ありのテスト"""

    def test_custom_port(self, tmp_path):
        """--port 引数でポート番号を指定できること"""
        library_file = tmp_path / "library.yaml"
        library_file.write_text("scenes: []\nenvironments: []\n")
        config = AppConfig.from_args(["--port", "9090", "--library-path", str(library_file)])
        assert config.port == 9090

    def test_custom_library_path(self, tmp_path):
        """--library-path 引数でライブラリファイルパスを指定できること"""
        library_file = tmp_path / "custom_library.yaml"
        library_file.write_text("scenes: []\nenvironments: []\n")
        config = AppConfig.from_args(["--library-path", str(library_file)])
        assert config.library_path == library_file

    def test_library_path_is_path_object(self, tmp_path):
        """library_path が pathlib.Path オブジェクトであること"""
        library_file = tmp_path / "library.yaml"
        library_file.write_text("scenes: []\nenvironments: []\n")
        config = AppConfig.from_args(["--library-path", str(library_file)])
        assert isinstance(config.library_path, Path)

    def test_library_path_points_to_existing_file(self, tmp_path):
        """返された AppConfig の library_path は存在するファイルを指すこと（事後条件）"""
        library_file = tmp_path / "library.yaml"
        library_file.write_text("scenes: []\nenvironments: []\n")
        config = AppConfig.from_args(["--library-path", str(library_file)])
        assert config.library_path.exists()

    def test_config_is_immutable(self, tmp_path):
        """AppConfig は frozen dataclass であり、フィールドを変更できないこと"""
        library_file = tmp_path / "library.yaml"
        library_file.write_text("scenes: []\nenvironments: []\n")
        config = AppConfig.from_args(["--library-path", str(library_file)])
        with pytest.raises(Exception):  # FrozenInstanceError or AttributeError
            config.port = 9999  # type: ignore


class TestAppConfigFileNotFound:
    """ライブラリファイル不在のテスト"""

    def test_missing_library_path_exits_with_code_1(self, tmp_path):
        """存在しないライブラリパスを指定した場合、sys.exit(1) が呼ばれること"""
        nonexistent = tmp_path / "nonexistent.yaml"
        with pytest.raises(SystemExit) as exc_info:
            AppConfig.from_args(["--library-path", str(nonexistent)])
        assert exc_info.value.code == 1

    def test_missing_library_path_prints_error(self, tmp_path, capsys):
        """存在しないライブラリパスを指定した場合、エラーメッセージがコンソールへ出力されること"""
        nonexistent = tmp_path / "nonexistent.yaml"
        with pytest.raises(SystemExit):
            AppConfig.from_args(["--library-path", str(nonexistent)])
        captured = capsys.readouterr()
        # stderr または stdout にエラーメッセージが出力されること
        assert len(captured.err) > 0 or len(captured.out) > 0

    def test_missing_default_library_path_exits(self, tmp_path):
        """デフォルトライブラリパスが存在しない場合も sys.exit(1) が呼ばれること"""
        import backend.app_config as mod
        original = mod.DEFAULT_LIBRARY_PATH
        mod.DEFAULT_LIBRARY_PATH = tmp_path / "nonexistent_default.yaml"
        try:
            with pytest.raises(SystemExit) as exc_info:
                AppConfig.from_args([])
            assert exc_info.value.code == 1
        finally:
            mod.DEFAULT_LIBRARY_PATH = original
