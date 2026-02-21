# 実装計画

- [ ] 1. プロジェクト基盤構築
- [x] 1.1 Python バックエンドのプロジェクト初期化
  - backend/ のディレクトリ構成（models/, services/, routers/）を作成する
  - requirements.txt に fastapi, uvicorn[standard], ruamel.yaml, jsonschema, pydantic を記載する
  - _Requirements: 1, 2_

- [x] 1.2 (P) フロントエンドのプロジェクト初期化
  - Vite + React + TypeScript の構成で frontend/ プロジェクトを初期化する（package.json, tsconfig.json, vite.config.ts を含む）
  - 開発時にバックエンドポートへリクエストをプロキシする設定を vite.config.ts に追加する
  - _Requirements: 1_

- [ ] 2. バックエンド起動・設定管理
- [x] 2.1 AppConfig 実装（CLI 引数解析・起動設定）
  - `--port`（デフォルト 8080）と `--library-path` の CLI 引数を解析する機能を実装する
  - 指定ライブラリファイルの存在確認を行い、不在の場合はエラーをコンソールに出力してプロセスを終了する
  - デフォルト値を定数として管理する
  - _Requirements: 2_

- [x] 2.2 FastAPI アプリ起動エントリポイント実装
  - FastAPI インスタンスを生成し、後続タスクで実装するルーターを登録できる構成にする
  - React ビルド成果物（frontend/dist/）を `/` に静的ファイルとして配信する設定を実装する
  - uvicorn で AppConfig のポートを使用してサーバを起動し、アクセス URL をコンソールに表示する
  - 起動失敗時のエラーハンドリングとプロセス終了を実装する
  - _Requirements: 1, 2_

- [ ] 3. ライブラリデータモデルと LibraryService
- [x] 3.1 Pydantic モデル定義（ライブラリ系・API レスポンス系）
  - ライブラリ YAML 読み込み用モデル（LibraryScene, LibraryEnvironment, LibraryTechDefaults, LibraryFile）を定義する
  - ライブラリ API レスポンス用モデル（SceneTemplateResponse, EnvironmentResponse, TechDefaultsResponse）を定義する
  - _Requirements: 3, 4_

- [x] 3.2 LibraryService 実装
  - 起動時にライブラリ YAML を読み込みメモリに保持する `load()` メソッドを実装する
  - シーン・環境・技術デフォルト設定を返すアクセサメソッドを実装する
  - 画像ファイルパスをライブラリファイルのディレクトリ基準の相対パスから絶対パスに解決するメソッドを実装する
  - YAML フォーマット不正時に詳細をコンソールに出力してプロセスを終了するエラーハンドリングを実装する
  - _Requirements: 3, 5_

- [ ] 4. ライブラリ・画像配信 API ルーター
- [x] 4.1 (P) ライブラリ API ルーター実装
  - `GET /api/scenes` でシーンテンプレート一覧（名前・プロンプト・プレビュー画像 URL）を JSON で返すエンドポイントを実装する
  - `GET /api/environments` で環境一覧（名前・環境プロンプト・サムネイル URL）を JSON で返すエンドポイントを実装する
  - `GET /api/settings/defaults` でデフォルト技術設定を返すエンドポイントを実装する（未設定の場合は 404 を返す）
  - _Requirements: 4_

- [x] 4.2 (P) 画像配信 API ルーター実装
  - `GET /api/images/{image_path}` でライブラリ基準の相対パスから画像ファイルを取得して配信するエンドポイントを実装する
  - 画像形式に応じた Content-Type ヘッダを付与する
  - 対応ファイルが存在しない場合は HTTP 404 を返す
  - _Requirements: 5_

- [ ] 5. コンフィグ生成・検証 API
- [x] 5.1 コンフィグ生成 API Pydantic モデル定義
  - GenerateRequest, GenerateSceneItem, SceneOverrides, GlobalSettingsPayload, TechSettingsPayload の Pydantic モデルを定義する
  - _Requirements: 11_

- [x] 5.2 (P) ConfigGeneratorService 実装
  - GenerateRequest から workflow_config_schema.json 準拠の dict を組み立てるロジックを実装する
  - シーンに overrides がある場合はそれを優先し、ない場合は default_prompts の値をそのシーンに適用する
  - character_name と environment_prompt を結合して comfyui 向け environment_prompt として設定する
  - _Requirements: 11_

- [x] 5.3 (P) ConfigValidatorService 実装
  - 起動時に workflow_config_schema.json を読み込む
  - 生成された dict を jsonschema で検証する `validate()` メソッドを実装する
  - スキーマ違反の場合は違反内容を含む例外を発生させる
  - _Requirements: 11_

- [x] 5.4 Generate ルーター実装
  - `POST /api/generate` で GenerateRequest を受信し ConfigGeneratorService と ConfigValidatorService を経由して YAML を返すエンドポイントを実装する
  - `Content-Disposition: attachment` ヘッダを付与してブラウザダウンロードを促す
  - スキーマ検証失敗時は 422 レスポンスに違反内容を含める
  - _Requirements: 11_

- [ ] 6. フロントエンド状態管理基盤
- [x] 6.1 TypeScript 型定義
  - SceneTemplate, SceneOverrides, SceneQueueItem, Environment, ComfyUIConfig, WorkflowConfigParams, DefaultPrompts, TechDefaults, TechSettingsOverrides, GenerateRequest の型を定義する
  - _Requirements: 6, 7, 8, 9, 10, 11_

