# 実装計画

## タスク一覧

- [x] 1. Tailwind CSS v4 と Shadcn/ui のプロジェクトセットアップ
- [x] 1.1 Tailwind CSS v4 をインストールし CSS エントリーポイントを設定する
  - `tailwindcss` と `@tailwindcss/vite` を npm でインストールする
  - `@types/node` を devDependency としてインストールする（Vite 設定でのパス解決に必要）
  - `src/index.css` の内容を `@import "tailwindcss"` で始まる形式に更新する
  - 開発サーバーを起動し、Tailwind のベーススタイルがエラーなく読み込まれることを確認する
  - _Requirements: 1.1, 1.3_

- [x] 1.2 Vite 設定ファイルに Tailwind プラグインとパスエイリアスを追加する
  - `vite.config.ts` に `@tailwindcss/vite` プラグインを追加する
  - `vite.config.ts` に `resolve.alias` として `@` → `./src` のパスマッピングを追加する
  - 既存の `server.proxy` と `test` 設定は変更せずに維持する
  - `postcss.config.js` は作成しない（`@tailwindcss/vite` と競合するため）
  - _Requirements: 1.1, 1.3_

- [x] 1.3 TypeScript 設定にパスエイリアスを追加する
  - `tsconfig.json` の `compilerOptions` に `"baseUrl": "."` を追加する
  - `tsconfig.json` の `compilerOptions` に `"paths": { "@/*": ["./src/*"] }` を追加する
  - 既存の `strict`, `noUnusedLocals` 等のコンパイラオプションは変更しない
  - _Requirements: 1.1, 1.5_

- [x] 1.4 Shadcn/ui CLI を初期化し必要なコンポーネントを一括生成する
  - `npx shadcn@latest init` を実行し `components.json` と `src/lib/utils.ts` を生成する（style: "new-york", tsx: true を選択）
  - `npx shadcn@latest add input button select collapsible sheet badge alert textarea` を実行して `src/components/ui/` 配下にコンポーネントを生成する
  - 生成された `src/lib/utils.ts` の `cn()` 関数が TypeScript エラーなくビルドできることを確認する
  - _Requirements: 1.2, 1.4, 1.5_

- [x] 2. (P) アプリ全体のレイアウトとベーススタイルを Tailwind で統一する
  - `App.tsx` の3カラムフレックスレイアウトのインラインスタイルを Tailwind ユーティリティクラスに移行する
  - 左右ペインの固定幅（300px）と中央ペインのフレキシブル幅を Tailwind クラスで表現する
  - 各パネルコンテナに Tailwind でスペーシングとボーダースタイルを適用する
  - アプリ全体の背景色・テキスト色を Tailwind のカラーパレット（CSS 変数ベース）に統一する
  - デスクトップ幅で3カラムが横スクロールなしに並んで表示されることを確認する
  - タスク 1 の完了後に実施する（`@tailwindcss/vite` と `@` エイリアスが必要）
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. (P) グローバル設定パネルのスタイルを Shadcn/ui コンポーネントで適用する
  - セクション見出し（"グローバル設定"）を Tailwind タイポグラフィクラスで追加する
  - キャラクター名の `<input>` を `Input` コンポーネントに置き換え、ラベルとの `htmlFor`/`id` 紐付けを維持する
  - カスタムドロップダウン実装（`useState(isDropdownOpen)` + `<button>` + `<ul role="listbox">`）を削除する
  - 環境選択を `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` で実装し、環境名を `env.name` で値として使用する
  - `SelectItem` 内に環境のサムネイル画像と表示名を並べて配置する
  - 選択済み環境のサムネイルと名前を `SelectTrigger` 内に表示する
  - タスク 1 の完了後に実施する（他のパネルタスク 4〜8 と並行実施可能）
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.3, 9.4_

- [x] 4. (P) 技術設定パネルのスタイルを Shadcn/ui コンポーネントで適用する
  - 展開/折りたたみトグルを `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent` で置き換える
  - トグルボタンの "▼/▶" 文字を `lucide-react` の `ChevronDown`/`ChevronRight` アイコンに変更する
  - 折りたたみ時はセクションヘッダーのみ表示し、展開時に全フォームフィールドを表示する
  - ComfyUI 設定とワークフロー設定の全 `<input>` を `Input` コンポーネントに置き換える
  - ComfyUI 設定グループとワークフロー設定グループを Tailwind ボーダースタイルで視覚的に区切る
  - 全入力フィールドの `htmlFor`/`id` のラベルと入力の紐付けを維持する
  - タスク 1 の完了後に実施する（他のパネルタスク 3, 5〜8 と並行実施可能）
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.3, 9.4_

- [x] 5. (P) シーンライブラリパネルをカード形式でスタイル適用する
  - 各シーンアイテムの `<button>` を Tailwind のカードスタイル（ボーダー・角丸・シャドウ）で囲む
  - シーンカードにホバーエフェクト（背景色変化またはボーダーハイライト）を適用する
  - ローディング中の表示テキストに Tailwind スタイルを適用する
  - シーンが存在しない場合の空状態メッセージに Tailwind スタイルを適用する
  - データ取得エラー時の表示を `Alert`/`AlertDescription` に置き換え、`role="alert"` を維持する
  - `role="list"` と各アイテムの `aria-label` 属性を変更せず維持する
  - タスク 1 の完了後に実施する（他のパネルタスク 3, 4, 6〜8 と並行実施可能）
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 9.1, 9.3_

