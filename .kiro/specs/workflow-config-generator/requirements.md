# 要件定義書

## はじめに

本ドキュメントは、ComfyUI向けワークフローコンフィグファイル作成ツール（comfyui_prompt_maker）の要件を定義する。
本ツールはWebアプリケーションとして動作し、ユーザーがキャラクター・環境・シーンを視覚的に設定することで、`t2i_client_java` ツールが読み込み可能な `workflow_config_schema.json` 準拠のコンフィグファイル（YAML）を生成する。

---

## 要件一覧

### 要件 1: Webアプリケーション起動

**目的:** ツール管理者として、ブラウザからアクセス可能なWebアプリとして本ツールを起動したい。そうすることで、専用クライアントなしに任意の環境で利用できる。

#### 受入基準

1. The Workflow Config Generator shall HTTPサーバを起動し、ブラウザからアクセス可能なURLをコンソールへ表示する。
2. When ツールが起動されたとき、the Workflow Config Generator shall メインUI画面（3ペイン構成）を構成するHTMLを配信する。
3. If HTTPサーバの起動に失敗した場合、the Workflow Config Generator shall エラーメッセージをコンソールへ出力してプロセスを終了する。

---

### 要件 2: サーバ起動設定

**目的:** ツール管理者として、ポート番号やライブラリファイルのパスをサーバ起動時に指定したい。そうすることで、環境に合わせた柔軟な設定が可能になる。

#### 受入基準

1. The Workflow Config Generator shall コマンドライン引数またはコンフィグファイルによって、HTTPサーバのポート番号を指定可能にする。
2. The Workflow Config Generator shall コマンドライン引数またはコンフィグファイルによって、シーン・環境ライブラリファイルのパスを指定可能にする。
3. When 起動設定が省略されたとき、the Workflow Config Generator shall デフォルト値（例：ポート8080、デフォルトライブラリパス）で動作する。
4. If 指定されたライブラリファイルが存在しない場合、the Workflow Config Generator shall 起動時にエラーをコンソールへ出力してプロセスを終了する。

---

### 要件 3: シーン・環境ライブラリデータの読み込み

**目的:** ツール管理者として、事前定義されたシーンテンプレートと環境設定を外部ファイルで管理したい。そうすることで、ツールを再ビルドせずにライブラリを更新できる。

#### 受入基準

1. When サーバが起動されたとき、the Workflow Config Generator shall 指定されたライブラリファイルを読み込み、シーンテンプレート一覧および環境一覧をメモリに保持する。
2. The Workflow Config Generator shall ライブラリファイルから各シーンテンプレートの名前・ポジティブプロンプト・ネガティブプロンプト・バッチサイズ（デフォルト値）を読み込む。
3. The Workflow Config Generator shall ライブラリファイルから各環境の名前・環境プロンプトを読み込む。
4. If ライブラリファイルのフォーマットが不正な場合、the Workflow Config Generator shall 起動時にエラー内容をコンソールへ出力してプロセスを終了する。
5. Where プレビュー画像のパスがライブラリファイルに定義されている場合、the Workflow Config Generator shall 対応する画像ファイルへのマッピングを保持する。

---

### 要件 4: シーン・環境ライブラリAPIの提供

**目的:** フロントエンドクライアントとして、利用可能なシーンテンプレートと環境の一覧をサーバから取得したい。そうすることで、UIに正確なライブラリデータを表示できる。

#### 受入基準

1. The Workflow Config Generator shall シーンテンプレート一覧を返すHTTPエンドポイント（例：`GET /api/scenes`）を提供する。
2. The Workflow Config Generator shall 環境一覧を返すHTTPエンドポイント（例：`GET /api/environments`）を提供する。
3. When クライアントがシーン一覧を要求したとき、the Workflow Config Generator shall 各シーンの名前・プロンプト情報・プレビュー画像URLをJSON形式で返す。
4. When クライアントが環境一覧を要求したとき、the Workflow Config Generator shall 各環境の名前・環境プロンプト・サムネイル画像URLをJSON形式で返す。
5. If ライブラリデータの読み込みに失敗した状態でAPIが呼ばれた場合、the Workflow Config Generator shall HTTPエラーレスポンスを返す。

---

### 要件 5: プレビュー画像の配信

