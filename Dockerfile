# ==============================================================
# Stage 1: Frontend builder
# ==============================================================
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# 依存関係のインストール（package*.json を先にコピーしてキャッシュを活用）
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# ソースコードをコピーしてビルド
# tsc の型チェックは Docker 環境でプロジェクト参照（composite: true）の組み合わせにより
# exit code 2 で失敗するため、Vite のビルドのみ実行する（Vite は esbuild で TS をコンパイルする）
COPY frontend/ ./
RUN ls ./
RUN npx vite build

# ==============================================================
# Stage 2: Python runtime
# ==============================================================
FROM python:3.12-slim AS runtime

WORKDIR /app

# Python 依存関係のインストール（requirements.txt を先にコピーしてキャッシュを活用）
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# バックエンドパッケージをコピー
COPY backend/ ./backend/

# スキーマファイルをコピー
# backend/main.py の SCHEMA_PATH = Path(__file__).parent.parent / "docs" / "workflow_config_schema.json"
# コンテナ内では /app/docs/workflow_config_schema.json を参照するため必須
COPY docs/ ./docs/

# Stage 1 からフロントエンドビルド成果物をコピー
# backend/main.py の FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
# コンテナ内では /app/frontend/dist を参照する
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist/

EXPOSE 8080

# library.yaml は docker-compose でホストからマウントされる想定
# app_config.py の DEFAULT_LIBRARY_PATH = "library.yaml"（CWD 相対）
# WORKDIR=/app のため /app/library.yaml を参照する
CMD ["python", "-m", "backend.main", "--library-path", "/app/library.yaml"]
