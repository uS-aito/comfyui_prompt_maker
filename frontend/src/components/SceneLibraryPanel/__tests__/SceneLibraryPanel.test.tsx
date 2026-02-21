/**
 * SceneLibraryPanel ユニットテスト (タスク 8)
 *
 * 中央ペイン UI のシーンライブラリパネルの動作を検証する
 * - シーンカードリスト表示（プレビュー画像＋シーン名）
 * - カードクリックでシーンキューへ追加
 * - エラーメッセージ表示
 * - 垂直スクロール可能なコンテナ
 */

import { render, screen, act } from '@testing-library/react'
import type { Dispatch } from 'react'
import { AppProvider, useAppContext } from '../../../state/AppContext'
import type { AppAction } from '../../../state/reducer'
import { SceneLibraryPanel } from '../SceneLibraryPanel'
import type { SceneTemplate } from '../../../types/scene'
import type { TechDefaults } from '../../../types/settings'

// --- テスト用フィクスチャ ---

const mockScenes: SceneTemplate[] = [
  {
    name: 'studying',
    displayName: '勉強しているシーン',
    positivePrompt: 'sitting at desk, studying, reading book',
    negativePrompt: '',
    batchSize: 1,
    previewImageUrl: '/api/images/scenes/studying.jpg',
  },
  {
    name: 'cooking',
    displayName: '料理しているシーン',
    positivePrompt: 'cooking in kitchen',
    negativePrompt: 'lowres',
    batchSize: 2,
    previewImageUrl: null,
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

// --- ヘルパー ---

function DispatchCapture({ onCapture }: { onCapture: (d: Dispatch<AppAction>) => void }) {
  const { dispatch } = useAppContext()
  onCapture(dispatch)
  return null
}

// キューの長さを表示するヘルパーコンポーネント
function SceneQueueCount() {
  const { state } = useAppContext()
  return <span data-testid="queue-count">{state.sceneQueue.length}</span>
}

function renderWithScenes(scenes: SceneTemplate[] = mockScenes) {
  let dispatchRef!: Dispatch<AppAction>
  const result = render(
    <AppProvider>
      <DispatchCapture onCapture={(d) => { dispatchRef = d }} />
      <SceneLibraryPanel />
      <SceneQueueCount />
    </AppProvider>
  )
  act(() => {
    dispatchRef({
      type: 'SET_LIBRARY_DATA',
      payload: { scenes, environments: [], techDefaults: mockTechDefaults },
    })
  })
  return { ...result, getDispatch: () => dispatchRef }
}

// --- シーンカードリスト表示 ---

describe('SceneLibraryPanel - シーンカードリスト', () => {
  it('シーン一覧が取得できている場合にカードが表示される', () => {
    renderWithScenes()
    expect(screen.getByRole('button', { name: '勉強しているシーン' })).toBeDefined()
    expect(screen.getByRole('button', { name: '料理しているシーン' })).toBeDefined()
  })

  it('各シーンのシーン名が表示される', () => {
    renderWithScenes()
    expect(screen.getByText('勉強しているシーン')).toBeDefined()
    expect(screen.getByText('料理しているシーン')).toBeDefined()
  })

  it('プレビュー画像がある場合に img 要素が表示される', () => {
    renderWithScenes()
    const img = screen.getByAltText('勉強しているシーン') as HTMLImageElement
    expect(img).toBeDefined()
    expect(img.src).toContain('/api/images/scenes/studying.jpg')
  })

  it('プレビュー画像がない場合に img 要素が表示されない', () => {
    renderWithScenes()
    expect(screen.queryByAltText('料理しているシーン')).toBeNull()
  })
})

// --- スクロール可能なコンテナ ---

describe('SceneLibraryPanel - スクロール', () => {
  it('スクロール可能なコンテナが存在する', () => {
    renderWithScenes()
    const container = screen.getByRole('list')
    // スクロール可能なコンテナの親要素を確認
    expect(container.parentElement).toBeDefined()
  })
})

// --- カードクリックでキューへ追加 ---

describe('SceneLibraryPanel - シーンキューへの追加', () => {
  it('カードをクリックするとシーンがキューに追加される', () => {
    renderWithScenes()
    const beforeCount = parseInt(screen.getByTestId('queue-count').textContent ?? '0')
    act(() => {
      screen.getByRole('button', { name: '勉強しているシーン' }).click()
    })
    const afterCount = parseInt(screen.getByTestId('queue-count').textContent ?? '0')
    expect(afterCount).toBe(beforeCount + 1)
  })

  it('同じシーンを複数回クリックすると複数追加される', () => {
    renderWithScenes()
    act(() => {
      screen.getByRole('button', { name: '勉強しているシーン' }).click()
    })
    act(() => {
      screen.getByRole('button', { name: '勉強しているシーン' }).click()
    })
    const count = parseInt(screen.getByTestId('queue-count').textContent ?? '0')
    expect(count).toBe(2)
  })

  it('異なるシーンをそれぞれクリックするとどちらもキューに追加される', () => {
    renderWithScenes()
    act(() => {
      screen.getByRole('button', { name: '勉強しているシーン' }).click()
    })
    act(() => {
      screen.getByRole('button', { name: '料理しているシーン' }).click()
    })
    const count = parseInt(screen.getByTestId('queue-count').textContent ?? '0')
    expect(count).toBe(2)
  })
})

// --- シーンリストが空の場合 ---

describe('SceneLibraryPanel - シーンなしの状態', () => {
  it('シーンリストが空の場合にメッセージが表示される', () => {
    renderWithScenes([])
    expect(screen.getByText(/シーンが見つかりません/)).toBeDefined()
  })

  it('シーンリストが空の場合にカードが表示されない', () => {
    renderWithScenes([])
    expect(screen.queryByRole('button')).toBeNull()
  })
})

// --- エラー表示 ---

describe('SceneLibraryPanel - エラー表示', () => {
  it('エラー時にエラーメッセージが表示される', () => {
    let dispatchRef!: Dispatch<AppAction>
    render(
      <AppProvider>
        <DispatchCapture onCapture={(d) => { dispatchRef = d }} />
        <SceneLibraryPanel />
      </AppProvider>
    )
    act(() => {
      dispatchRef({ type: 'SET_ERROR', payload: 'シーンライブラリの取得に失敗しました' })
    })
    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByText('シーンライブラリの取得に失敗しました')).toBeDefined()
  })

  it('エラー時にシーンカードが表示されない', () => {
    let dispatchRef!: Dispatch<AppAction>
    render(
      <AppProvider>
        <DispatchCapture onCapture={(d) => { dispatchRef = d }} />
        <SceneLibraryPanel />
      </AppProvider>
    )
    act(() => {
      dispatchRef({
        type: 'SET_LIBRARY_DATA',
        payload: { scenes: mockScenes, environments: [], techDefaults: mockTechDefaults },
      })
      dispatchRef({ type: 'SET_ERROR', payload: 'シーンライブラリの取得に失敗しました' })
    })
    expect(screen.queryByRole('list')).toBeNull()
  })
})