**目的:** フロントエンドクライアントとして、シーン・環境のサムネイル画像をサーバから取得したい。そうすることで、ユーザーが視覚的にシーン・環境を選択できる。

#### 受入基準

1. The Workflow Config Generator shall シーン・環境のプレビュー画像を配信するHTTPエンドポイントを提供する。
2. When クライアントが画像URLにアクセスしたとき、the Workflow Config Generator shall 対応する画像ファイルをContent-Typeヘッダ付きで返す。
3. If 要求された画像ファイルが存在しない場合、the Workflow Config Generator shall HTTP 404レスポンスを返す。

---

### 要件 6: ワークフロー技術設定の管理

**目的:** ユーザーとして、ComfyUIサーバのアドレスやノードIDなどの技術的設定をUI上で指定したい。そうすることで、出力コンフィグが実行環境に合致した内容になる。

#### 受入基準

1. The Workflow Config Generator shall `comfyui_config`（`server_address`・`client_id`）の設定値を入力するUIフォームを提供する。
2. The Workflow Config Generator shall `workflow_config` 内の技術的パラメータ（`workflow_json_path`・`image_output_path`・`library_file_path`・各ノードID）の設定値を入力するUIフォームを提供する。
3. When UIが読み込まれたとき、the Workflow Config Generator shall サーバ起動設定で指定されたデフォルト値を技術的設定フォームのプレースホルダとして表示する。
4. When ユーザーが技術的設定フォームに値を入力したとき、the Workflow Config Generator shall 入力値をデフォルト値より優先してメモリ上に保持する。
5. When ユーザーが技術的設定フォームの入力値をクリアしたとき、the Workflow Config Generator shall プレースホルダのデフォルト値にフォールバックする。
6. If 必須の技術的設定値（デフォルト値・ユーザー入力値の両方）が未設定の状態でコンフィグ生成が要求された場合、the Workflow Config Generator shall 未入力項目をユーザーに明示し、ファイル生成を行わない。

---

### 要件 7: グローバル設定の管理（左ペイン）

**目的:** ユーザーとして、全シーン共通のキャラクター名・環境名を設定したい。そうすることで、各シーンへ一貫した基本プロンプトを適用できる。

#### 受入基準

1. The Workflow Config Generator shall 左ペインにキャラクター名を入力するテキストボックスを表示する。
2. The Workflow Config Generator shall 左ペインに環境名を選択するリスト（サムネイル付きプルダウン）を表示する。
3. When ブラウザでUIが読み込まれたとき、the Workflow Config Generator shall サーバの環境ライブラリAPIからデータを取得してプルダウンに反映する。
4. When ユーザーが環境名入力欄をクリックしたとき、the Workflow Config Generator shall 取得済みの環境選択肢を画像付きで一覧表示する。
5. When ユーザーがキャラクター名または環境名を変更したとき、the Workflow Config Generator shall その値を `default_prompts.environment_prompt` として全シーンに即時反映する。
6. While シーン選択・編集中でも、the Workflow Config Generator shall 左ペインのグローバル設定を変更可能な状態に保つ。

---

### 要件 8: シーンライブラリの閲覧と選択（中央ペイン）

**目的:** ユーザーとして、事前定義されたシーンテンプレートを視覚的に閲覧・選択したい。そうすることで、生成したい一連の画像のシーン構成を効率的に組み立てられる。

#### 受入基準

1. When ブラウザでUIが読み込まれたとき、the Workflow Config Generator shall サーバのシーンライブラリAPIからデータを取得して中央ペインに表示する。
2. The Workflow Config Generator shall 中央ペインにシーンテンプレートをカードリスト形式（プレビュー画像＋シーン名）で表示する。
3. The Workflow Config Generator shall シーンカードが画面に収まらない場合に垂直スクロールを提供する。
4. When ユーザーがシーンカードをクリックしたとき、the Workflow Config Generator shall 対象シーンテンプレートのデータをコピーして右ペインのシーンキューへ追加する。
5. When シーンがキューへ追加されたとき、the Workflow Config Generator shall キュー内のシーンカードにシーン名と初期ステータスバッジを表示する。
6. If シーンライブラリAPIの取得に失敗した場合、the Workflow Config Generator shall エラーメッセージをUI上に表示する。

