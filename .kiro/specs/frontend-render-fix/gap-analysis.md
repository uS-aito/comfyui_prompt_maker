# ギャップ分析レポート: frontend-render-fix

## 1. 現状調査

### ディレクトリ構成

```
frontend/src/
├── main.tsx                        # エントリポイント（正常）
├── App.tsx                         # ★ プレースホルダー実装（問題箇所）
├── api/
│   └── client.ts                   # fetchScenes / fetchEnvironments / fetchTechDefaults / generateConfig
├── state/
│   ├── AppContext.tsx               # AppProvider, useAppContext
│   ├── reducer.ts                   # appReducer, AppState, AppAction
│   └── initialState.ts             # 初期状態定義
├── components/
│   ├── GlobalSettingsPanel/        # GlobalSettingsPanel ✅ 実装済み
│   ├── TechSettingsPanel/          # TechSettingsPanel ✅ 実装済み
│   ├── SceneLibraryPanel/          # SceneLibraryPanel ✅ 実装済み
│   ├── SceneQueuePanel/            # SceneQueuePanel ✅ 実装済み
│   └── SceneEditDrawer/            # SceneEditDrawer ✅ 実装済み
├── types/                          # scene.ts / environment.ts / settings.ts / api.ts
└── utils/                          # validation.ts / buildGenerateRequest.ts / download.ts
```

### アーキテクチャパターン

| 分類 | パターン |
|------|----------|
| 状態管理 | React Context + `useReducer`（`AppProvider` → `useAppContext`） |
| スタイリング | インラインスタイルのみ（CSSフレームワーク不使用） |
| テスト | Vitest + @testing-library/react（各コンポーネント配下 `__tests__/`） |
| API通信 | `fetch` 直接呼び出し（Vite dev proxy `/api` → `localhost:8080`） |
| 型定義 | TypeScript 厳格モード |

---

## 2. 要件フィージビリティ分析

### 要件とコードベース資産のマッピング

| 要件 | 必要なアセット | 現状 |
|------|---------------|------|
| 要件 1: AppProvider 統合 | `AppProvider`（`AppContext.tsx`） | ✅ 実装済み・未使用 |
| 要件 2: 初期データロード | `fetchScenes()`, `fetchEnvironments()`, `fetchTechDefaults()` | ✅ 実装済み・未呼び出し |
| 要件 2: 初期データロード | `SET_LIBRARY_DATA` アクション（reducer） | ✅ 実装済み |
| 要件 2: 初期データロード | `SET_LOADING` アクション（reducer） | ✅ 実装済み |
| 要件 2: 初期データロード | `SET_ERROR` アクション（reducer） | ✅ 実装済み |
| 要件 3: 3ペインレイアウト | `SceneLibraryPanel` | ✅ 実装済み・未マウント |
| 要件 3: 3ペインレイアウト | `GlobalSettingsPanel` | ✅ 実装済み・未マウント |
| 要件 3: 3ペインレイアウト | `TechSettingsPanel` | ✅ 実装済み・未マウント |
| 要件 3: 3ペインレイアウト | `SceneQueuePanel` | ✅ 実装済み・未マウント |
| 要件 4: SceneEditDrawer 統合 | `SceneEditDrawer` | ✅ 実装済み・未マウント |

### 重要なギャップ: 要件とReducerのアクション名の不一致

要件定義書では `LOAD_SCENES`、`LOAD_ENVIRONMENTS`、`LOAD_TECH_DEFAULTS` を別々のアクションとして記述しているが、**実際のreducerには `SET_LIBRARY_DATA` という統合アクションのみ存在する**。

```typescript
// reducer.ts の実際のアクション
| { type: 'SET_LIBRARY_DATA'; payload: { scenes, environments, techDefaults } }
```

設計フェーズでは `SET_LIBRARY_DATA` を使うか、個別アクションに分割するかを決定する必要がある。

### SceneEditDrawer のProps構造

`SceneEditDrawer` は以下のpropsを直接受け取る（`useAppContext` を使用しない）：

```typescript
interface SceneEditDrawerProps {
  isOpen: boolean
  scene: SceneQueueItem | null
  defaults: DefaultPrompts
  dispatch: Dispatch<AppAction>
}
```

`App.tsx` が `drawerState` から `isOpen`、`sceneId` でキュー内の `scene` を検索し、`techDefaults.workflowConfig.defaultPrompts` を `defaults` として渡す必要がある。

---

## 3. 実装アプローチの選択肢

### Option A: App.tsx のみを修正する（推奨）

**変更対象ファイル**: `frontend/src/App.tsx` の1ファイルのみ

**実装内容**:
1. `AppProvider` でラップ
2. `useEffect` で初期データ取得（`fetchScenes` + `fetchEnvironments` + `fetchTechDefaults` を `Promise.all` で並列呼び出し）
3. 取得後 `SET_LIBRARY_DATA` でまとめてdispatch
4. `flexbox` による3カラムレイアウト
5. `SceneEditDrawer` にstateから必要な値を渡す

**トレードオフ**:
- ✅ 変更最小（1ファイル）、全既存コンポーネントを再利用
- ✅ 既存パターン（インラインスタイル、Context）に準拠
- ✅ 既存テストへの影響なし
- ❌ `App.tsx` がデータ取得・レイアウト・エラー処理を担うため、将来的に肥大化する可能性

### Option B: 専用の AppLoader コンポーネントを新規作成

**変更対象ファイル**: `App.tsx` + 新規 `AppLoader.tsx`

**実装内容**:
- `AppLoader.tsx`：初期データ取得ロジックを担当
- `App.tsx`：`AppProvider` + `AppLoader` のマウントのみ

**トレードオフ**:
- ✅ 関心の分離（データ取得 vs レイアウト）
- ❌ 現状の変更規模に対してオーバーエンジニアリング
- ❌ 新ファイル追加による構造の複雑化

### Option C: 個別アクションへのReducer拡張 + App.tsx 修正

**変更対象ファイル**: `App.tsx` + `reducer.ts`

**実装内容**:
- `reducer.ts` に `LOAD_SCENES`、`LOAD_ENVIRONMENTS`、`LOAD_TECH_DEFAULTS` を個別追加
- 要件定義と実装を一致させる

**トレードオフ**:
- ✅ 要件定義書との整合性
- ❌ 既存テストへの影響リスク（reducer.test.ts）
- ❌ `SET_LIBRARY_DATA` の利点（アトミックな一括更新）を失う可能性

---

## 4. 実装複雑度とリスク評価

| 項目 | 評価 | 根拠 |
|------|------|------|
| **工数** | **S（1〜3日）** | 全コンポーネント実装済み、App.txsの配線のみ |
| **リスク** | **低** | 既存パターンに準拠、変更ファイルは1〜2件、既存テスト影響なし |

---

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ
**Option A（App.tsx のみ修正）** を推奨する。全コンポーネントは既に実装済みであり、`App.tsx` の配線のみで問題が解決するため、変更範囲を最小に抑えられる。

### 設計フェーズで決定すべき事項

1. **アクション名の整合**: `SET_LIBRARY_DATA`（既存）を使用するか、要件書通り個別アクションに分割するかの選択
2. **エラーハンドリング戦略**: `Promise.all` で一括取得するか、個別に取得してエラーを分けるかの選択
3. **App.tsx テストの新規作成**: 現在 `App.tsx` のテストファイルが存在しないため、初期データ取得のモックテストを追加する必要がある

### Research Needed（なし）
外部ライブラリや新規パターンの調査は不要。全ての技術要素は既存コードベースで使用済みである。
