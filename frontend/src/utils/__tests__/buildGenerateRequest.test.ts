/**
 * buildGenerateRequest ユニットテスト（タスク 11.2）
 *
 * AppState から GenerateRequest を組み立てる処理を検証する
 * - globalSettings の characterName・環境情報が正しくマッピングされる
 * - techDefaults と techSettingsOverrides のマージロジックを検証する
 * - overrides が defaults より優先されることを検証する
 * - sceneQueue が scenes 配列に変換されることを検証する
 */

import { describe, it, expect } from 'vitest'
import { buildGenerateRequest } from '../buildGenerateRequest'
import type { AppState } from '../../state/reducer'
import type { TechDefaults, TechSettingsOverrides } from '../../types/settings'
import type { Environment } from '../../types/environment'
import { initialState } from '../../state/initialState'

// --- テスト用フィクスチャ ---

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

const emptyOverrides: TechSettingsOverrides = {
  comfyuiConfig: {},
  workflowConfig: {},
}

function buildState(partial: Partial<AppState>): AppState {
  return {
    ...initialState,
    techDefaults: mockTechDefaults,
    ...partial,
  }
}

// --- globalSettings のマッピング ---

describe('buildGenerateRequest - globalSettings', () => {
  it('characterName が正しくマッピングされる', () => {
    const state = buildState({
      globalSettings: { characterName: 'Haru', selectedEnvironment: null },
    })
    const req = buildGenerateRequest(state)
    expect(req.globalSettings.characterName).toBe('Haru')
  })

  it('selectedEnvironment がある場合 environmentName が設定される', () => {
    const state = buildState({
      globalSettings: { characterName: '', selectedEnvironment: mockEnvironment },
    })
    const req = buildGenerateRequest(state)
    expect(req.globalSettings.environmentName).toBe('indoor')
  })

  it('selectedEnvironment がある場合 environmentPrompt が設定される', () => {
    const state = buildState({
      globalSettings: { characterName: '', selectedEnvironment: mockEnvironment },
    })
    const req = buildGenerateRequest(state)
    expect(req.globalSettings.environmentPrompt).toBe('indoor room, soft lighting')
  })

  it('selectedEnvironment が null の場合 environmentName は空文字になる', () => {
    const state = buildState({
      globalSettings: { characterName: '', selectedEnvironment: null },
    })
    const req = buildGenerateRequest(state)
    expect(req.globalSettings.environmentName).toBe('')
  })

  it('selectedEnvironment が null の場合 environmentPrompt は空文字になる', () => {
    const state = buildState({
      globalSettings: { characterName: '', selectedEnvironment: null },
    })
    const req = buildGenerateRequest(state)
    expect(req.globalSettings.environmentPrompt).toBe('')
  })
})

// --- techSettings のマージ（デフォルト値） ---

describe('buildGenerateRequest - techSettings（デフォルト値）', () => {
  it('オーバーライドなしの場合 comfyuiConfig はデフォルト値を使う', () => {
    const state = buildState({ techSettingsOverrides: emptyOverrides })
    const req = buildGenerateRequest(state)
    expect(req.techSettings.comfyuiConfig.serverAddress).toBe('127.0.0.1:8188')
    expect(req.techSettings.comfyuiConfig.clientId).toBe('t2i_client')
  })

  it('オーバーライドなしの場合 workflowConfig のパス系はデフォルト値を使う', () => {
    const state = buildState({ techSettingsOverrides: emptyOverrides })
    const req = buildGenerateRequest(state)
    expect(req.techSettings.workflowConfig.workflowJsonPath).toBe('/path/to/workflow.json')
    expect(req.techSettings.workflowConfig.imageOutputPath).toBe('/path/to/output')
    expect(req.techSettings.workflowConfig.libraryFilePath).toBe('/path/to/library.yaml')
  })

  it('オーバーライドなしの場合 workflowConfig のノードIDはデフォルト値を使う', () => {
    const state = buildState({ techSettingsOverrides: emptyOverrides })
    const req = buildGenerateRequest(state)
    expect(req.techSettings.workflowConfig.seedNodeId).toBe(164)
    expect(req.techSettings.workflowConfig.batchSizeNodeId).toBe(22)
    expect(req.techSettings.workflowConfig.negativePromptNodeId).toBe(174)
    expect(req.techSettings.workflowConfig.positivePromptNodeId).toBe(257)
    expect(req.techSettings.workflowConfig.environmentPromptNodeId).toBe(303)
  })

  it('defaultPrompts はライブラリのデフォルト値を使う', () => {
    const state = buildState({ techSettingsOverrides: emptyOverrides })
    const req = buildGenerateRequest(state)
    expect(req.techSettings.workflowConfig.defaultPrompts.basePositivePrompt).toBe('masterpiece')
    expect(req.techSettings.workflowConfig.defaultPrompts.negativePrompt).toBe('lowres')
    expect(req.techSettings.workflowConfig.defaultPrompts.batchSize).toBe(1)
  })
})

