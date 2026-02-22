/**
 * App コンポーネントのユニットテスト (Tasks 2, 6.1, 6.2)
 *
 * App.tsx の AppProvider+AppContent 構成と初期データ取得を検証する
 */

import { vi } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import * as AppContextModule from '../state/AppContext'
import { fetchScenes, fetchEnvironments, fetchTechDefaults } from '../api/client'
import App from '../App'
import type { SceneTemplate } from '../types/scene'
import type { Environment } from '../types/environment'
import type { TechDefaults } from '../types/settings'

// --- フィクスチャ ---

const mockScenes: SceneTemplate[] = [
  { name: 'scene1', displayName: 'シーン1', positivePrompt: 'p', negativePrompt: 'n', batchSize: 1, previewImageUrl: null },
]

const mockEnvironments: Environment[] = [
  { name: 'env1', displayName: '環境1', environmentPrompt: 'ep', thumbnailUrl: null },
]

const mockTechDefaults: TechDefaults = {
  comfyuiConfig: { serverAddress: '127.0.0.1:8188', clientId: 'test' },
  workflowConfig: {
    workflowJsonPath: '/path',
    imageOutputPath: '/out',
    libraryFilePath: '/lib.yaml',
    seedNodeId: 1,
    batchSizeNodeId: 2,
    negativePromptNodeId: 3,
    positivePromptNodeId: 4,
    environmentPromptNodeId: 5,
    defaultPrompts: {
      basePositivePrompt: '',
      environmentPrompt: '',
      positivePrompt: '',
      negativePrompt: '',
      batchSize: 1,
    },
  },
}

// --- API クライアントモック (vi.fn() をファクトリ内で直接使用) ---

vi.mock('../api/client', () => ({
  fetchScenes: vi.fn(),
  fetchEnvironments: vi.fn(),
  fetchTechDefaults: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(fetchScenes).mockResolvedValue(mockScenes)
  vi.mocked(fetchEnvironments).mockResolvedValue(mockEnvironments)
  vi.mocked(fetchTechDefaults).mockResolvedValue(mockTechDefaults)
})

afterEach(() => {
  vi.clearAllMocks()
})

// Task 2 のテスト: AppProvider+AppContent 構造の検証
describe('App コンポーネント構造 (Task 2)', () => {
  it('AppProvider でアプリ全体がラップされている', async () => {
    const spy = vi.spyOn(AppContextModule, 'AppProvider')
    await act(async () => {
      render(<App />)
    })
    expect(spy).toHaveBeenCalled()
  })

  it('プレースホルダーの h1 タグが表示されない', async () => {
    await act(async () => {
      render(<App />)
    })
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })
})

// Task 6.1 のテスト: 初期データ取得の動作
describe('AppContent 初期データ取得 (Task 6.1)', () => {
  it('マウント時に fetchScenes が1回呼ばれる', async () => {
    render(<App />)
    await waitFor(() => {
      expect(fetchScenes).toHaveBeenCalledTimes(1)
    })
  })

  it('マウント時に fetchEnvironments が1回呼ばれる', async () => {
    render(<App />)
    await waitFor(() => {
      expect(fetchEnvironments).toHaveBeenCalledTimes(1)
    })
  })

  it('マウント時に fetchTechDefaults が1回呼ばれる', async () => {
    render(<App />)
    await waitFor(() => {
      expect(fetchTechDefaults).toHaveBeenCalledTimes(1)
    })
  })
})

// Task 4 のテスト: 3ペインレイアウトの表示
describe('AppContent 3ペインレイアウト (Task 4)', () => {
  it('SceneLibraryPanel がレンダリングされる（ロード後にシーンが表示される）', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('シーン1')).toBeTruthy()
    })
  })

  it('GlobalSettingsPanel がレンダリングされる（キャラクター名ラベルが表示される）', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('キャラクター名')).toBeTruthy()
    })
  })

  it('TechSettingsPanel がレンダリングされる（技術設定トグルが表示される）', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/技術設定/)).toBeTruthy()
    })
  })

  it('SceneQueuePanel がレンダリングされる（作成ボタンが表示される）', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('作成（Generate）')).toBeTruthy()
    })
  })
})

// Task 5 のテスト: SceneEditDrawer の統合
describe('AppContent SceneEditDrawer 統合 (Task 5)', () => {
  it('初期状態でドロワーが表示されない', async () => {
    render(<App />)
    await waitFor(() => screen.getByText('シーン1'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('QueueCard をクリックするとドロワーが開く', async () => {
    render(<App />)
    await waitFor(() => screen.getByText('シーン1'))

    // シーンライブラリのボタンをクリックしてキューに追加
    const libraryButton = screen.getAllByRole('button', { name: 'シーン1' })[0]
    fireEvent.click(libraryButton)

    // QueueCard が追加されたら、それをクリックしてドロワーを開く
    const allButtons = await waitFor(() => {
      const btns = screen.getAllByRole('button', { name: 'シーン1' })
      expect(btns.length).toBeGreaterThan(1)
      return btns
    })
    fireEvent.click(allButtons[allButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
    })
  })
})

// Task 6.2 のテスト: エラー処理の動作
describe('AppContent エラー処理 (Task 6.2)', () => {
  it('fetchScenes がエラーをスローしてもアプリがクラッシュしない', async () => {
    const consoleError = console.error
    console.error = () => {}

    vi.mocked(fetchScenes).mockRejectedValue(new Error('Network error'))

    let threw = false
    try {
      render(<App />)
      await waitFor(() => {
        expect(fetchScenes).toHaveBeenCalled()
      })
    } catch {
      threw = true
    }

    console.error = consoleError
    expect(threw).toBe(false)
  })
})
