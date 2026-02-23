# 要件定義書

## プロジェクト概要（入力）
現在のweb UIにはスタイルが適用されておらず、デフォルトのボタンやテキストボックスが、標準的な左揃えで適用されるようになっており、直感的な見た目になっていません。何らかのスタイル(Shadcn/uiなど)を導入することで、UIの見た目や操作感を改善します

## はじめに
本ドキュメントは、ComfyUI Prompt Maker フロントエンドのUIスタイル改善に関する要件を定義します。現在、フロントエンドはReact + TypeScript + Viteで構築されており、スタイルライブラリが導入されていないため、ブラウザのデフォルトスタイルのみが適用されています。Shadcn/ui（Tailwind CSS + Radix UIベース）を導入し、各コンポーネントに統一されたビジュアルデザインを適用することで、ユーザーが直感的に操作できるUIを実現します。

## 要件

### 要件 1: UIスタイルライブラリの導入
**目的:** 開発者として、一貫したデザインシステムを持つUIライブラリを導入したい。それにより、標準的な見た目と操作感を持つコンポーネントを効率的に構築できるようにするため。

#### 受け入れ基準
1. The Web UI shall have Tailwind CSS installed and configured as the primary styling utility framework.
2. The Web UI shall have Shadcn/ui installed and configured as the component library.
3. When the development server starts, the Web UI shall load Tailwind CSS styles without errors.
4. The Web UI shall have a `components/ui/` directory containing base Shadcn/ui components used across the application.
5. The Web UI shall maintain existing TypeScript type safety after introducing the style library.

### 要件 2: グローバルスタイルとレイアウト基盤の適用
**目的:** ユーザーとして、アプリ全体で一貫したフォント・カラーパレット・間隔を体験したい。それにより、視覚的なまとまりと操作の予測可能性を得るため。

#### 受け入れ基準
1. The Web UI shall apply a global CSS reset and base styles via Tailwind's `@tailwind base` directive.
2. The Web UI shall use a consistent color palette defined in Tailwind configuration for backgrounds, text, borders, and accents.
3. The Web UI shall display the three-column layout (left panel: 300px, center panel: flexible, right panel: 300px) using Tailwind utility classes instead of inline styles.
4. While the screen width is standard desktop size, the Web UI shall render all three panels visible simultaneously without horizontal overflow.
5. The Web UI shall apply consistent spacing (`padding`, `gap`) and border styles to panel containers using Tailwind utility classes.

### 要件 3: グローバル設定パネルのスタイル適用
**目的:** ユーザーとして、キャラクター名入力と環境選択が視覚的にわかりやすく配置されたパネルを操作したい。それにより、設定内容をひと目で把握し、素早く変更できるようにするため。

#### 受け入れ基準
1. The GlobalSettingsPanel shall display a styled section heading ("グローバル設定" or equivalent) with Tailwind typography classes.
2. The GlobalSettingsPanel shall render the character name input field using a Shadcn/ui `Input` component (or Tailwind-styled `<input>`), with visible label, border, and focus ring.
3. The GlobalSettingsPanel shall render the environment selector using a Shadcn/ui `Select` component (or equivalent styled dropdown), replacing the custom `<button>` + `<ul>` implementation.
4. When the environment dropdown is open, the Web UI shall display environment options with thumbnail images and display names in a visually styled list.
5. When an environment is selected, the GlobalSettingsPanel shall display the selected environment's name and thumbnail within the styled trigger button.
6. The GlobalSettingsPanel shall maintain all existing ARIA attributes (`aria-label`, `aria-haspopup`, `aria-expanded`, `role="listbox"`, `role="option"`, `aria-selected`) after styling.

### 要件 4: 技術設定パネルのスタイル適用
**目的:** ユーザーとして、技術設定のアコーディオン展開と各入力フィールドが整然と表示されたパネルを操作したい。それにより、必要な設定項目を素早く見つけて変更できるようにするため。

#### 受け入れ基準
1. The TechSettingsPanel shall render the expand/collapse toggle using a Shadcn/ui `Collapsible` component (or Tailwind-styled button with chevron icon), replacing the plain `<button>` with "▼/▶" characters.
2. When the TechSettingsPanel is collapsed, the Web UI shall display only the section header.
3. When the TechSettingsPanel is expanded, the Web UI shall display all form fields with consistent spacing and styled labels.
4. The TechSettingsPanel shall render all text and number inputs using styled `Input` components with visible borders and focus states.
5. The TechSettingsPanel shall group ComfyUI settings and workflow settings into visually distinct sections (using `Card` or `fieldset` with Tailwind border styles).
6. The TechSettingsPanel shall maintain all existing `htmlFor`/`id` label-input associations after styling.