---

### 要件 9: シーンキューの管理（右ペイン）

**目的:** ユーザーとして、生成対象として確定したシーンのキューを管理したい。そうすることで、生成する画像の順序・構成を自由に整理できる。

#### 受入基準

1. The Workflow Config Generator shall 右ペインに選択済みシーンをカードリスト形式で一覧表示する。
2. The Workflow Config Generator shall 各シーンカードにシーン名・バッチサイズなどのステータスバッジを表示する。
3. When ユーザーがシーンカードの削除ボタン（×）をクリックしたとき、the Workflow Config Generator shall 該当シーンをキューから削除する。
4. The Workflow Config Generator shall 右ペイン最下部に「作成（Generate）」ボタンを固定表示する。

---

### 要件 10: シーン詳細編集（サイドパネル・ドロワー）

**目的:** ユーザーとして、キュー内の各シーンのプロンプトやバッチサイズを個別に調整したい。そうすることで、シーンごとに異なる画像生成設定を細かく制御できる。

#### 受入基準

1. When ユーザーが右ペインのシーンカードをクリックしたとき、the Workflow Config Generator shall 画面右端からスライドインする詳細編集ドロワーを表示する。
2. The Workflow Config Generator shall ドロワー上部に「シーン名：[選択シーン名] の編集」というタイトルを表示する。
3. The Workflow Config Generator shall ドロワー内に以下の編集項目を表示する：シーン名（`name`）、ポジティブプロンプト（`positive_prompt`）、ネガティブプロンプト（`negative_prompt`）、バッチサイズ（`batch_size`）。
4. While ドロワーが表示されているとき、the Workflow Config Generator shall 左ペインおよび中央ペインの上に半透明の黒いオーバーレイを表示し、詳細編集にフォーカスさせる。
5. When ユーザーが編集項目を変更したとき、the Workflow Config Generator shall その変更をメモリ上の設定へ即時反映（オートセーブ）する。
6. When ユーザーが個別項目を編集していないとき、the Workflow Config Generator shall `default_prompts` の値をプレースホルダとして薄く表示する。
7. When ドロワーで編集が行われたとき、the Workflow Config Generator shall キュー内の該当シーンカード左端にアクセントラインを表示し、変更済みであることを視覚的に示す。
8. When ドロワーで編集が行われたとき、the Workflow Config Generator shall カード下部に変更された項目のバッジ（例：「Prompt Modified」「Batch: 5」）を表示する。
9. When ユーザーが閉じるボタン（×）・背景クリック・完了ボタンのいずれかを操作したとき、the Workflow Config Generator shall ドロワーを閉じてメイン画面に戻る。

---

### 要件 11: コンフィグファイルの生成・出力

**目的:** ユーザーとして、設定内容を `workflow_config_schema.json` 準拠のファイルとしてエクスポートしたい。そうすることで、`t2i_client_java` ツールが直接読み込める形式でコンフィグを受け取れる。

#### 受入基準

1. When ユーザーが「作成（Generate）」ボタンをクリックしたとき、the Workflow Config Generator shall 現在のグローバル設定・技術的設定・キュー内の全シーン情報をサーバへ送信しコンフィグファイルの生成を要求する。
2. The Workflow Config Generator shall コンフィグ生成処理をサーバサイドで実行し、結果をYAML形式でクライアントへ返す。
3. The Workflow Config Generator shall 出力ファイルに `comfyui_config`・`workflow_config`・`scenes` の3セクションを含める。
4. When シーンに個別の設定値が存在するとき、the Workflow Config Generator shall シーン固有の設定をデフォルト値より優先して出力する。
5. When シーンに個別の設定値が存在しないとき、the Workflow Config Generator shall `default_prompts` の値をそのシーンへ適用する。
6. If キューにシーンが1件も存在しない状態で「作成」ボタンが押されたとき、the Workflow Config Generator shall ユーザーに警告を表示しファイル生成を行わない。
7. The Workflow Config Generator shall 生成されたコンフィグが `workflow_config_schema.json` に準拠していることをサーバサイドで検証する。
8. When コンフィグ生成が成功したとき、the Workflow Config Generator shall 生成されたファイルをブラウザのダウンロード機能を通じてユーザーのローカル環境へ保存できるようにする。
