# 要件定義書

## プロジェクト説明（入力）
サーバサイドの設定ファイルの明白化

## はじめに

本仕様は、FastAPI + Uvicorn で構成されるバックエンドサーバの設定管理を明確化・体系化することを目的とする。

現状、設定値はコード内にハードコードされるか CLI 引数のみで指定する方式となっており、環境変数・設定ファイルによる制御が存在しない。これにより、デプロイ環境の切り替えや設定値の把握が困難になっている。本機能では、すべての設定可能な値を一元的に宣言し、環境変数または設定ファイルで制御できるよう明白化する。

**対象スコープ:**
- `backend/app_config.py` — サーバ起動設定の一元管理
- `backend/main.py` — ハードコードされたパス定数の設定化
- `frontend/vite.config.ts` — 開発サーバプロキシ設定の環境変数化
- `.env.example` — 設定テンプレートファイルの新規作成

---

## 要件

### 要件 1: 設定値の一元化と明示的宣言

**目的:** 開発者として、すべてのサーバ設定値が一箇所に明示的に宣言されていることを求める。それにより、設定項目の全容を把握し、変更箇所を特定しやすくする。

#### 受け入れ基準

1. The Config Manager shall define all configurable parameters — `SERVER_PORT`、`SERVER_HOST`、`LIBRARY_PATH`、`FRONTEND_DIST`、`SCHEMA_PATH` — with their types, default values, and descriptions in a single location.
2. The Config Manager shall expose these parameters in a structured `AppConfig` dataclass that is consumed by all modules requiring configuration.
3. The Config Manager shall not allow hardcoded values for any of the above parameters outside of the configuration module.
4. When any module requires a configurable value, the Config Manager shall be the sole source of truth for that value.

---

### 要件 2: 環境変数による設定オーバーライド

**目的:** 開発者として、環境変数でサーバ設定を上書きできるようにすることを求める。それにより、コードを変更せずに複数のデプロイ環境（開発・本番等）に対応できる。

#### 受け入れ基準

1. When environment variables (`SERVER_PORT`、`SERVER_HOST`、`LIBRARY_PATH`、`FRONTEND_DIST`、`SCHEMA_PATH`) are set, the Config Manager shall use them as configuration values.
2. The Config Manager shall apply configuration in the following priority order: CLI 引数 > 環境変数 > `.env` ファイル > デフォルト値.
3. If an environment variable contains an invalid value (e.g., non-integer port number), the Config Manager shall output an error message including the variable name and the expected format, then terminate.
4. While the server is loading configuration, the Config Manager shall log which source (CLI / 環境変数 / デフォルト) each parameter value was resolved from.

---

### 要件 3: `.env` ファイルサポート

**目的:** 開発者として、`.env` ファイルで設定値を宣言できるようにすることを求める。それにより、環境変数を手動でエクスポートせずに開発環境の設定を管理できる。

#### 受け入れ基準

1. When a `.env` file exists in the project root, the Config Manager shall load it and apply its values before falling back to defaults.
2. The Config Manager shall support `python-dotenv` (または互換ライブラリ) for `.env` file parsing.
3. If the `.env` file contains a syntax error, the Config Manager shall report the line number and error detail, then terminate.
4. Where no `.env` file exists, the Config Manager shall proceed normally using environment variables and defaults without error.

---

### 要件 4: 設定テンプレートファイルの提供

**目的:** 開発者として、利用可能な設定値を一覧できるテンプレートファイル (`.env.example`) が存在することを求める。それにより、新規セットアップ時の設定作業を効率化できる。

#### 受け入れ基準

1. The system shall provide a `.env.example` file in the project root listing all supported environment variables.
2. Each entry in `.env.example` shall include the variable name, its default value, and an inline comment describing its purpose and accepted value range.
3. When a new configurable parameter is added to the Config Manager, the `.env.example` shall be updated to include the corresponding entry.
4. The `.env.example` shall be committed to version control and shall not contain sensitive values.

---

### 要件 5: 起動時設定バリデーション

**目的:** 開発者として、サーバ起動時に設定値が検証されることを求める。それにより、不正な設定値による実行時エラーを起動フェーズで早期に検出できる。

#### 受け入れ基準

1. When the server starts, the Config Manager shall validate all configuration values before any service is initialized.
2. If `LIBRARY_PATH` is configured but the specified file does not exist, the Config Manager shall output an error message with the resolved path and terminate with a non-zero exit code.
3. If `SERVER_PORT` is outside the valid range (1–65535), the Config Manager shall output an error message with the received value and terminate.
4. If `SCHEMA_PATH` is configured but the JSON Schema file does not exist, the Config Manager shall output an error message with the resolved path and terminate.
5. When all validation passes, the Config Manager shall output a summary of active configuration values (port、host、paths) at INFO log level.

---

### 要件 6: フロントエンド開発サーバのプロキシ設定の環境変数化

**目的:** 開発者として、Vite 開発サーバのバックエンドプロキシ先を環境変数で制御できるようにすることを求める。それにより、異なるポートやホストでバックエンドを起動した場合でも `vite.config.ts` を手動編集せずに対応できる。

#### 受け入れ基準

1. The Vite Config shall read the backend proxy target from the `VITE_API_SERVER` environment variable (e.g., `http://localhost:8080`).
2. When `VITE_API_SERVER` is not set, the Vite Config shall fall back to `http://localhost:8080` as the default proxy target.
3. The `.env.example` shall include the `VITE_API_SERVER` variable with a description and default value.
4. Where a `.env` file exists in the `frontend/` directory, the Vite Config shall load it automatically via Vite's built-in env file support.

---

### 要件 7: 設定ドキュメントの整備

**目的:** 開発者として、全設定パラメータの意味・型・デフォルト値・制約がドキュメントに記載されていることを求める。それにより、オンボーディングや運用時の設定作業の参照先が明確になる。

#### 受け入れ基準

1. The system shall maintain documentation (README または専用設定ガイド) listing all configurable parameters with name、type、default value、required/optional status、and description.
2. When the configurable parameters change, the documentation shall be updated in the same commit.
3. The Config Manager shall include inline docstrings or comments for each parameter in the source code.
