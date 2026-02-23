/**
 * GlobalSettingsPanel ユニットテスト (タスク 3, 9.1)
 *
 * キャラクター名入力と環境選択（Shadcn/ui Select）の動作を検証する
 *
 * 変更点 (タスク 9.1):
 * - カスタムドロップダウン前提のクエリ（role="button" で trigger を取得）を
 *   Radix Select の DOM 構造（role="combobox"）に対応させた
 * - ドロップダウンの開閉は fireEvent.pointerDown / fireEvent.click で操作する
 * - listbox・option クエリはそのまま維持（Portal でレンダリングされるが screen で検索可能）
 */

import { render, screen, act, fireEvent } from '@testing-library/react'
import { AppProvider, useAppContext } from '../../../state/AppContext'
import { GlobalSettingsPanel } from '../GlobalSettingsPanel'
import type { AppAction } from '../../../state/reducer'
import type { Environment } from '../../../types/environment'
import type { TechDefaults } from '../../../types/settings'
import type { Dispatch } from 'react'

// テスト用フィクスチャ
const mockEnvironments: Environment[] = [
  {
    name: 'indoor',
    displayName: '室内',
    environmentPrompt: 'indoor room, soft lighting',
    thumbnailUrl: null,
  },
  {
    name: 'outdoor',
    displayName: '屋外',
    environmentPrompt: 'outdoor park',
    thumbnailUrl: '/api/images/outdoor.jpg',
  },
]

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

// ライブラリデータを事前ロードして GlobalSettingsPanel をレンダリングするヘルパー
function renderWithLibraryData(environments: Environment[] = mockEnvironments) {
  let dispatchRef!: Dispatch<AppAction>
  const result = render(
    <AppProvider>
      <DispatchCapture onCapture={(d) => { dispatchRef = d }} />
      <GlobalSettingsPanel />
    </AppProvider>
  )

  act(() => {
    dispatchRef({
      type: 'SET_LIBRARY_DATA',
      payload: { scenes: [], environments, techDefaults: mockTechDefaults },
    })
  })

  return result
}

// Radix Select のトリガーを取得するヘルパー
// SelectTrigger は role="combobox" で描画される
function getSelectTrigger() {
  return screen.getByRole('combobox')
}

// Radix Select のドロップダウンを開くヘルパー
// Radix は pointerDown イベントで開く（pointerType が 'touch' 以外の場合）
function openDropdown(trigger: HTMLElement) {
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' })
}

// --- キャラクター名入力 ---

describe('GlobalSettingsPanel - キャラクター名入力', () => {
  it('キャラクター名ラベルが表示される', () => {
    renderWithLibraryData()
    expect(screen.getByText('キャラクター名')).toBeDefined()
  })

  it('テキストボックスが表示される', () => {
    renderWithLibraryData()
    const input = screen.getByRole('textbox', { name: /キャラクター名/i })
    expect(input).toBeDefined()
  })

  it('テキストボックスの初期値が空文字', () => {
    renderWithLibraryData()
    const input = screen.getByRole('textbox', { name: /キャラクター名/i }) as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('テキストボックスへの入力が AppState の characterName に反映される', () => {
    renderWithLibraryData()
    const input = screen.getByRole('textbox', { name: /キャラクター名/i }) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Haru' } })
    expect(input.value).toBe('Haru')
  })

  it('入力値クリアで空文字に戻る', () => {
    renderWithLibraryData()
    const input = screen.getByRole('textbox', { name: /キャラクター名/i }) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Haru' } })
    fireEvent.change(input, { target: { value: '' } })
    expect(input.value).toBe('')
  })
})

// --- グローバル設定見出し ---

describe('GlobalSettingsPanel - セクション見出し', () => {
  it('グローバル設定の見出しが表示される', () => {
    renderWithLibraryData()
    expect(screen.getByText('グローバル設定')).toBeDefined()
  })
})

// --- 環境選択（Radix UI Select） ---

describe('GlobalSettingsPanel - 環境選択（Shadcn/ui Select）', () => {
  it('環境選択コンボボックスが表示される', () => {
    renderWithLibraryData()
    expect(getSelectTrigger()).toBeDefined()
  })

  it('初期状態で環境が未選択（プレースホルダ表示）', () => {
    renderWithLibraryData()
    expect(screen.getByText('環境を選択')).toBeDefined()
  })

  it('トリガー操作でドロップダウンが開く', () => {
    renderWithLibraryData()
    const trigger = getSelectTrigger()
    act(() => {
      openDropdown(trigger)
    })
    expect(screen.getByRole('listbox')).toBeDefined()
  })

  it('ドロップダウンに環境一覧が表示される', () => {
    renderWithLibraryData()
    const trigger = getSelectTrigger()
    act(() => {
      openDropdown(trigger)
    })
    expect(screen.getByRole('option', { name: '室内' })).toBeDefined()
    expect(screen.getByRole('option', { name: '屋外' })).toBeDefined()
  })

  it('サムネイルあり環境の img 要素がドロップダウンに表示される', () => {
    renderWithLibraryData()
    const trigger = getSelectTrigger()
    act(() => {
      openDropdown(trigger)
    })
    const img = screen.getByAltText('屋外') as HTMLImageElement
    expect(img).toBeDefined()
    expect(img.src).toContain('/api/images/outdoor.jpg')
  })

  it('環境を選択すると SELECT_ENVIRONMENT が dispatch される', () => {
    let capturedDispatch!: Dispatch<AppAction>
    const wrapper = render(
      <AppProvider>
        <DispatchCapture onCapture={(d) => { capturedDispatch = d }} />
        <GlobalSettingsPanel />
      </AppProvider>
    )

    act(() => {
      capturedDispatch({
        type: 'SET_LIBRARY_DATA',
        payload: { scenes: [], environments: mockEnvironments, techDefaults: mockTechDefaults },
      })
    })

    const trigger = getSelectTrigger()
    act(() => {
      openDropdown(trigger)
    })

    const option = screen.getByRole('option', { name: '室内' })
    act(() => {
      fireEvent.click(option)
    })

    // 選択後に室内の名前がトリガーに表示される（dispatch 経由で state 更新）
    expect(screen.getByText('室内')).toBeDefined()

    wrapper.unmount()
  })

  it('環境選択後にドロップダウンが閉じる', () => {
    renderWithLibraryData()
    const trigger = getSelectTrigger()
    act(() => {
      openDropdown(trigger)
    })
    const option = screen.getByRole('option', { name: '室内' })
    act(() => {
      fireEvent.click(option)
    })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('環境リストが空の場合でもエラーなく動作する', () => {
    renderWithLibraryData([])
    const trigger = getSelectTrigger()
    act(() => {
      openDropdown(trigger)
    })
    expect(screen.getByRole('listbox')).toBeDefined()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })
})
