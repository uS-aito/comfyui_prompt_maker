/**
 * appReducer ユニットテスト (タスク 6.2)
 *
 * 各 AppAction ごとの状態遷移を検証する
 */

import { appReducer, type AppState, type AppAction } from '../reducer'
import { initialState } from '../initialState'
import type { SceneTemplate } from '../../types/scene'
import type { Environment } from '../../types/environment'
import type { TechDefaults, TechSettingsOverrides } from '../../types/settings'

// テスト用フィクスチャ
const mockScene: SceneTemplate = {
  name: 'studying',
  displayName: '勉強しているシーン',
  positivePrompt: 'sitting at desk, studying',
  negativePrompt: 'lowres',
  batchSize: 1,
  previewImageUrl: null,
}

const mockScene2: SceneTemplate = {
  name: 'outdoor',
  displayName: '屋外シーン',
  positivePrompt: 'outdoor, park',
  negativePrompt: '',
  batchSize: 2,
  previewImageUrl: '/api/images/scenes/outdoor.jpg',
}

const mockEnvironment: Environment = {
  name: 'indoor',
  displayName: '室内',
  environmentPrompt: 'indoor room, soft lighting',
  thumbnailUrl: null,
}

const mockTechDefaults: TechDefaults = {
  comfyuiConfig: {
    serverAddress: '127.0.0.1:8188',
    clientId: 't2i_client',
  },
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

// --- 初期状態 ---

describe('appReducer - 初期状態', () => {
  it('undefined な state に対して initialState を返す', () => {
    const action: AppAction = { type: 'SET_ERROR', payload: null }
    const state = appReducer(initialState, action)
    expect(state.scenes).toEqual([])
    expect(state.environments).toEqual([])
    expect(state.techDefaults).toBeNull()
    expect(state.sceneQueue).toEqual([])
    expect(state.error).toBeNull()
  })

  it('initialState の globalSettings が空のデフォルト値を持つ', () => {
    expect(initialState.globalSettings.characterName).toBe('')
    expect(initialState.globalSettings.selectedEnvironment).toBeNull()
  })

  it('initialState の drawerState が閉じている', () => {
    expect(initialState.drawerState.isOpen).toBe(false)
    expect(initialState.drawerState.sceneId).toBeNull()
  })

  it('initialState の loadingState が全て false', () => {
    expect(initialState.loadingState.library).toBe(false)
    expect(initialState.loadingState.generating).toBe(false)
  })
})

// --- SET_LIBRARY_DATA ---

describe('SET_LIBRARY_DATA', () => {
  it('scenes, environments, techDefaults を更新する', () => {
    const state = appReducer(initialState, {
      type: 'SET_LIBRARY_DATA',
      payload: {
        scenes: [mockScene],
        environments: [mockEnvironment],
        techDefaults: mockTechDefaults,
      },
    })
    expect(state.scenes).toHaveLength(1)
    expect(state.scenes[0].name).toBe('studying')
    expect(state.environments).toHaveLength(1)
    expect(state.environments[0].name).toBe('indoor')
    expect(state.techDefaults).not.toBeNull()
    expect(state.techDefaults?.comfyuiConfig.serverAddress).toBe('127.0.0.1:8188')
  })

  it('他の状態フィールドを変更しない', () => {
    const stateWithQueue = appReducer(initialState, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene,
    })
    const state = appReducer(stateWithQueue, {
      type: 'SET_LIBRARY_DATA',
      payload: { scenes: [mockScene], environments: [], techDefaults: mockTechDefaults },
    })
    expect(state.sceneQueue).toHaveLength(1)
  })
})

// --- SET_CHARACTER_NAME ---

describe('SET_CHARACTER_NAME', () => {
  it('globalSettings.characterName を更新する', () => {
    const state = appReducer(initialState, {
      type: 'SET_CHARACTER_NAME',
      payload: 'Haru',
    })
    expect(state.globalSettings.characterName).toBe('Haru')
  })

  it('globalSettings の他のフィールドを変更しない', () => {
    const stateWithEnv = appReducer(initialState, {
      type: 'SELECT_ENVIRONMENT',
      payload: mockEnvironment,
    })
    const state = appReducer(stateWithEnv, {
      type: 'SET_CHARACTER_NAME',
      payload: 'Haru',
    })
    expect(state.globalSettings.selectedEnvironment?.name).toBe('indoor')
  })

  it('空文字に更新できる', () => {
    const stateWithName = appReducer(initialState, {
      type: 'SET_CHARACTER_NAME',
      payload: 'Haru',
    })
    const state = appReducer(stateWithName, {
      type: 'SET_CHARACTER_NAME',
      payload: '',
    })
    expect(state.globalSettings.characterName).toBe('')
  })
})

