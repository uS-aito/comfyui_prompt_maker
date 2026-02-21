import sys
from pathlib import Path

# プロジェクトルートを sys.path に追加して backend パッケージをインポート可能にする
sys.path.insert(0, str(Path(__file__).parent))