// --- techSettings のマージ（オーバーライド優先） ---

describe('buildGenerateRequest - techSettings（オーバーライド優先）', () => {
  it('comfyuiConfig の serverAddress はオーバーライドが優先される', () => {
    const state = buildState({
      techSettingsOverrides: {
        comfyuiConfig: { serverAddress: '192.168.1.100:8188' },
        workflowConfig: {},
      },
    })
    const req = buildGenerateRequest(state)
    expect(req.techSettings.comfyuiConfig.serverAddress).toBe('192.168.1.100:8188')
  })

  it('comfyuiConfig の clientId はオーバーライドが優先される', () => {
    const state = buildState({
      techSettingsOverrides: {
        comfyuiConfig: { clientId: 'custom_client' },
        workflowConfig: {},
      },
    })
    const req = buildGenerateRequest(state)
    expect(req.techSettings.comfyuiConfig.clientId).toBe('custom_client')
  })

  it('workflowConfig のパス系はオーバーライドが優先される', () => {
    const state = buildState({
      techSettingsOverrides: {
        comfyuiConfig: {},
        workflowConfig: { workflowJsonPath: '/custom/workflow.json' },
      },
    })
    const req = buildGenerateRequest(state)
    expect(req.techSettings.workflowConfig.workflowJsonPath).toBe('/custom/workflow.json')
  })

  it('workflowConfig のノードIDはオーバーライドが優先される', () => {
    const state = buildState({
      techSettingsOverrides: {
        comfyuiConfig: {},
        workflowConfig: { seedNodeId: 999 },
      },
    })
    const req = buildGenerateRequest(state)
    expect(req.techSettings.workflowConfig.seedNodeId).toBe(999)
  })

  it('オーバーライドされていないフィールドはデフォルト値を維持する', () => {
    const state = buildState({
      techSettingsOverrides: {
        comfyuiConfig: { serverAddress: '192.168.1.100:8188' },
        workflowConfig: {},
      },
    })
    const req = buildGenerateRequest(state)
    // serverAddress はオーバーライド
    expect(req.techSettings.comfyuiConfig.serverAddress).toBe('192.168.1.100:8188')
    // clientId はデフォルト値のまま
    expect(req.techSettings.comfyuiConfig.clientId).toBe('t2i_client')
  })
})

// --- scenes のマッピング ---

describe('buildGenerateRequest - scenes', () => {
  it('sceneQueue が scenes 配列に変換される', () => {
    const state = buildState({
      sceneQueue: [
        { id: 'uuid-1', templateName: 'studying', displayName: '勉強', overrides: {} },
        { id: 'uuid-2', templateName: 'cooking', displayName: '料理', overrides: {} },
      ],
    })
    const req = buildGenerateRequest(state)
    expect(req.scenes).toHaveLength(2)
    expect(req.scenes[0].templateName).toBe('studying')
    expect(req.scenes[1].templateName).toBe('cooking')
  })

  it('sceneQueue の overrides が scenes に含まれる', () => {
    const state = buildState({
      sceneQueue: [
        {
          id: 'uuid-1',
          templateName: 'studying',
          displayName: '勉強',
          overrides: { batchSize: 3, positivePrompt: 'custom prompt' },
        },
      ],
    })
    const req = buildGenerateRequest(state)
    expect(req.scenes[0].overrides.batchSize).toBe(3)
    expect(req.scenes[0].overrides.positivePrompt).toBe('custom prompt')
  })

  it('sceneQueue が空の場合 scenes は空配列になる', () => {
    const state = buildState({ sceneQueue: [] })
    const req = buildGenerateRequest(state)
    expect(req.scenes).toEqual([])
  })
})

// --- techDefaults が null の場合 ---

describe('buildGenerateRequest - techDefaults が null の場合', () => {
  it('オーバーライドで全フィールドが指定されていれば正しく組み立てられる', () => {
    const state: AppState = {
      ...initialState,
      techDefaults: null,
      techSettingsOverrides: {
        comfyuiConfig: { serverAddress: '127.0.0.1:8188', clientId: 'client' },
        workflowConfig: {
          workflowJsonPath: '/w.json',
          imageOutputPath: '/out',
          libraryFilePath: '/lib.yaml',
          seedNodeId: 1,
          batchSizeNodeId: 2,
          negativePromptNodeId: 3,
          positivePromptNodeId: 4,
          environmentPromptNodeId: 5,
        },
      },
    }
    const req = buildGenerateRequest(state)
    expect(req.techSettings.comfyuiConfig.serverAddress).toBe('127.0.0.1:8188')
    expect(req.techSettings.workflowConfig.workflowJsonPath).toBe('/w.json')
  })
})