### 要件 5: シーンライブラリパネルのスタイル適用
**目的:** ユーザーとして、利用可能なシーン一覧をサムネイルと名前付きのカード形式で確認したい。それにより、目的のシーンをひと目で識別してキューに追加できるようにするため。

#### 受け入れ基準
1. The SceneLibraryPanel shall display each scene as a styled card (using Tailwind border, rounded corners, shadow) with a thumbnail image and display name.
2. When a scene card is hovered, the SceneLibraryPanel shall apply a visual hover effect (e.g., background color change or border highlight) to indicate interactivity.
3. The SceneLibraryPanel shall display a styled loading indicator while data is being fetched.
4. The SceneLibraryPanel shall display a styled empty state message when no scenes are available.
5. If a data fetch error occurs, the SceneLibraryPanel shall display a styled error alert (using Shadcn/ui `Alert` or Tailwind alert styling).
6. The SceneLibraryPanel shall maintain the `role="list"` and `aria-label` accessibility attributes after styling.

### 要件 6: シーンキューパネルのスタイル適用
**目的:** ユーザーとして、キューに追加したシーン一覧と生成ボタンが明確に表示されたパネルを操作したい。それにより、生成前の状態をひと目で確認し、スムーズに生成を実行できるようにするため。

#### 受け入れ基準
1. The SceneQueuePanel shall render the "作成（Generate）" button using a Shadcn/ui `Button` component with primary styling (e.g., filled background color) and consistent sizing.
2. When the scene queue is empty and generate is attempted, the SceneQueuePanel shall display a styled error alert with clear messaging.
3. When required tech fields are missing, the SceneQueuePanel shall display a styled error alert listing the missing fields.
4. When a generation API error occurs, the SceneQueuePanel shall display a styled error alert with the error message.
5. The SceneQueuePanel shall display an empty state message with distinct styling when the queue has no scenes.
6. While generation is in progress, the SceneQueuePanel shall display a loading state on the generate button (e.g., spinner or disabled state).

### 要件 7: キューカードのスタイル適用
**目的:** ユーザーとして、キュー内の各シーンアイテムが操作しやすく表示されたカード形式で確認したい。それにより、編集・削除を迷わず実行できるようにするため。

#### 受け入れ基準
1. The QueueCard shall render as a styled card with visible background, border, and padding.
2. When a QueueCard has overrides applied, the Web UI shall display a visual indicator (e.g., colored left border or badge) to distinguish it from unmodified cards.
3. The QueueCard shall display override badges (e.g., "Prompt Modified", "Batch: N") using styled `Badge` components (Shadcn/ui `Badge` or equivalent Tailwind pill styling).
4. The QueueCard shall render the delete button as a styled icon button (using `Button variant="ghost"` or equivalent) positioned at the top-right of the card.
5. When a QueueCard is focused via keyboard, the Web UI shall display a visible focus ring consistent with the overall design.
6. The QueueCard shall maintain all existing keyboard interaction handlers (`onKeyDown`, `tabIndex`) and ARIA attributes after styling.

### 要件 8: シーン編集ドロワーのスタイル適用
**目的:** ユーザーとして、シーンを編集するドロワーが整然としたフォームレイアウトで表示されることを望む。それにより、各プロンプトやバッチサイズを直感的に編集できるようにするため。

#### 受け入れ基準
1. The SceneEditDrawer shall render using a Shadcn/ui `Sheet` component (or equivalent styled drawer), replacing the custom fixed-position overlay implementation.
2. The SceneEditDrawer shall display a styled header section with the scene name as a heading and a close button (using `Button variant="ghost"` or equivalent icon button).
3. The SceneEditDrawer shall render all text inputs (scene name) using styled `Input` components.
4. The SceneEditDrawer shall render all textarea fields (positive prompt, negative prompt) using styled `Textarea` components.
5. The SceneEditDrawer shall render the batch size input using a styled number `Input` component.
6. The SceneEditDrawer shall render the "完了" button using a Shadcn/ui `Button` component with primary styling, fixed at the bottom of the drawer.
7. The SceneEditDrawer shall maintain the `role="dialog"` and `aria-label` accessibility attributes after styling.
8. When the overlay backdrop is clicked, the SceneEditDrawer shall close as before, maintaining existing behavior.

### 要件 9: アクセシビリティの維持
**目的:** 開発者として、スタイル導入後もすべての既存テストが通過することを確認したい。それにより、アクセシビリティと機能的な回帰を防ぐため。

#### 受け入れ基準
1. The Web UI shall maintain all existing ARIA roles, labels, and keyboard navigation behavior after styling is applied.
2. When running the existing test suite after styling changes, all tests shall pass without modification to test logic.
3. The Web UI shall ensure all interactive elements (buttons, inputs, select, textarea) have accessible names via `aria-label`, `<label>`, or associated `htmlFor`.
4. The Web UI shall provide a visible focus indicator for all focusable elements, consistent with the design system's focus ring styling.
