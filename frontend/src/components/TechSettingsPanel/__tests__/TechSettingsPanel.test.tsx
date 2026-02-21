/**
 * TechSettingsPanel ユニットテスト (タスク 7.2)
 *
 * 技術設定フォームの折りたたみ・プレースホルダ・入力・クリアの動作を検証する
 */

import { render, screen, act, fireEvent } from '@testing-library/react'
import type { Dispatch } from 'react'
import { AppProvider, useAppContext } from '../../../state/AppContext'
import type { AppAction } from '../../../state/reducer'
import { TechSettingsPanel } from '../TechSettingsPanel'
import type { TechDefaults } from '../../../types/settings'

// テスト用フィクスチャ
const mockTechDefaults: TechDefaults = {
  comfyuiConfig: { serverAddress: '127.0.0.1:8188', clientId: 't2i_client' },
  workflowConfig: {
    workflowJsonPath: '/path/to/workflow.json',
    imageOutputPath: '/path/to/output',
    libraryFilePath: '/path/to/library.yaml',
    seedNodeId: 164,
    batchSizeNodeId: 22,
    negativePromptNodeId: 174,
    positivePromptNodeId: 257,
    environmentPromptNodeId: 303,
    defaultPrompts: {
      basePositivePrompt: 'masterpiece',
      environmentPrompt: '',
      positivePrompt: '',
      negativePrompt: 'lowres',
      batchSize: 1,
    },
  },
}

// AppContext の dispatch を外部に公開するヘルパーコンポーネント
function DispatchCapture({ onCapture }: { onCapture: (d: Dispatch<AppAction>) => void }) {
  const { dispatch } = useAppContext()
  onCapture(dispatch)
  return null
}

// TechDefaults を事前ロードして TechSettingsPanel をレンダリングするヘルパー
function renderWithDefaults(defaults: TechDefaults | null = mockTechDefaults) {
  let dispatchRef!: Dispatch<AppAction>
  const result = render(
    <AppProvider>
      <DispatchCapture onCapture={(d) => { dispatchRef = d }} />
      <TechSettingsPanel />
    </AppProvider>
  )
  if (defaults) {
    act(() => {
      dispatchRef({
        type: 'SET_LIBRARY_DATA',
        payload: { scenes: [], environments: [], techDefaults: defaults },
      })
    })
  }
  return result
}

// フォームを展開するヘルパー
function expandPanel() {
  act(() => {
    screen.getByRole('button', { name: /技術設定/i }).click()
  })
}

// --- 折りたたみ ---

describe('TechSettingsPanel - 折りたたみ', () => {
  it('技術設定のトグルボタンが表示される', () => {
    renderWithDefaults()
    expect(screen.getByRole('button', { name: /技術設定/i })).toBeDefined()
  })

  it('初期状態でフォームが折りたたまれている', () => {
    renderWithDefaults()
    expect(screen.queryByLabelText(/サーバーアドレス/i)).toBeNull()
  })

  it('トグルボタンクリックでフォームが展開する', () => {
    renderWithDefaults()
    expandPanel()
    expect(screen.getByLabelText(/サーバーアドレス/i)).toBeDefined()
  })

  it('展開後に再クリックでフォームが折りたたまれる', () => {
    renderWithDefaults()
    expandPanel()
    act(() => {
      screen.getByRole('button', { name: /技術設定/i }).click()
    })
    expect(screen.queryByLabelText(/サーバーアドレス/i)).toBeNull()
  })
})

// --- プレースホルダ ---

describe('TechSettingsPanel - プレースホルダ', () => {
  it('serverAddress のデフォルト値がプレースホルダとして表示される', () => {
    renderWithDefaults()
    expandPanel()
    const input = screen.getByLabelText(/サーバーアドレス/i) as HTMLInputElement
    expect(input.placeholder).toBe('127.0.0.1:8188')
  })

  it('clientId のデフォルト値がプレースホルダとして表示される', () => {
    renderWithDefaults()
    expandPanel()
    const input = screen.getByLabelText(/クライアントID/i) as HTMLInputElement
    expect(input.placeholder).toBe('t2i_client')
  })

  it('workflowJsonPath のデフォルト値がプレースホルダとして表示される', () => {
    renderWithDefaults()
    expandPanel()
    const input = screen.getByLabelText(/ワークフロー JSON パス/i) as HTMLInputElement
    expect(input.placeholder).toBe('/path/to/workflow.json')
  })

  it('seedNodeId のデフォルト値が文字列としてプレースホルダに表示される', () => {
    renderWithDefaults()
    expandPanel()
    const input = screen.getByLabelText(/シードノードID/i) as HTMLInputElement
    expect(input.placeholder).toBe('164')
  })

  it('techDefaults が null の場合にプレースホルダが空', () => {
    renderWithDefaults(null)
    expandPanel()
    const input = screen.getByLabelText(/サーバーアドレス/i) as HTMLInputElement
    expect(input.placeholder).toBe('')
  })
})

