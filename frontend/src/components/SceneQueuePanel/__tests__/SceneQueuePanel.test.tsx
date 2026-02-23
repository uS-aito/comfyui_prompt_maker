/**
 * SceneQueuePanel ユニットテスト (タスク 9.2, 11.1, 11.2)
 *
 * 右ペイン UI のシーンキューパネルの動作を検証する
 * - QueueCard を使用してキュー内シーンカードリストを表示する
 * - 削除ボタンクリックでキューから削除される
 * - カードクリックでドロワーを開く（OPEN_DRAWER dispatch）
 * - 「作成（Generate）」ボタンの固定表示
 * - 垂直スクロール可能なリストコンテナ
 * - 生成前バリデーション（11.1）
 * - コンフィグ生成・ダウンロード・エラー表示（11.2）
 */

import { render, screen, act, waitFor } from '@testing-library/react'
import type { Dispatch } from 'react'
import { AppProvider, useAppContext } from '../../../state/AppContext'
import type { AppAction } from '../../../state/reducer'
import { SceneQueuePanel } from '../SceneQueuePanel'
import type { SceneTemplate } from '../../../types/scene'
import type { TechDefaults } from '../../../types/settings'
import { ApiError } from '../../../api/client'

// vi.mock はホイストされるためファイル先頭で宣言する
vi.mock('../../../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/client')>()
  return {
    ...actual,
    generateConfig: vi.fn(),
  }
})

vi.mock('../../../utils/download', () => ({
  downloadBlob: vi.fn(),
}))

// モック済みモジュールのインポート
const { generateConfig } = await import('../../../api/client')
const { downloadBlob } = await import('../../../utils/download')

// --- テスト用フィクスチャ ---

