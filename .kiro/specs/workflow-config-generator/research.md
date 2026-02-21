# リサーチ・設計判断記録

---
**目的**: 設計フェーズにおけるリサーチ結果、アーキテクチャ調査内容、および設計判断の根拠を記録する。

---

## サマリー

- **フィーチャー**: `workflow-config-generator`
- **ディスカバリスコープ**: New Feature（グリーンフィールド）
- **主要な知見**:
  - Python + FastAPI が ComfyUI エコシステム（Python ベース）との親和性が最も高く、単一プロセスで静的ファイルと REST API を提供できる
  - React + TypeScript + Vite の組み合わせがドロワー・オーバーレイ・リアルタイム状態更新を含む UI 要件を型安全に実装できる
  - 単一プロセスアーキテクチャ（FastAPI が SPA とAPIを両方サーブ）がパーソナルツールとしての運用シンプルさに最適

---

## リサーチログ

### バックエンドフレームワーク選定

- **背景**: HTTPサーバ・REST API・静的ファイル配信・YAML生成を単一Pythonプロセスで実現するフレームワークが必要
- **参照**:
  - FastAPI 公式ドキュメント（https://fastapi.tiangolo.com）
  - Flask vs FastAPI 比較（型安全性・自動スキーマ生成・Pydantic統合）
- **知見**:
  - FastAPI は Pydantic による型安全な入出力バリデーションが標準搭載
  - `StaticFiles` mount により React ビルド成果物を静的配信可能
  - 非同期対応（async/await）により将来の拡張性も確保
  - Flask は型安全性が低く Pydantic 統合に追加設定が必要
- **影響**: FastAPI を採用。Pydantic v2 モデルで全 API スキーマを定義することで型安全性を保証する

### フロントエンドフレームワーク選定

- **背景**: スライドインドロワー・オーバーレイ・リアルタイム状態更新・サムネイル付きプルダウンを含む複合UI
- **参照**: React 18 公式ドキュメント、Vite 公式ドキュメント
- **知見**:
  - React 18 + TypeScript はコンポーネントの型境界を明確にできる
  - `useContext + useReducer` パターンがシーンキューのような中規模状態管理に適する
  - Vite によるビルドはホットリロードと高速ビルドを両立
  - Vanilla JS では状態管理の複雑さとUIの動的更新に手動実装コストが高い
- **影響**: React 18 + TypeScript + Vite を採用。外部状態管理ライブラリ（Redux/Zustand）は現スコープでは不要と判断

### YAML生成ライブラリ選定

- **背景**: `workflow_config_schema.json` に準拠した YAML を出力する。コメント保持・構造的フォーマットが要件
- **知見**:
  - `PyYAML`: 標準的だが出力フォーマット制御に制限がある
  - `ruamel.yaml`: コメント保持・ブロックスタイル強制・フォーマット制御が優れる
  - t2i_client_java は人間が読めるYAML を想定しているため出力フォーマットが重要
- **影響**: `ruamel.yaml` を採用。コメント付きYAMLサンプルと整合した出力を保証する

### スキーマバリデーションライブラリ選定

- **背景**: 生成した YAML が `workflow_config_schema.json`（JSON Schema draft-07）に準拠することをサーバサイドで検証する必要がある
- **知見**:
  - `jsonschema` ライブラリが JSON Schema draft-07 を完全サポート
  - Pydantic のバリデーションは入力API向けであり、出力YAML のスキーマ検証には jsonschema が適切
- **影響**: `jsonschema 4.x` を採用

### ライブラリファイルのフォーマット設計

- **背景**: シーンテンプレートと環境の定義を外部 YAML ファイルで管理する必要がある（要件 3）。`workflow_config_schema.json` の `library_file_path` フィールドと同名ファイルを兼用するか、専用ファイルにするかを検討
- **知見**:
  - t2i_client_java の library_file_path は別途定義されており、本ツールのライブラリファイルとは別物
  - UI 用ライブラリファイルは `scenes`・`environments`・`default_tech_settings` を含む独自スキーマが必要
  - 画像ファイルパスはライブラリファイルのディレクトリからの相対パスとすることで可搬性を確保
- **影響**: 専用ライブラリファイルフォーマット（YAML）を設計。画像パスはライブラリファイルのあるディレクトリからの相対パスとして解決する

### 技術設定（TechSettings）の UI 配置

- **背景**: `comfyui_config` とノードIDなどの技術的パラメータをUIで編集可能にする必要がある（要件 6）。3ペインレイアウトのどこに配置するか
- **知見**:
  - 技術設定は頻繁に変更するものではなく、グローバル設定（左ペイン）の延長として扱える
  - 折りたたみ（Collapse）セクションとして左ペイン下部に配置することで、通常操作の邪魔にならず必要時に展開できる