// --- SELECT_ENVIRONMENT ---

describe('SELECT_ENVIRONMENT', () => {
  it('globalSettings.selectedEnvironment を更新する', () => {
    const state = appReducer(initialState, {
      type: 'SELECT_ENVIRONMENT',
      payload: mockEnvironment,
    })
    expect(state.globalSettings.selectedEnvironment?.name).toBe('indoor')
  })

  it('null を設定してクリアできる', () => {
    const stateWithEnv = appReducer(initialState, {
      type: 'SELECT_ENVIRONMENT',
      payload: mockEnvironment,
    })
    const state = appReducer(stateWithEnv, {
      type: 'SELECT_ENVIRONMENT',
      payload: null,
    })
    expect(state.globalSettings.selectedEnvironment).toBeNull()
  })
})

// --- UPDATE_TECH_OVERRIDE ---

describe('UPDATE_TECH_OVERRIDE', () => {
  it('techSettingsOverrides を更新する', () => {
    const overrides: TechSettingsOverrides = {
      comfyuiConfig: { serverAddress: 'custom:8188' },
      workflowConfig: { seedNodeId: 999 },
    }
    const state = appReducer(initialState, {
      type: 'UPDATE_TECH_OVERRIDE',
      payload: overrides,
    })
    expect(state.techSettingsOverrides.comfyuiConfig.serverAddress).toBe('custom:8188')
    expect(state.techSettingsOverrides.workflowConfig.seedNodeId).toBe(999)
  })

  it('空の overrides でリセットできる', () => {
    const stateWithOverrides = appReducer(initialState, {
      type: 'UPDATE_TECH_OVERRIDE',
      payload: { comfyuiConfig: { serverAddress: 'custom:8188' }, workflowConfig: {} },
    })
    const state = appReducer(stateWithOverrides, {
      type: 'UPDATE_TECH_OVERRIDE',
      payload: { comfyuiConfig: {}, workflowConfig: {} },
    })
    expect(state.techSettingsOverrides.comfyuiConfig).toEqual({})
  })
})

// --- ADD_SCENE_TO_QUEUE ---

describe('ADD_SCENE_TO_QUEUE', () => {
  it('シーンをキューに追加する', () => {
    const state = appReducer(initialState, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene,
    })
    expect(state.sceneQueue).toHaveLength(1)
    expect(state.sceneQueue[0].templateName).toBe('studying')
    expect(state.sceneQueue[0].displayName).toBe('勉強しているシーン')
    expect(state.sceneQueue[0].overrides).toEqual({})
  })

  it('追加されたアイテムにユニーク id が付与される', () => {
    const state = appReducer(initialState, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene,
    })
    expect(state.sceneQueue[0].id).toBeTruthy()
    expect(typeof state.sceneQueue[0].id).toBe('string')
  })

  it('複数回追加するとキューが増える', () => {
    let state = appReducer(initialState, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene,
    })
    state = appReducer(state, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene2,
    })
    expect(state.sceneQueue).toHaveLength(2)
    expect(state.sceneQueue[1].templateName).toBe('outdoor')
  })

  it('同じシーンテンプレートを複数追加すると各アイテムの id が異なる', () => {
    let state = appReducer(initialState, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene,
    })
    state = appReducer(state, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene,
    })
    expect(state.sceneQueue[0].id).not.toBe(state.sceneQueue[1].id)
  })
})

// --- REMOVE_SCENE_FROM_QUEUE ---

describe('REMOVE_SCENE_FROM_QUEUE', () => {
  it('指定した id のシーンをキューから削除する', () => {
    const stateWithScene = appReducer(initialState, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene,
    })
    const itemId = stateWithScene.sceneQueue[0].id
    const state = appReducer(stateWithScene, {
      type: 'REMOVE_SCENE_FROM_QUEUE',
      payload: itemId,
    })
    expect(state.sceneQueue).toHaveLength(0)
  })

  it('複数アイテムがある場合に該当 id のみ削除する', () => {
    let state = appReducer(initialState, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene,
    })
    state = appReducer(state, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene2,
    })
    const firstId = state.sceneQueue[0].id
    state = appReducer(state, {
      type: 'REMOVE_SCENE_FROM_QUEUE',
      payload: firstId,
    })
    expect(state.sceneQueue).toHaveLength(1)
    expect(state.sceneQueue[0].templateName).toBe('outdoor')
  })

  it('存在しない id の場合はキューを変更しない', () => {
    const stateWithScene = appReducer(initialState, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene,
    })
    const state = appReducer(stateWithScene, {
      type: 'REMOVE_SCENE_FROM_QUEUE',
      payload: 'non-existent-id',
    })
    expect(state.sceneQueue).toHaveLength(1)
  })
})

