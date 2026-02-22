# Implementation Plan

<!-- Requirements Coverage Note:
  要件 1.3「AppProvider 外での useAppContext エラー」は AppContext.tsx で既実装済みのため、
  独立したタスクは不要。要件 2 の実装（Task 3）により間接的にカバーされる。
-->

- [x] 1. (P) index.html に CSS リセットを追加してビューポート全体を占有できるようにする
  - `<head>` タグ内に `<style>` ブロックを追加し、`body { margin: 0; padding: 0; }` および `#root { height: 100vh; }` を設定する
  - ブラウザデフォルトの body マージン（8px）を除去し、3ペインレイアウトがスクロールバーなしで全画面を占有できるようにする
  - 他のタスクとファイルが競合しないため、並列実行が可能
  - _Requirements: 3.1_

- [x] 2. App.tsx を AppProvider と AppContent の2コンポーネント構成に再構築する
  - 既存のプレースホルダー実装を削除し、`AppProvider` でアプリ全体をラップする `App` コンポーネントを実装する
  - `App` の子として非エクスポートの `AppContent` 内部コンポーネントを定義する（この時点では空の実装でよい）
  - `App` のデフォルトエクスポートを維持し、`main.tsx` 側の変更が不要なようにする
  - _Requirements: 1.1, 1.2_

- [x] 3. AppContent に初期データ取得ロジックを実装する
  - `useAppContext` から `dispatch` を取得し、マウント時に `useEffect([dispatch])` 内でデータ取得処理を実行する（依存配列を `[dispatch]` にすることで `react-hooks/exhaustive-deps` の lint 警告を防ぐ）
  - `SET_LOADING { library: true }` を先に dispatch してから、シーン・環境・技術デフォルトを `Promise.all` で並列取得する
  - 全取得成功時は `SET_LIBRARY_DATA { scenes, environments, techDefaults }` を一括 dispatch してアトミックに状態を更新する
  - 取得失敗時は `SET_ERROR` でエラーメッセージを dispatch する
  - `finally` ブロックで `SET_LOADING { library: false }` を dispatch し、成功・失敗どちらでもローディング状態を確実に解消する
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 4. AppContent に3ペインの水平レイアウトを実装する
  - `flexbox` で左・中央・右の3カラムを構成し、コンテナの高さをビューポート全体（`height: 100%`）に設定する
  - 左ペインにシーン一覧を表示する `SceneLibraryPanel` をマウントする
  - 中央ペインにグローバル設定の `GlobalSettingsPanel` と技術設定の `TechSettingsPanel` を縦に並べてマウントする
  - 右ペインにシーンキューと生成ボタンを持つ `SceneQueuePanel` をマウントする
  - 各ペインが独立してスクロールできるよう `overflowY: 'auto'` を設定する
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. AppContent に SceneEditDrawer オーバーレイを統合する
  - `techDefaults` が null の場合に備えてフォールバック用の空プロンプト定数（`EMPTY_DEFAULT_PROMPTS`）を `AppContent` 内に定義する
  - 状態から `drawerState.isOpen`・`sceneId` でキュー内の対象シーン・デフォルトプロンプトを組み立てて `SceneEditDrawer` に渡す
  - `SceneEditDrawer` を3ペインレイアウトの外側（兄弟要素）に配置してオーバーレイとして機能させる
  - `drawerState.isOpen` が false の場合は `SceneEditDrawer` が何もレンダリングしないことを確認する（既実装の動作）
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. App.test.tsx を新規作成してコア動作を検証する

- [x] 6.1 初期データ取得の動作をテストする
  - `vi.mock` で `fetchScenes`・`fetchEnvironments`・`fetchTechDefaults` をスタブ化する
  - マウント時に3つの API が各1回呼ばれることを検証する
  - 取得成功後にローディング状態が解消され、データが state に反映されることを検証する
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6.2 エラー処理の動作をテストする
  - `fetchScenes` が例外をスローするモックを設定し、エラー後にローディング状態が解消されることを検証する
  - エラー発生時に `SceneLibraryPanel` 内のアラートが表示されることを検証する
  - _Requirements: 2.6_

- [x]* 6.3 3ペインレイアウトとドロワー統合の描画をテストする（オプション）
  - `SceneLibraryPanel`・`GlobalSettingsPanel`・`TechSettingsPanel`・`SceneQueuePanel` が同時に表示されることを検証する
  - `drawerState.isOpen` が true のとき `SceneEditDrawer` が表示されることを検証する
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3_