- **影響**: 左ペインの下部に「詳細設定」折りたたみセクションとして `TechSettingsPanel` を配置する

---

## アーキテクチャパターン評価

| オプション | 説明 | 強み | リスク・制限 | 備考 |
|-----------|------|------|-------------|------|
| レイヤードアーキテクチャ | Presentation → Application → Domain → Infrastructure | シンプル・学習コスト低 | 大規模化時の境界が曖昧になりやすい | 単一ユーザー・小規模ツールに最適 |
| ヘキサゴナル（ポート＆アダプタ） | ドメイン中心・外部接続をアダプタで分離 | テスタブル・差し替え容易 | 構造の複雑さが増す | 現スコープでは過剰設計 |
| MVC（サーバサイドレンダリング） | コントローラがビューとモデルを仲介 | 従来的で理解しやすい | SPA要件と相性が悪い | 要件（ドロワー・リアルタイム更新）に不適合 |

**選択**: レイヤードアーキテクチャ（バックエンド）+ React Context/Reducer パターン（フロントエンド）

---

## 設計判断

### 判断: 単一プロセス構成（FastAPI が SPA + API を兼任）

- **背景**: 本ツールはパーソナルユースで複数ユーザー同時利用は想定外。デプロイ・起動の簡易性が重要
- **検討した代替案**:
  1. 別プロセス構成（FastAPI API + Nginx/Vite dev server）— 開発は便利だが本番運用が複雑
  2. Electron アプリ — インストールの手間、ブラウザ操作に比べて利点が少ない
- **選択したアプローチ**: FastAPI の `StaticFiles` で React ビルド成果物を `/ ` にマウント、`/api` 以下で REST API を提供
- **根拠**: 単一コマンド起動、別プロセス管理不要、ファイアウォール設定最小化
- **トレードオフ**: フロントエンドの変更にはビルドが必要（開発時は Vite dev server + CORS で対応）
- **フォローアップ**: 開発時の CORS 設定を FastAPI 側で環境変数制御する

### 判断: React Context + useReducer（外部状態管理ライブラリなし）

- **背景**: シーンキュー・グローバル設定・ドロワー状態を複数コンポーネントで共有する必要がある
- **検討した代替案**:
  1. Redux Toolkit — 機能豊富だが現スコープには過剰
  2. Zustand — 軽量だが外部依存を増やす
  3. useContext + useReducer — 標準ライブラリのみで実現可能
- **選択したアプローチ**: `AppContext` + `appReducer` で全アプリ状態を管理。アクションを Discriminated Union で型定義
- **根拠**: 外部依存なし・TypeScript の型安全性を最大限活用・スコープに対して適切な複雑度
- **トレードオフ**: 大規模化時は Zustand/Redux への移行が必要になる可能性

### 判断: ライブラリファイルの画像パスをライブラリファイル基準の相対パスとして解決

- **背景**: プレビュー画像の配置場所が環境によって異なる。絶対パスにすると可搬性が損なわれる
- **選択したアプローチ**: ライブラリ YAML ファイルが置かれたディレクトリを `image_base_dir` として、相対パスを解決してサーブ
- **根拠**: ライブラリファイルと画像を同じディレクトリに置けば環境依存なし

---

## リスクと緩和策

- **フロントエンドビルド成果物の同梱** — 開発時は `vite dev` + FastAPI CORS で対応。本番時は `vite build` 後に `backend/static/` へコピーするスクリプトを用意する
- **jsonschema による YAML 検証** — YAML を dict に変換して jsonschema で検証する。ruamel.yaml による dict 変換の精度に依存するため、ラウンドトリップテストで確認する
- **ライブラリファイルの画像パス解決失敗** — 画像不在の場合は API が `preview_image_url: null` を返すようにし、フロントエンドはフォールバック画像を表示することで UX を保つ

---

## 参考文献

- [FastAPI 公式ドキュメント](https://fastapi.tiangolo.com) — StaticFiles, Pydantic v2 統合
- [ruamel.yaml ドキュメント](https://yaml.readthedocs.io/en/latest/) — YAML 生成フォーマット制御
- [jsonschema ライブラリ](https://python-jsonschema.readthedocs.io/) — JSON Schema draft-07 バリデーション
- [React Context + useReducer パターン](https://react.dev/reference/react/useReducer) — 状態管理
- [Vite 公式ドキュメント](https://vitejs.dev) — ビルドツール設定
