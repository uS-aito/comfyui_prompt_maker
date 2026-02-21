/**
 * TypeScript 型定義テスト (タスク 6.1)
 *
 * TDD: 型ファイルが存在しない状態で実行すると import エラーになる（RED）
 * 型ファイルを作成した後に全テストが通る（GREEN）
 */

import type {
  SceneTemplate,
  SceneOverrides,
  SceneQueueItem,
} from '../scene'

import type { Environment } from '../environment'

import type {
  ComfyUIConfig,
  WorkflowConfigParams,
  DefaultPrompts,
  TechDefaults,
  TechSettingsOverrides,
  GlobalSettings,
  DrawerState,
  LoadingState,
} from '../settings'

import type { GenerateRequest } from '../api'

// --- SceneTemplate ---

describe('SceneTemplate', () => {
  it('必須フィールドを持つ SceneTemplate を作成できる', () => {
    const scene: SceneTemplate = {
      name: 'studying',
      displayName: '勉強しているシーン',
      positivePrompt: 'sitting at desk, studying',
      negativePrompt: 'lowres',
      batchSize: 1,
      previewImageUrl: null,
    }
    expect(scene.name).toBe('studying')
    expect(scene.batchSize).toBe(1)
    expect(scene.previewImageUrl).toBeNull()
  })

  it('previewImageUrl に string を設定できる', () => {
    const scene: SceneTemplate = {
      name: 'outdoor',
      displayName: '屋外',
      positivePrompt: 'park, sunny',
      negativePrompt: '',
      batchSize: 2,
      previewImageUrl: '/api/images/scenes/outdoor.jpg',
    }
    expect(scene.previewImageUrl).toBe('/api/images/scenes/outdoor.jpg')
  })
})

// --- SceneOverrides ---

describe('SceneOverrides', () => {
  it('空の SceneOverrides を作成できる（全フィールドがオプショナル）', () => {
    const overrides: SceneOverrides = {}
    expect(overrides).toBeDefined()
  })

  it('部分的な SceneOverrides を作成できる', () => {
    const overrides: SceneOverrides = {
      positivePrompt: 'custom prompt',
      batchSize: 3,
    }
    expect(overrides.positivePrompt).toBe('custom prompt')
    expect(overrides.name).toBeUndefined()
  })

  it('全フィールドを持つ SceneOverrides を作成できる', () => {
    const overrides: SceneOverrides = {
      name: 'custom name',
      positivePrompt: 'custom positive',
      negativePrompt: 'custom negative',
      batchSize: 5,
    }
    expect(overrides.batchSize).toBe(5)
  })
})

// --- SceneQueueItem ---

describe('SceneQueueItem', () => {
  it('SceneQueueItem を作成できる', () => {
    const item: SceneQueueItem = {
      id: 'uuid-1234',
      templateName: 'studying',
      displayName: '勉強しているシーン',
      overrides: {},
    }
    expect(item.id).toBe('uuid-1234')
    expect(item.overrides).toEqual({})
  })

  it('overrides を持つ SceneQueueItem を作成できる', () => {
    const item: SceneQueueItem = {
      id: 'uuid-5678',
      templateName: 'outdoor',
      displayName: '屋外',
      overrides: { batchSize: 4 },
    }
    expect(item.overrides.batchSize).toBe(4)
  })
})

// --- Environment ---

describe('Environment', () => {
  it('thumbnailUrl が null の Environment を作成できる', () => {
    const env: Environment = {
      name: 'indoor',
      displayName: '室内',
      environmentPrompt: 'indoor room, soft lighting',
      thumbnailUrl: null,
    }
    expect(env.name).toBe('indoor')
    expect(env.thumbnailUrl).toBeNull()
  })

  it('thumbnailUrl を持つ Environment を作成できる', () => {
    const env: Environment = {
      name: 'outdoor',
      displayName: '屋外',
      environmentPrompt: 'outdoor, sunny',
      thumbnailUrl: '/api/images/thumbnails/outdoor.jpg',
    }
    expect(env.thumbnailUrl).toBe('/api/images/thumbnails/outdoor.jpg')
  })
})

// --- ComfyUIConfig ---

describe('ComfyUIConfig', () => {
  it('ComfyUIConfig を作成できる', () => {
    const config: ComfyUIConfig = {
      serverAddress: '127.0.0.1:8188',
      clientId: 't2i_client',
    }
    expect(config.serverAddress).toBe('127.0.0.1:8188')
    expect(config.clientId).toBe('t2i_client')
  })
})