- [x] 6.2 (P) AppContext と useReducer 実装
  - AppState インターフェース（scenes, environments, techDefaults, globalSettings, techSettingsOverrides, sceneQueue, drawerState, loadingState, error）とその初期値を定義する
  - 全 AppAction（SET_LIBRARY_DATA, SET_CHARACTER_NAME, SELECT_ENVIRONMENT, UPDATE_TECH_OVERRIDE, ADD_SCENE_TO_QUEUE, REMOVE_SCENE_FROM_QUEUE, UPDATE_SCENE_OVERRIDE, OPEN_DRAWER, CLOSE_DRAWER, SET_LOADING, SET_ERROR）の reducer を実装する
  - AppContext Provider を実装してアプリ全体に状態を提供する
  - _Requirements: 6, 7, 8, 9, 10, 11_

- [x] 6.3 (P) API クライアント実装
  - fetchScenes(), fetchEnvironments(), fetchTechDefaults() の API 取得関数を実装する
  - generateConfig() でコンフィグ生成リクエストを送信し YAML の Blob を返す関数を実装する
  - 失敗時に status・message を含む ApiError を throw するエラーハンドリングを統一する
  - _Requirements: 4, 5, 11_

- [ ] 7. 左ペイン UI（グローバル設定・技術設定）
- [x] 7.1 (P) GlobalSettingsPanel 実装
  - キャラクター名を入力するテキストボックスを実装する
  - 環境を選択するサムネイル付きドロップダウンを実装する（API から取得した環境一覧を表示する）
  - 変更時に AppState へ即時反映する
  - _Requirements: 7_

- [x] 7.2 (P) TechSettingsPanel 実装
  - comfyui_config（server_address・client_id）と workflow_config パラメータ（各パス・ノード ID）の入力フォームを実装する
  - API から取得したデフォルト値をプレースホルダとして表示し、ユーザー入力を優先して AppState に保持する
  - 入力値をクリアするとデフォルト値にフォールバックする動作を実装する
  - フォームを折りたたみ可能なセクションとして左ペイン下部に配置する
  - _Requirements: 6_

- [x] 8. (P) 中央ペイン UI（シーンライブラリパネル）実装
  - シーンライブラリを API から取得してカードリスト（プレビュー画像＋シーン名）で表示する
  - カードのクリックでシーンテンプレートをコピーしてシーンキューに追加する
  - シーン一覧が画面に収まらない場合に垂直スクロールを提供する
  - API 取得失敗時のエラーメッセージを UI 上に表示する
  - _Requirements: 8_

- [ ] 9. 右ペイン UI（シーンキュー）
- [x] 9.1 (P) QueueCard コンポーネント実装
  - キュー内の各シーンのカードにシーン名・バッチサイズなどのステータスバッジを表示する
  - overrides が存在する場合はカード左端にアクセントライン・変更項目バッジを表示する
  - カードの削除ボタン（×）クリックでキューから該当シーンを削除する
  - カードクリックでドロワーを開くアクションを発行する
  - _Requirements: 9, 10_

- [x] 9.2 SceneQueuePanel 実装
  - QueueCard を使用してキュー内シーンカードリストを垂直スクロール可能なリストで表示する
  - 右ペイン最下部に「作成（Generate）」ボタンを固定表示する
  - _Requirements: 9, 11_

- [x] 10. (P) シーン詳細編集ドロワー実装
  - 画面右端からスライドインするドロワーパネルを実装する（開閉は AppState の drawerState で管理する）
  - ドロワー内にシーン名・ポジティブプロンプト・ネガティブプロンプト・バッチサイズの編集フォームを実装する
  - 編集項目未変更時は default_prompts の値をプレースホルダとして薄く表示する
  - 変更は即時に AppState の該当シーンの overrides へ反映する（オートセーブ）
  - ドロワー表示中は左・中央ペインに半透明の黒いオーバーレイを表示する
  - 閉じるボタン・背景クリック・完了ボタンのいずれかでドロワーを閉じる
  - _Requirements: 10_

- [ ] 11. コンフィグ生成・ダウンロード統合
- [x] 11.1 生成前バリデーションと警告表示
  - キューが空の場合に警告メッセージを表示しリクエストを中断する
  - デフォルト値とユーザー入力の両方が未設定の必須技術設定項目がある場合に未入力項目を表示しリクエストを中断する
  - _Requirements: 11_

- [x] 11.2 コンフィグ生成リクエストとダウンロード実装
  - 現在の AppState からグローバル設定・技術設定・シーンキュー情報を組み立てて POST /api/generate に送信する
  - 成功時は Blob を受け取りブラウザのダウンロード機能で YAML ファイルを保存する
  - 失敗時（スキーマ検証エラー等）は違反内容を UI に表示する
  - _Requirements: 11_

- [ ] 12. テスト実装
- [x] 12.1 (P) バックエンドユニットテスト
  - AppConfig のデフォルト値・引数あり・ファイル不在の各ケースをテストする
  - LibraryService の正常 YAML・フォーマット不正・ファイル不在の動作をテストする
  - ConfigGeneratorService の overrides あり・なし・environment_prompt 結合の出力をテストする
  - ConfigValidatorService の正常 dict・必須フィールド欠損・型違反の動作をテストする
  - _Requirements: 1, 2, 3, 11_

- [x] 12.2 (P) フロントエンドユニットテスト
  - appReducer の各 AppAction における状態遷移をテストする
  - apiClient のモックサーバを使用した各エンドポイントの成功・失敗をテストする
  - _Requirements: 4, 6, 7, 8, 9, 10, 11_

- [x] 12.3 バックエンド統合テスト
  - `GET /api/scenes`, `GET /api/environments`, `GET /api/settings/defaults` → LibraryService → YAML ファイルの往復テストを実装する
  - `POST /api/generate` → ConfigGeneratorService → ConfigValidatorService → YAML レスポンスの往復テストを実装する
  - `GET /api/images/{path}` での画像配信テストを実装する
  - _Requirements: 3, 4, 5, 11_
