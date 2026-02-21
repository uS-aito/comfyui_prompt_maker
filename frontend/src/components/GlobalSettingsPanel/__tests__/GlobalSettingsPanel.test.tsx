/**
 * GlobalSettingsPanel ユニットテスト (タスク 7.1)
 *
 * キャラクター名入力と環境選択ドロップダウンの動作を検証する
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

// --- 環境選択ドロップダウン ---

describe('GlobalSettingsPanel - 環境選択ドロップダウン', () => {
  it('環境選択トリガーが表示される', () => {
    renderWithLibraryData()
    expect(screen.getByRole('button', { name: '環境を選択' })).toBeDefined()
  })

  it('初期状態で環境が未選択（プレースホルダ表示）', () => {
    renderWithLibraryData()
    expect(screen.getByText('環境を選択')).toBeDefined()
  })

  it('トリガークリックでドロップダウンが開く', () => {
    renderWithLibraryData()
    act(() => {
      screen.getByRole('button', { name: '環境を選択' }).click()
    })
    expect(screen.getByRole('listbox')).toBeDefined()
  })

  it('ドロップダウンに環境一覧が表示される', () => {
    renderWithLibraryData()
    act(() => {
      screen.getByRole('button', { name: '環境を選択' }).click()
    })
    expect(screen.getByRole('option', { name: '室内' })).toBeDefined()
    expect(screen.getByRole('option', { name: '屋外' })).toBeDefined()
  })

  it('サムネイルあり環境の img 要素がドロップダウンに表示される', () => {
    renderWithLibraryData()
    act(() => {
      screen.getByRole('button', { name: '環境を選択' }).click()
    })
    const img = screen.getByAltText('屋外') as HTMLImageElement
    expect(img).toBeDefined()
    expect(img.src).toContain('/api/images/outdoor.jpg')
  })

  it('環境選択後にドロップダウンが閉じる', () => {
    renderWithLibraryData()
    act(() => {
      screen.getByRole('button', { name: '環境を選択' }).click()
    })
    act(() => {
      screen.getByRole('option', { name: '室内' }).click()
    })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('環境選択後にトリガーボタンに選択環境名が表示される', () => {
    renderWithLibraryData()
    act(() => {
      screen.getByRole('button', { name: '環境を選択' }).click()
    })
    act(() => {
      screen.getByRole('option', { name: '室内' }).click()
    })
    expect(screen.getByText('室内')).toBeDefined()
  })

  it('環境選択後に再クリックで別の環境に切り替えられる', () => {
    renderWithLibraryData()
    // 室内を選択
    act(() => {
      screen.getByRole('button', { name: '環境を選択' }).click()
    })
    act(() => {
      screen.getByRole('option', { name: '室内' }).click()
    })
    // 再び開いて屋外を選択
    act(() => {
      screen.getByRole('button', { name: '環境: 室内' }).click()
    })
    act(() => {
      screen.getByRole('option', { name: '屋外' }).click()
    })
    expect(screen.getByText('屋外')).toBeDefined()
  })

  it('環境リストが空の場合でもエラーなく動作する', () => {
    renderWithLibraryData([])
    act(() => {
      screen.getByRole('button', { name: '環境を選択' }).click()
    })
    expect(screen.getByRole('listbox')).toBeDefined()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })
})