// --- UPDATE_SCENE_OVERRIDE ---

describe('UPDATE_SCENE_OVERRIDE', () => {
  it('指定した id のシーンの overrides を更新する', () => {
    const stateWithScene = appReducer(initialState, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene,
    })
    const itemId = stateWithScene.sceneQueue[0].id
    const state = appReducer(stateWithScene, {
      type: 'UPDATE_SCENE_OVERRIDE',
      payload: {
        id: itemId,
        overrides: { positivePrompt: 'custom prompt', batchSize: 3 },
      },
    })
    expect(state.sceneQueue[0].overrides.positivePrompt).toBe('custom prompt')
    expect(state.sceneQueue[0].overrides.batchSize).toBe(3)
  })

  it('他のシーンの overrides を変更しない', () => {
    let state = appReducer(initialState, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene,
    })
    state = appReducer(state, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene2,
    })
    const firstId = state.sceneQueue[0].id
    state = appReducer(state, {
      type: 'UPDATE_SCENE_OVERRIDE',
      payload: { id: firstId, overrides: { batchSize: 5 } },
    })
    expect(state.sceneQueue[1].overrides).toEqual({})
  })

  it('存在しない id の場合はキューを変更しない', () => {
    const stateWithScene = appReducer(initialState, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene,
    })
    const state = appReducer(stateWithScene, {
      type: 'UPDATE_SCENE_OVERRIDE',
      payload: { id: 'non-existent', overrides: { batchSize: 10 } },
    })
    expect(state.sceneQueue[0].overrides).toEqual({})
  })
})

// --- OPEN_DRAWER ---

describe('OPEN_DRAWER', () => {
  it('drawerState を開いた状態に更新する', () => {
    const state = appReducer(initialState, {
      type: 'OPEN_DRAWER',
      payload: 'uuid-1234',
    })
    expect(state.drawerState.isOpen).toBe(true)
    expect(state.drawerState.sceneId).toBe('uuid-1234')
  })
})

// --- CLOSE_DRAWER ---

describe('CLOSE_DRAWER', () => {
  it('drawerState を閉じた状態に更新する', () => {
    const stateOpen = appReducer(initialState, {
      type: 'OPEN_DRAWER',
      payload: 'uuid-1234',
    })
    const state = appReducer(stateOpen, { type: 'CLOSE_DRAWER' })
    expect(state.drawerState.isOpen).toBe(false)
    expect(state.drawerState.sceneId).toBeNull()
  })
})

// --- SET_LOADING ---

describe('SET_LOADING', () => {
  it('library ローディングを true に設定する', () => {
    const state = appReducer(initialState, {
      type: 'SET_LOADING',
      payload: { library: true },
    })
    expect(state.loadingState.library).toBe(true)
    expect(state.loadingState.generating).toBe(false)
  })

  it('generating ローディングを true に設定する', () => {
    const state = appReducer(initialState, {
      type: 'SET_LOADING',
      payload: { generating: true },
    })
    expect(state.loadingState.generating).toBe(true)
    expect(state.loadingState.library).toBe(false)
  })

  it('複数フィールドを同時に更新できる', () => {
    const state = appReducer(initialState, {
      type: 'SET_LOADING',
      payload: { library: true, generating: true },
    })
    expect(state.loadingState.library).toBe(true)
    expect(state.loadingState.generating).toBe(true)
  })
})

// --- SET_ERROR ---

describe('SET_ERROR', () => {
  it('error メッセージを設定する', () => {
    const state = appReducer(initialState, {
      type: 'SET_ERROR',
      payload: 'ライブラリの取得に失敗しました',
    })
    expect(state.error).toBe('ライブラリの取得に失敗しました')
  })

  it('null でエラーをクリアする', () => {
    const stateWithError = appReducer(initialState, {
      type: 'SET_ERROR',
      payload: 'some error',
    })
    const state = appReducer(stateWithError, {
      type: 'SET_ERROR',
      payload: null,
    })
    expect(state.error).toBeNull()
  })
})

// --- イミュータビリティ ---

describe('イミュータビリティ', () => {
  it('reducer は元の state オブジェクトを変更しない', () => {
    const originalState: AppState = { ...initialState }
    appReducer(initialState, {
      type: 'SET_CHARACTER_NAME',
      payload: 'Haru',
    })
    expect(initialState.globalSettings.characterName).toBe(originalState.globalSettings.characterName)
  })

  it('sceneQueue は新しい配列参照を返す', () => {
    const state = appReducer(initialState, {
      type: 'ADD_SCENE_TO_QUEUE',
      payload: mockScene,
    })
    expect(state.sceneQueue).not.toBe(initialState.sceneQueue)
  })
})