// --- DefaultPrompts ---

describe('DefaultPrompts', () => {
  it('DefaultPrompts を作成できる', () => {
    const defaults: DefaultPrompts = {
      basePositivePrompt: 'masterpiece, best quality',
      environmentPrompt: '',
      positivePrompt: '',
      negativePrompt: 'lowres, bad anatomy',
      batchSize: 1,
    }
    expect(defaults.batchSize).toBe(1)
    expect(defaults.basePositivePrompt).toBe('masterpiece, best quality')
  })
})

// --- WorkflowConfigParams ---

describe('WorkflowConfigParams', () => {
  it('WorkflowConfigParams を作成できる', () => {
    const params: WorkflowConfigParams = {
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
    }
    expect(params.seedNodeId).toBe(164)
    expect(params.defaultPrompts.batchSize).toBe(1)
  })
})

// --- TechDefaults ---

describe('TechDefaults', () => {
  it('TechDefaults を作成できる', () => {
    const defaults: TechDefaults = {
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
    expect(defaults.comfyuiConfig.serverAddress).toBe('127.0.0.1:8188')
  })
})

// --- TechSettingsOverrides ---

describe('TechSettingsOverrides', () => {
  it('空の TechSettingsOverrides を作成できる', () => {
    const overrides: TechSettingsOverrides = {
      comfyuiConfig: {},
      workflowConfig: {},
    }
    expect(overrides.comfyuiConfig).toEqual({})
    expect(overrides.workflowConfig).toEqual({})
  })

  it('部分的な TechSettingsOverrides を作成できる', () => {
    const overrides: TechSettingsOverrides = {
      comfyuiConfig: { serverAddress: 'custom:8188' },
      workflowConfig: { seedNodeId: 999 },
    }
    expect(overrides.comfyuiConfig.serverAddress).toBe('custom:8188')
    expect(overrides.workflowConfig.seedNodeId).toBe(999)
  })
})

// --- GlobalSettings ---

describe('GlobalSettings', () => {
  it('GlobalSettings を作成できる', () => {
    const settings: GlobalSettings = {
      characterName: 'Haru',
      selectedEnvironment: null,
    }
    expect(settings.characterName).toBe('Haru')
    expect(settings.selectedEnvironment).toBeNull()
  })

  it('selectedEnvironment を持つ GlobalSettings を作成できる', () => {
    const env: Environment = {
      name: 'indoor',
      displayName: '室内',
      environmentPrompt: 'indoor room',
      thumbnailUrl: null,
    }
    const settings: GlobalSettings = {
      characterName: 'Haru',
      selectedEnvironment: env,
    }
    expect(settings.selectedEnvironment?.name).toBe('indoor')
  })
})

// --- DrawerState ---

describe('DrawerState', () => {
  it('ドロワーが閉じている状態を作成できる', () => {
    const state: DrawerState = {
      isOpen: false,
      sceneId: null,
    }
    expect(state.isOpen).toBe(false)
    expect(state.sceneId).toBeNull()
  })

  it('ドロワーが開いている状態を作成できる', () => {
    const state: DrawerState = {
      isOpen: true,
      sceneId: 'uuid-1234',
    }
    expect(state.isOpen).toBe(true)
    expect(state.sceneId).toBe('uuid-1234')
  })
})

// --- LoadingState ---

describe('LoadingState', () => {
  it('全て false の LoadingState を作成できる', () => {
    const state: LoadingState = {
      library: false,
      generating: false,
    }
    expect(state.library).toBe(false)
    expect(state.generating).toBe(false)
  })
})

// --- GenerateRequest ---

describe('GenerateRequest', () => {
  it('GenerateRequest を作成できる', () => {
    const request: GenerateRequest = {
      globalSettings: {
        characterName: 'Haru',
        environmentName: 'indoor',
        environmentPrompt: 'indoor room, soft lighting',
      },
      techSettings: {
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
      },
      scenes: [
        {
          templateName: 'studying',
          overrides: { batchSize: 2 },
        },
      ],
    }
    expect(request.globalSettings.characterName).toBe('Haru')
    expect(request.scenes).toHaveLength(1)
    expect(request.scenes[0].overrides.batchSize).toBe(2)
  })
})
