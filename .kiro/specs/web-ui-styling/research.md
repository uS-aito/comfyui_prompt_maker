# リサーチ・設計決定ログ

---

## サマリー
- **フィーチャー**: `web-ui-styling`
- **ディスカバリースコープ**: Extension（既存Reactアプリへのスタイルライブラリ追加）
- **主要な調査結果**:
  - Shadcn/ui は Tailwind CSS v4 + `@tailwindcss/vite` プラグインを公式サポート（PostCSSは不要）
  - Shadcn/ui コンポーネントは CLI でローカルに生成されるため、完全なカスタマイズが可能
  - `@/` パスエイリアスを `vite.config.ts` と `tsconfig.json` の両方に追加が必要
  - Radix UI は 2026年2月より統合パッケージ `radix-ui` に移行（CLI が自動選択）
  - React 18 + Vite 5 + Shadcn/ui 間に既知の破壊的互換性問題はなし

---

## リサーチログ

### Shadcn/ui + Tailwind CSS v4 の互換性と導入方法

- **コンテキスト**: 既存プロジェクトに Tailwind CSS が未導入のため、最新版での導入方法を調査
- **参照ソース**: ui.shadcn.com/docs/installation/vite, ui.shadcn.com/docs/tailwind-v4
- **調査結果**:
  - Tailwind CSS v4 は CSS ファーストの設定体系（`tailwind.config.js` は廃止、`@theme` ディレクティブに移行）
  - Vite プロジェクトでは `@tailwindcss/vite` プラグインを使用（PostCSS 設定不要）
  - アニメーション用パッケージは `tailwindcss-animate` から `tw-animate-css` に変更
  - CSS カスタムプロパティのカラー形式が HSL から OKLCH に変更
  - `npx shadcn@latest init` が自動的に依存パッケージ（clsx, tailwind-merge, class-variance-authority, lucide-react, radix-ui）をインストール
- **影響**:
  - `vite.config.ts` に `@tailwindcss/vite` プラグインと `path` エイリアスの追加が必要
  - `tsconfig.json` に `baseUrl` と `paths` の追加が必要
  - `src/index.css` を `@import "tailwindcss"` に書き換え

### Radix UI 統合パッケージ移行（2026年2月）

- **コンテキスト**: Shadcn/ui が使用する Radix UI の import パスが変更された
- **調査結果**:
  - 旧: `import * as DialogPrimitive from "@radix-ui/react-dialog"`
  - 新: `import { Dialog as DialogPrimitive } from "radix-ui"`
  - `npx shadcn@latest add` が自動的に新パッケージ形式でコンポーネントを生成
- **影響**: 新規インストール時は `npx shadcn@latest` を使用すれば自動対応、手動コピーは不要

### Sheet vs Drawer の選択

- **コンテキスト**: SceneEditDrawer はスライドインパネルとして右側から表示される
- **調査結果**:
  - `Sheet` コンポーネント: `side` prop で `top|right|bottom|left` を指定可能、デスクトップUIのサイドパネル向け
  - `Drawer` コンポーネント: `vaul` ライブラリベース、モバイル向けボトムドロワー向け
  - 現在の SceneEditDrawer は `right` からスライドインするため `Sheet` が適切
- **影響**: SceneEditDrawer は `Sheet` + `SheetContent side="right"` で置き換え

### テスト互換性の調査

- **コンテキスト**: 既存テストが `@testing-library/react` で ARIA ロール/ラベルを使用
- **調査結果**:
  - Shadcn/ui の `Input`, `Button`, `Textarea` は標準 HTML 要素をラップするため ARIA 属性維持は容易
  - Radix の `Select` コンポーネントは Portal を使用してリストボックスをレンダリングするため、`getAllByRole('option')` のクエリが変わる可能性
  - `Sheet` は Portal を使用するため、既存の `getByRole('dialog')` は引き続き機能するが、オーバーレイの `data-testid` はコンポーネント内部に移動
  - `Collapsible` はアコーディオン動作を維持しながら DOM 構造が変わる
- **影響**: `GlobalSettingsPanel` の Select と `SceneEditDrawer` の Sheet ではテストの DOM クエリ変更が発生しうる（既存テストのロールベースクエリは概ね継続動作の見込み）