const mockScenes: SceneTemplate[] = [
  {
    name: 'studying',
    displayName: '勉強しているシーン',
    positivePrompt: 'sitting at desk, studying',
    negativePrompt: '',
    batchSize: 1,
    previewImageUrl: null,
  },
  {
    name: 'cooking',
    displayName: '料理しているシーン',
    positivePrompt: 'cooking in kitchen',
    negativePrompt: '',
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

// --- beforeEach / afterEach ---

beforeEach(() => {
  vi.mocked(generateConfig).mockResolvedValue(new Blob(['yaml: content'], { type: 'application/yaml' }))
})

afterEach(() => {
  vi.clearAllMocks()
})

// --- ヘルパー ---

function DispatchCapture({ onCapture }: { onCapture: (d: Dispatch<AppAction>) => void }) {
  const { dispatch } = useAppContext()
  onCapture(dispatch)
  return null
}

function QueueCountDisplay() {
  const { state } = useAppContext()
  return <span data-testid="queue-count">{state.sceneQueue.length}</span>
}

function DrawerStateDisplay() {
  const { state } = useAppContext()
  return (
    <span data-testid="drawer-open">{state.drawerState.isOpen ? 'open' : 'closed'}</span>
  )
}

function renderWithQueue(scenesToAdd: SceneTemplate[] = []) {
  let dispatchRef!: Dispatch<AppAction>
  const result = render(
    <AppProvider>
      <DispatchCapture onCapture={(d) => { dispatchRef = d }} />
      <SceneQueuePanel />
      <QueueCountDisplay />
      <DrawerStateDisplay />
    </AppProvider>
  )
  act(() => {
    dispatchRef({
      type: 'SET_LIBRARY_DATA',
      payload: { scenes: mockScenes, environments: [], techDefaults: mockTechDefaults },
    })
    for (const scene of scenesToAdd) {
      dispatchRef({ type: 'ADD_SCENE_TO_QUEUE', payload: scene })
    }
  })
  return { ...result, getDispatch: () => dispatchRef }
}

// --- 空キューの表示 ---

describe('SceneQueuePanel - 空キューの状態', () => {
  it('キューが空の場合にメッセージが表示される', () => {
    renderWithQueue()
    expect(screen.getByText(/シーンが追加されていません/)).toBeDefined()
  })

  it('キューが空の場合にカードが表示されない', () => {
    renderWithQueue()
    expect(screen.queryByRole('list')).toBeNull()
  })
})

// --- シーンカードリスト表示 ---

describe('SceneQueuePanel - シーンカードリスト', () => {
  it('キューにシーンがある場合にカードが表示される', () => {
    renderWithQueue([mockScenes[0]])
    expect(screen.getByText('勉強しているシーン')).toBeDefined()
  })

  it('複数シーンがある場合にすべてのカードが表示される', () => {
    renderWithQueue([mockScenes[0], mockScenes[1]])
    expect(screen.getByText('勉強しているシーン')).toBeDefined()
    expect(screen.getByText('料理しているシーン')).toBeDefined()
  })

  it('リストコンテナが存在する', () => {
    renderWithQueue([mockScenes[0]])
    expect(screen.getByRole('list')).toBeDefined()
  })
})

// --- 削除操作 ---

describe('SceneQueuePanel - 削除操作', () => {
  it('削除ボタンクリックでシーンがキューから削除される', () => {
    renderWithQueue([mockScenes[0]])
    expect(screen.getByTestId('queue-count').textContent).toBe('1')
    act(() => {
      screen.getByRole('button', { name: '勉強しているシーンを削除' }).click()
    })
    expect(screen.getByTestId('queue-count').textContent).toBe('0')
  })

  it('1件削除後も残りのシーンが表示される', () => {
    renderWithQueue([mockScenes[0], mockScenes[1]])
    act(() => {
      screen.getByRole('button', { name: '勉強しているシーンを削除' }).click()
    })
    expect(screen.queryByText('勉強しているシーン')).toBeNull()
    expect(screen.getByText('料理しているシーン')).toBeDefined()
  })
})

// --- ドロワー開放 ---

describe('SceneQueuePanel - ドロワー開放', () => {
  it('カードクリックでドロワーが開く', () => {
    renderWithQueue([mockScenes[0]])
    expect(screen.getByTestId('drawer-open').textContent).toBe('closed')
    act(() => {
      screen.getByRole('button', { name: '勉強しているシーン' }).click()
    })
    expect(screen.getByTestId('drawer-open').textContent).toBe('open')
  })
})

// --- Generate ボタン ---

describe('SceneQueuePanel - Generate ボタン', () => {
  it('「作成（Generate）」ボタンが表示される', () => {
    renderWithQueue()
    expect(screen.getByRole('button', { name: /作成/ })).toBeDefined()
  })

  it('キューが空でも Generate ボタンが表示される', () => {
    renderWithQueue()
    expect(screen.getByRole('button', { name: /作成/ })).toBeDefined()
  })

  it('キューにシーンがあっても Generate ボタンが表示される', () => {
    renderWithQueue([mockScenes[0]])
    expect(screen.getByRole('button', { name: /作成/ })).toBeDefined()
  })
})

// --- 生成前バリデーション（タスク 11.1） ---

describe('SceneQueuePanel - 生成前バリデーション', () => {
  it('キューが空の状態で Generate ボタンをクリックすると警告メッセージが表示される', () => {
    renderWithQueue()
    act(() => {
      screen.getByRole('button', { name: /作成/ }).click()
    })
    expect(screen.getByText(/シーンを1件以上追加してください/)).toBeDefined()
  })

  it('キューが空の状態で Generate ボタンをクリックしても警告後もボタンは表示される', () => {
    renderWithQueue()
    act(() => {
      screen.getByRole('button', { name: /作成/ }).click()
    })
    expect(screen.getByRole('button', { name: /作成/ })).toBeDefined()
  })

  it('キューが空でない場合、技術設定が揃っていれば警告は表示されない', async () => {
    renderWithQueue([mockScenes[0]])
    await act(async () => {
      screen.getByRole('button', { name: /作成/ }).click()
    })
    expect(screen.queryByText(/シーンを1件以上追加してください/)).toBeNull()
  })

  it('技術設定の必須項目が不足している場合に未入力項目名が表示される', () => {
    let dispatchRef!: Dispatch<AppAction>
    render(
      <AppProvider>
        <DispatchCapture onCapture={(d) => { dispatchRef = d }} />
        <SceneQueuePanel />
      </AppProvider>
    )
    // techDefaults なし（null のまま）でシーンを追加
    act(() => {
      dispatchRef({ type: 'ADD_SCENE_TO_QUEUE', payload: mockScenes[0] })
    })
    act(() => {
      screen.getByRole('button', { name: /作成/ }).click()
    })
    expect(screen.getByText(/サーバーアドレス/)).toBeDefined()
  })

  it('技術設定の必須項目が不足している場合に警告メッセージが表示される', () => {
    let dispatchRef!: Dispatch<AppAction>
    render(
      <AppProvider>
        <DispatchCapture onCapture={(d) => { dispatchRef = d }} />
        <SceneQueuePanel />
      </AppProvider>
    )
    act(() => {
      dispatchRef({ type: 'ADD_SCENE_TO_QUEUE', payload: mockScenes[0] })
    })
    act(() => {
      screen.getByRole('button', { name: /作成/ }).click()
    })
    expect(screen.getByText(/未設定の必須項目があります/)).toBeDefined()
  })

  it('技術設定が揃っていてキューにシーンがある場合は警告は表示されない', async () => {
    renderWithQueue([mockScenes[0]])
    await act(async () => {
      screen.getByRole('button', { name: /作成/ }).click()
    })
    expect(screen.queryByText(/未設定の必須項目があります/)).toBeNull()
    expect(screen.queryByText(/シーンを1件以上追加してください/)).toBeNull()
  })
})

// --- ローディング状態（タスク 6） ---

describe('SceneQueuePanel - ローディング状態', () => {
  it('生成処理中はボタンが disabled になる', () => {
    let dispatchRef!: Dispatch<AppAction>
    render(
      <AppProvider>
        <DispatchCapture onCapture={(d) => { dispatchRef = d }} />
        <SceneQueuePanel />
      </AppProvider>
    )
    act(() => {
      dispatchRef({ type: 'SET_LOADING', payload: { generating: true } })
    })
    const button = screen.getByRole('button', { name: /作成/ }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })

  it('生成処理中でない場合はボタンが disabled でない', () => {
    renderWithQueue()
    const button = screen.getByRole('button', { name: /作成/ }) as HTMLButtonElement
    expect(button.disabled).toBe(false)
  })
})

// --- コンフィグ生成・ダウンロード（タスク 11.2） ---

describe('SceneQueuePanel - コンフィグ生成・ダウンロード', () => {
  it('有効な状態で Generate をクリックすると generateConfig が呼ばれる', async () => {
    renderWithQueue([mockScenes[0]])
    await act(async () => {
      screen.getByRole('button', { name: /作成/ }).click()
    })
    expect(vi.mocked(generateConfig)).toHaveBeenCalledTimes(1)
  })

  it('生成成功時に downloadBlob が YAML Blob で呼ばれる', async () => {
    const blob = new Blob(['scenes: []'], { type: 'application/yaml' })
    vi.mocked(generateConfig).mockResolvedValue(blob)

    renderWithQueue([mockScenes[0]])
    await act(async () => {
      screen.getByRole('button', { name: /作成/ }).click()
    })

    expect(vi.mocked(downloadBlob)).toHaveBeenCalledWith(blob, expect.stringContaining('.yaml'))
  })

  it('生成成功時にエラーメッセージが表示されない', async () => {
    renderWithQueue([mockScenes[0]])
    await act(async () => {
      screen.getByRole('button', { name: /作成/ }).click()
    })
    expect(screen.queryByText(/コンフィグの生成に失敗しました/)).toBeNull()
  })

  it('ApiError (422) 発生時にエラーメッセージが表示される', async () => {
    vi.mocked(generateConfig).mockRejectedValue(
      new ApiError(422, 'Unprocessable Entity', { detail: 'schema error' })
    )

    renderWithQueue([mockScenes[0]])
    await act(async () => {
      screen.getByRole('button', { name: /作成/ }).click()
    })

    await waitFor(() => {
      expect(screen.getByText(/コンフィグの生成に失敗しました/)).toBeDefined()
    })
  })

  it('ApiError 発生時に downloadBlob が呼ばれない', async () => {
    vi.mocked(generateConfig).mockRejectedValue(
      new ApiError(500, 'Internal Server Error')
    )

    renderWithQueue([mockScenes[0]])
    await act(async () => {
      screen.getByRole('button', { name: /作成/ }).click()
    })

    await waitFor(() => {
      expect(vi.mocked(downloadBlob)).not.toHaveBeenCalled()
    })
  })

  it('キューが空の場合は generateConfig が呼ばれない', async () => {
    renderWithQueue()
    await act(async () => {
      screen.getByRole('button', { name: /作成/ }).click()
    })
    expect(vi.mocked(generateConfig)).not.toHaveBeenCalled()
  })
})
