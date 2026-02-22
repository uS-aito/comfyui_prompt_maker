# Research & Design Decisions

---
**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.

---

## Summary

- **Feature**: `frontend-render-fix`
- **Discovery Scope**: Extension（既存コードへの配線）
- **Key Findings**:
  - `App.tsx` はプレースホルダーのまま。全コンポーネントが実装済みで未接続の状態
  - Reducer には `SET_LIBRARY_DATA`（一括）のみが存在し、要件書の個別アクション名と不一致
  - `SceneEditDrawer` は `useAppContext` を使わず直接 props を受け取るため、親コンポーネントが値を組み立てる必要がある

---

## Research Log

### App.tsx の現状とコンポーネント接続状況

- **Context**: なぜフロントエンドが何も表示されないかの調査
- **Sources Consulted**: `frontend/src/App.tsx`, `frontend/src/main.tsx`, 各コンポーネントファイル
- **Findings**:
  - `App.tsx` は `<h1>ComfyUI Prompt Maker</h1>` のみをレンダリング
  - `AppProvider`・各パネルコンポーネント・API呼び出し・`SceneEditDrawer` がすべて未接続
  - `main.tsx` のエントリーポイントは正常（`createRoot` + `<App />`）
- **Implications**: `App.tsx` の1ファイルを更新するだけで修正可能

### Reducer のアクション設計

- **Context**: 要件定義書と実装の不一致（`LOAD_SCENES` vs `SET_LIBRARY_DATA`）
- **Sources Consulted**: `frontend/src/state/reducer.ts`
- **Findings**:
  - Reducer は `SET_LIBRARY_DATA: { scenes, environments, techDefaults }` という1つの統合アクションを定義
  - 個別アクション（`LOAD_SCENES` など）は存在しない
  - `SET_LOADING` と `SET_ERROR` は独立して存在
- **Implications**: 要件書が意図した個別アクションより `SET_LIBRARY_DATA` による一括更新の方がアトミックで既存実装と整合する

### SceneEditDrawer の Props 設計

- **Context**: `SceneEditDrawer` が `useAppContext` を使わないことの確認
- **Sources Consulted**: `frontend/src/components/SceneEditDrawer/SceneEditDrawer.tsx`
- **Findings**:
  ```typescript
  interface SceneEditDrawerProps {
    isOpen: boolean
    scene: SceneQueueItem | null
    defaults: DefaultPrompts
    dispatch: Dispatch<AppAction>
  }
  ```
  - `isOpen`: `state.drawerState.isOpen`
  - `scene`: `state.sceneQueue.find(item => item.id === state.drawerState.sceneId) ?? null`
  - `defaults`: `state.techDefaults?.workflowConfig.defaultPrompts`（null の場合の考慮が必要）
  - `dispatch`: `AppContext` から取得
- **Implications**: `AppContent` 内で state から値を組み立てて渡す設計が必要

---

## Architecture Pattern Evaluation

| Option | 説明 | 強み | リスク | メモ |
|--------|------|------|--------|------|
| A: App.tsx のみ修正 | `AppContent` 内部コンポーネントで配線 | 変更1ファイル、最小変更 | 将来的な肥大化の可能性 | **採用** |
| B: AppLoader 新規作成 | データ取得ロジックを分離 | 関心の分離 | 現状の規模に対してオーバーエンジニアリング | 不採用 |
| C: Reducer 拡張 | 個別アクション追加 | 要件書との整合 | 既存テストへの影響 | 不採用 |

---

## Design Decisions

### Decision: `SET_LIBRARY_DATA` を使用する（個別アクションを新設しない）

- **Context**: 要件書では `LOAD_SCENES`、`LOAD_ENVIRONMENTS`、`LOAD_TECH_DEFAULTS` と記述しているが、実装では `SET_LIBRARY_DATA` のみが存在する
- **Alternatives Considered**:
  1. 要件書通りに `LOAD_SCENES` 等の個別アクションをreducerに追加する
  2. 既存の `SET_LIBRARY_DATA` を活用する
- **Selected Approach**: 既存の `SET_LIBRARY_DATA` を使用し、`Promise.all` で3つのAPIを並列取得後に一括dispatch
- **Rationale**: Reducer の変更を行わないことで既存テスト（`reducer.test.ts`）への影響をゼロにできる。また、3つのデータを同時に設定することでアトミックな状態遷移が保証される
- **Trade-offs**: 要件書との表現上の不一致が残るが、動作上の問題はない
- **Follow-up**: 設計完了後に要件書の受け入れ基準を `SET_LIBRARY_DATA` に合わせて更新するか確認する

### Decision: `AppContent` 内部コンポーネントパターン

- **Context**: `useAppContext()` は `AppProvider` の内側でのみ呼べるため、データ取得ロジックを `App` 直下に書けない
- **Alternatives Considered**:
  1. `App.tsx` 内に `AppContent` コンポーネントを定義する（単一ファイル）
  2. `AppContent.tsx` を新規ファイルとして作成する
- **Selected Approach**: `App.tsx` 内に `AppContent` を定義する（単一ファイル、非エクスポート）
- **Rationale**: 変更ファイルを1つに抑える。`AppContent` はテスト対象にする必要がなく、`App.tsx` のテストで間接的にカバーできる
- **Trade-offs**: `App.tsx` のファイルサイズが増えるが、今の規模では問題ない

### Decision: `techDefaults` が null の場合の `SceneEditDrawer` デフォルト値

- **Context**: `techDefaults` は初期状態で `null`（APIロード完了前）。`SceneEditDrawer` の `defaults` に渡す値が必要
- **Selected Approach**: フォールバック用の空の `DefaultPrompts` オブジェクトを `AppContent` 内で定義し、`techDefaults` が null の場合はそれを使用する
- **Rationale**: `SceneEditDrawer` は `drawerState.isOpen` が true の時のみ表示されるが、TypeScript の型安全性のためフォールバックが必要

---

## Risks & Mitigations

- `techDefaults` が null の状態でドロワーが開かれると `defaults` の値が空になる — フォールバック定数で対処
- 初期データ取得中にユーザーがシーンをクリックできる — `loadingState.library` が true の時 `SceneLibraryPanel` は「読み込み中」を表示するため問題なし（既実装）
- `Promise.all` で一部のAPIが失敗した場合、すべてのデータが未設定になる — `SET_ERROR` で全体エラーとして表示する（シンプルさを優先）

## References

- `frontend/src/state/reducer.ts` — `SET_LIBRARY_DATA`, `SET_LOADING`, `SET_ERROR` の定義
- `frontend/src/state/AppContext.tsx` — `AppProvider`, `useAppContext` の定義
- `frontend/src/components/SceneEditDrawer/SceneEditDrawer.tsx` — props設計の確認