---

## アーキテクチャパターン評価

| オプション | 説明 | 強み | リスク / 制限 | 備考 |
|---|---|---|---|---|
| Shadcn/ui + Tailwind v4 | CLI でローカル生成するコンポーネント群 + CSS ファーストフレームワーク | コンポーネントが手元にあるため完全カスタマイズ可能、型安全、Radix UI ベースでアクセシビリティ担保 | セットアップ手順が複数ステップ | 最新公式推奨 |
| Material UI (MUI) | npm パッケージとして提供されるコンポーネントライブラリ | 豊富なコンポーネント | Tailwind との共存が困難、バンドルサイズ大 | 非採用 |
| Tailwind のみ（コンポーネントなし） | ユーティリティクラスのみ適用 | 依存関係が少ない | アクセシブルなカスタムコンポーネント（Select, Sheet など）の実装コスト大 | 非採用 |

---

## 設計決定

### 決定: Tailwind CSS v3 vs v4

- **コンテキスト**: Tailwind が未導入のため、v3 か v4 を選択する
- **検討した選択肢**:
  1. Tailwind CSS v3 — PostCSS ベース、設定ファイルあり
  2. Tailwind CSS v4 — CSS ファースト、Vite ネイティブプラグイン
- **選択されたアプローチ**: Tailwind CSS v4 (`@tailwindcss/vite` プラグイン)
- **理由**: 新規導入のため最新バージョンを選択する。Shadcn/ui も v4 を公式サポートしており、PostCSS 設定が不要でシンプル
- **トレードオフ**: v4 はまだ採用事例が v3 より少ないが、ドキュメントが充実しており問題なし
- **フォローアップ**: `postcss.config.js` を作成しないよう注意

### 決定: カスタムドロップダウン vs Radix Select

- **コンテキスト**: `GlobalSettingsPanel` の環境選択は現在カスタム実装（`<button>` + `<ul role="listbox">`）
- **検討した選択肢**:
  1. 既存のカスタムドロップダウンを保持し、Tailwind でスタイルのみ適用
  2. Shadcn/ui `Select` コンポーネントに置き換え
- **選択されたアプローチ**: Shadcn/ui `Select` に置き換え
- **理由**: Radix UI ベースの `Select` はアクセシビリティが担保されており、キーボード操作・スクリーンリーダー対応が完全。既存のカスタム実装より信頼性が高い
- **トレードオフ**: テストの DOM クエリが変更になる可能性。既存テスト (`SceneLibraryPanel.test.tsx` 等) は `role="listbox"` と `role="option"` でクエリしている箇所を確認が必要
- **フォローアップ**: SceneLibraryPanel テストが Select を直接テストしていないことを確認、GlobalSettingsPanel テストで Select の新しいクエリパターンに更新が必要な場合は更新する

---

## リスクと緩和策

- **テスト失敗リスク（Select コンポーネント）** — Radix Select の Portal レンダリングにより `getAllByRole('option')` 等のクエリが変わる可能性 → テスト実行後に適宜クエリを修正する
- **Sheet の `data-testid="drawer-overlay"` が消える** — Sheet のオーバーレイは Radix 内部実装のため `data-testid` が使えない → テストは `role="dialog"` と Escape キー操作で代替する
- **Tailwind v4 CSS 変数フォーマット** — v3 とは CSS カスタムプロパティの記法が異なる → `npx shadcn@latest init` が自動生成するため手動変換は不要
- **`noUnusedLocals: true` による型エラー** — 使用しなくなった import が残った場合にビルドエラー → コンポーネント修正時に不要な import を削除する

---

## 参照
- [Shadcn/ui Vite インストール](https://ui.shadcn.com/docs/installation/vite)
- [Shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)
- [Shadcn/ui Sheet コンポーネント](https://ui.shadcn.com/docs/components/sheet)
- [Shadcn/ui Select コンポーネント](https://ui.shadcn.com/docs/components/select)
- [Shadcn/ui Collapsible コンポーネント](https://ui.shadcn.com/docs/components/collapsible)
- [Radix UI 統合パッケージ移行](https://ui.shadcn.com/docs/changelog)
