# ComfyUI Prompt Maker

ComfyUI のワークフロー設定を生成・管理する Web アプリケーションです。

## 構成

- **バックエンド**: Python / FastAPI + Uvicorn
- **フロントエンド**: React + TypeScript + Vite

## 事前準備

### Python 依存パッケージのインストール

```bash
pip install -r requirements.txt
```

### フロントエンド依存パッケージのインストール

```bash
cd frontend
npm install
```

### library.yaml の用意

バックエンドの起動には `library.yaml` が必要です。サンプルとして `backend/library.yaml` を参照してください。

---

## 起動方法

### 開発環境（バックエンド + フロントエンド を別々に起動）

**バックエンド（プロジェクトルートから実行）:**

```bash
python -m backend.main --library-path backend/library.yaml
```

**フロントエンド（別ターミナルで実行）:**

```bash
cd frontend
npm run dev
```

フロントエンド開発サーバが起動し、`/api` へのリクエストは `http://localhost:8080` のバックエンドへプロキシされます。

### 本番環境（バックエンドが静的ファイルを配信）

```bash
# フロントエンドをビルド
cd frontend && npm run build

# バックエンドを起動（frontend/dist/ を静的配信）
cd ..
python -m backend.main --library-path backend/library.yaml
```

ブラウザで `http://localhost:8080` を開いてください。

---

## 起動オプション

| オプション | デフォルト値 | 説明 |
|---|---|---|
| `--port` | `8080` | HTTP サーバのポート番号 |
| `--library-path` | `library.yaml` | ライブラリ YAML ファイルのパス |

```bash
# ポートを変更する
python -m backend.main --port 9000 --library-path backend/library.yaml

# ライブラリファイルのパスを指定する
python -m backend.main --library-path /path/to/your/library.yaml
```

---

## テスト

**バックエンド:**

```bash
pytest
```

**フロントエンド:**

```bash
cd frontend
npm test
```