// --- ユーザー入力 ---

describe('TechSettingsPanel - ユーザー入力', () => {
  it('serverAddress 入力が AppState に反映される', () => {
    renderWithDefaults()
    expandPanel()
    const input = screen.getByLabelText(/サーバーアドレス/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'custom:9000' } })
    expect(input.value).toBe('custom:9000')
  })

  it('clientId 入力が AppState に反映される', () => {
    renderWithDefaults()
    expandPanel()
    const input = screen.getByLabelText(/クライアントID/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'my_client' } })
    expect(input.value).toBe('my_client')
  })

  it('workflowJsonPath 入力が AppState に反映される', () => {
    renderWithDefaults()
    expandPanel()
    const input = screen.getByLabelText(/ワークフロー JSON パス/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '/new/workflow.json' } })
    expect(input.value).toBe('/new/workflow.json')
  })

  it('数値フィールド（seedNodeId）入力が AppState に反映される', () => {
    renderWithDefaults()
    expandPanel()
    const input = screen.getByLabelText(/シードノードID/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '999' } })
    expect(input.value).toBe('999')
  })
})

// --- クリアとフォールバック ---

describe('TechSettingsPanel - 入力クリアとフォールバック', () => {
  it('serverAddress をクリアするとプレースホルダ（デフォルト値）に戻る', () => {
    renderWithDefaults()
    expandPanel()
    const input = screen.getByLabelText(/サーバーアドレス/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'custom:9000' } })
    fireEvent.change(input, { target: { value: '' } })
    expect(input.value).toBe('')
    expect(input.placeholder).toBe('127.0.0.1:8188')
  })

  it('数値フィールドをクリアしても空文字になる', () => {
    renderWithDefaults()
    expandPanel()
    const input = screen.getByLabelText(/シードノードID/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '999' } })
    fireEvent.change(input, { target: { value: '' } })
    expect(input.value).toBe('')
  })
})

// --- フォームフィールド存在確認 ---

describe('TechSettingsPanel - フォームフィールド', () => {
  it('展開時に ComfyUI 設定フィールドが表示される', () => {
    renderWithDefaults()
    expandPanel()
    expect(screen.getByLabelText(/サーバーアドレス/i)).toBeDefined()
    expect(screen.getByLabelText(/クライアントID/i)).toBeDefined()
  })

  it('展開時にワークフローパス設定フィールドが表示される', () => {
    renderWithDefaults()
    expandPanel()
    expect(screen.getByLabelText(/ワークフロー JSON パス/i)).toBeDefined()
    expect(screen.getByLabelText(/画像出力パス/i)).toBeDefined()
    expect(screen.getByLabelText(/ライブラリファイルパス/i)).toBeDefined()
  })

  it('展開時にノードID設定フィールドが全て表示される', () => {
    renderWithDefaults()
    expandPanel()
    expect(screen.getByLabelText(/シードノードID/i)).toBeDefined()
    expect(screen.getByLabelText(/バッチサイズノードID/i)).toBeDefined()
    expect(screen.getByLabelText(/ネガティブプロンプトノードID/i)).toBeDefined()
    expect(screen.getByLabelText(/ポジティブプロンプトノードID/i)).toBeDefined()
    expect(screen.getByLabelText(/環境プロンプトノードID/i)).toBeDefined()
  })

  it('数値フィールドは type="number" で表示される', () => {
    renderWithDefaults()
    expandPanel()
    const seedInput = screen.getByLabelText(/シードノードID/i) as HTMLInputElement
    expect(seedInput.type).toBe('number')
  })
})