- [x] 6. (P) シーンキューパネルのスタイルとローディング状態を実装する
  - 生成ボタンを `Button`（デフォルト variant）コンポーネントに置き換える
  - 生成処理中は `Button` を `disabled` 状態にし、`Loader2` アイコンをスピナーとして表示する
  - 空キューエラーの `<div role="alert">` を `Alert`/`AlertDescription` に置き換える
  - 未設定必須フィールドエラーの `<div role="alert">` を `Alert`/`AlertDescription` に置き換え、フィールド一覧の `<ul>` を内包する
  - API 生成エラーの `<div role="alert">` を `Alert variant="destructive"`/`AlertDescription` に置き換える
  - キューが空の場合の空状態メッセージに Tailwind スタイルを適用する
  - タスク 1 の完了後に実施する（他のパネルタスク 3〜5, 7〜8 と並行実施可能）
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 9.1, 9.3_

- [x] 7. (P) キューカードをカード形式でスタイル適用する
  - カードのルート要素に Tailwind カードスタイル（ボーダー・角丸・背景色・パディング）を適用する
  - オーバーライドありカードの左ボーダーインジケータを Tailwind の条件クラスで表現し、インラインスタイルを削除する
  - オーバーライドバッジ（"Prompt Modified" 等）を `Badge`（secondary variant）コンポーネントに置き換える
  - 削除ボタンを `Button variant="ghost" size="icon"` + `lucide-react` の `X` アイコンに置き換える
  - キーボード操作ハンドラ（`onKeyDown`、`tabIndex`）と `aria-label` をすべて維持する
  - フォーカス時のリングが Tailwind のデザインシステムと一致することを確認する
  - タスク 1 の完了後に実施する（他のパネルタスク 3〜6, 8 と並行実施可能）
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 9.1, 9.3, 9.4_

- [x] 8. (P) シーン編集ドロワーを Sheet コンポーネントで置き換える
  - カスタムの固定ポジションオーバーレイ実装（`data-testid="drawer-overlay"` の `<div>` と `role="dialog"` の `<div>`）を削除する
  - `Sheet`/`SheetContent`（`side="right"`）/`SheetHeader`/`SheetTitle`/`SheetFooter`/`SheetClose` で置き換える
  - `Sheet` の `open` prop に `isOpen` を渡し、`onOpenChange` で `CLOSE_DRAWER` をディスパッチする
  - ヘッダー閉じるボタンを `Button variant="ghost" size="icon"` + アイコンで実装する
  - シーン名の `<input>` を `Input`、各テキストエリアを `Textarea`、バッチサイズの `<input>` を数値用 `Input` に置き換える
  - 完了ボタンを `Button`（デフォルト variant）に置き換え、フッターに固定配置する
  - Sheet の内部に `role="dialog"` が Radix によって自動付与されるため、既存の冗長な属性指定を削除する
  - オーバーレイのクリックで `CLOSE_DRAWER` がディスパッチされる動作を維持する
  - タスク 1 の完了後に実施する（他のパネルタスク 3〜7 と並行実施可能）
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 9.3, 9.4_

- [x] 9. テストスイートを修正し全件パスを確認する
- [x] 9.1 (P) GlobalSettingsPanel テストを Select コンポーネントの DOM 構造に対応させる
  - `GlobalSettingsPanel.test.tsx` でカスタムドロップダウン前提のクエリ（`role="listbox"`/`role="option"` 等）を確認する
  - Radix Select は Portal でドロップダウンをレンダリングするため、必要に応じて `userEvent.click` でトリガーを開いてから項目を取得するようにクエリを修正する
  - 環境選択の `onValueChange` ディスパッチが正しく呼ばれることを確認するアサーションを維持する
  - タスク 3 の完了後に実施する（タスク 9.2 と並行実施可能）
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 9.2 (P) SceneEditDrawer テストを Sheet コンポーネントに対応させる
  - `SceneEditDrawer.test.tsx` で `data-testid="drawer-overlay"` を参照しているクエリを確認する
  - Sheet の `role="dialog"` クエリまたは Escape キーによるクローズテストに移行する
  - ドロワーの開閉動作・フォーム編集・`CLOSE_DRAWER` ディスパッチのアサーションを維持する
  - タスク 8 の完了後に実施する（タスク 9.1 と並行実施可能）
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 9.3 全テストスイートを実行し全件パスを確認する
  - `npm test` を実行し、全テストがパスすることを確認する
  - 失敗したテストがあれば原因を特定し修正する（クエリの DOM 構造変化、ARIA 属性の変化が主な原因）
  - タスク 9.1 と 9.2 の完了後に実施する
  - _Requirements: 9.1, 9.2, 9.3, 9.4_
