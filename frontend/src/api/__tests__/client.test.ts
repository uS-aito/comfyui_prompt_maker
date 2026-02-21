/**
 * API クライアント ユニットテスト (タスク 6.3)
 *
 * fetch をモックして各エンドポイントの成功・失敗を検証する
 */

import { fetchScenes, fetchEnvironments, fetchTechDefaults, generateConfig, ApiError } from '../client'
import type { GenerateRequest } from '../../types/api'

// fetch モックのヘルパー
function mockFetchOk(body: unknown, contentType = 'application/json'): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(body),
    blob: () => Promise.resolve(new Blob([JSON.stringify(body)], { type: contentType })),
  })
}

function mockFetchError(status: number, statusText: string, body?: unknown): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve(body ?? { detail: statusText }),
  })
}

// バックエンドの snake_case レスポンスフィクスチャ
const rawScene = {
  name: 'studying',
  display_name: '勉強しているシーン',
  positive_prompt: 'sitting at desk, studying',
  negative_prompt: 'lowres',
  batch_size: 1,
  preview_image_url: null,
}

const rawSceneWithImage = {
  name: 'outdoor',
  display_name: '屋外シーン',
  positive_prompt: 'outdoor, park',
  negative_prompt: '',
  batch_size: 2,
  preview_image_url: '/api/images/scenes/outdoor.jpg',
}

const rawEnvironment = {
  name: 'indoor',
  display_name: '室内',
  environment_prompt: 'indoor room, soft lighting',
  thumbnail_url: null,
}

const rawEnvironmentWithThumb = {
  name: 'outdoor',
  display_name: '屋外',
  environment_prompt: 'outdoor sunny',
  thumbnail_url: '/api/images/thumbnails/outdoor.jpg',
}

const rawTechDefaults = {
  comfyui_config: {
    server_address: '127.0.0.1:8188',
    client_id: 't2i_client',
  },
  workflow_config: {
    workflow_json_path: '/path/to/workflow.json',
    image_output_path: '/path/to/output',
    library_file_path: '/path/to/library.yaml',
    seed_node_id: 164,
    batch_size_node_id: 22,
    negative_prompt_node_id: 174,
    positive_prompt_node_id: 257,
    environment_prompt_node_id: 303,
    default_prompts: {
      base_positive_prompt: 'masterpiece, best quality',
      environment_prompt: '',
      positive_prompt: '',
      negative_prompt: 'lowres, bad anatomy',
      batch_size: 1,
    },
  },
}

const sampleGenerateRequest: GenerateRequest = {
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

afterEach(() => {
  vi.unstubAllGlobals()
})

// --- ApiError ---

describe('ApiError', () => {
  it('ApiError は Error のインスタンス', () => {
    const err = new ApiError(404, 'Not Found')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ApiError)
  })

  it('status と message を保持する', () => {
    const err = new ApiError(422, 'Unprocessable Entity', { detail: 'schema error' })
    expect(err.status).toBe(422)
    expect(err.message).toBe('Unprocessable Entity')
    expect(err.detail).toEqual({ detail: 'schema error' })
  })

  it('detail なしでも作成できる', () => {
    const err = new ApiError(500, 'Internal Server Error')
    expect(err.detail).toBeUndefined()
  })
})

// --- fetchScenes ---

describe('fetchScenes', () => {
  it('GET /api/scenes を呼び出して SceneTemplate[] を返す', async () => {
    vi.stubGlobal('fetch', mockFetchOk([rawScene, rawSceneWithImage]))

    const scenes = await fetchScenes()

    expect(fetch).toHaveBeenCalledWith('/api/scenes')
    expect(scenes).toHaveLength(2)
  })

  it('snake_case レスポンスを camelCase に変換する', async () => {
    vi.stubGlobal('fetch', mockFetchOk([rawScene]))

    const scenes = await fetchScenes()

    expect(scenes[0].name).toBe('studying')
    expect(scenes[0].displayName).toBe('勉強しているシーン')
    expect(scenes[0].positivePrompt).toBe('sitting at desk, studying')
    expect(scenes[0].negativePrompt).toBe('lowres')
    expect(scenes[0].batchSize).toBe(1)
    expect(scenes[0].previewImageUrl).toBeNull()
  })

  it('previewImageUrl を正しく変換する', async () => {
    vi.stubGlobal('fetch', mockFetchOk([rawSceneWithImage]))

    const scenes = await fetchScenes()

    expect(scenes[0].previewImageUrl).toBe('/api/images/scenes/outdoor.jpg')
  })

  it('エラーレスポンスで ApiError をスローする', async () => {
    vi.stubGlobal('fetch', mockFetchError(500, 'Internal Server Error'))

    await expect(fetchScenes()).rejects.toThrow(ApiError)
  })

  it('500 エラーの status を正しく設定する', async () => {
    vi.stubGlobal('fetch', mockFetchError(500, 'Internal Server Error'))

    const error = await fetchScenes().catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(500)
  })
})

// --- fetchEnvironments ---

describe('fetchEnvironments', () => {
  it('GET /api/environments を呼び出して Environment[] を返す', async () => {
    vi.stubGlobal('fetch', mockFetchOk([rawEnvironment, rawEnvironmentWithThumb]))

    const environments = await fetchEnvironments()

    expect(fetch).toHaveBeenCalledWith('/api/environments')
    expect(environments).toHaveLength(2)
  })

  it('snake_case レスポンスを camelCase に変換する', async () => {
    vi.stubGlobal('fetch', mockFetchOk([rawEnvironment]))

    const environments = await fetchEnvironments()

    expect(environments[0].name).toBe('indoor')
    expect(environments[0].displayName).toBe('室内')
    expect(environments[0].environmentPrompt).toBe('indoor room, soft lighting')
    expect(environments[0].thumbnailUrl).toBeNull()
  })

  it('thumbnailUrl を正しく変換する', async () => {
    vi.stubGlobal('fetch', mockFetchOk([rawEnvironmentWithThumb]))

    const environments = await fetchEnvironments()

    expect(environments[0].thumbnailUrl).toBe('/api/images/thumbnails/outdoor.jpg')
  })

  it('エラーレスポンスで ApiError をスローする', async () => {
    vi.stubGlobal('fetch', mockFetchError(500, 'Internal Server Error'))

    await expect(fetchEnvironments()).rejects.toThrow(ApiError)
  })
})

// --- fetchTechDefaults ---

describe('fetchTechDefaults', () => {
  it('GET /api/settings/defaults を呼び出して TechDefaults を返す', async () => {
    vi.stubGlobal('fetch', mockFetchOk(rawTechDefaults))

    const defaults = await fetchTechDefaults()

    expect(fetch).toHaveBeenCalledWith('/api/settings/defaults')
    expect(defaults).toBeDefined()
  })

  it('comfyui_config を camelCase に変換する', async () => {
    vi.stubGlobal('fetch', mockFetchOk(rawTechDefaults))

    const defaults = await fetchTechDefaults()

    expect(defaults.comfyuiConfig.serverAddress).toBe('127.0.0.1:8188')
    expect(defaults.comfyuiConfig.clientId).toBe('t2i_client')
  })

  it('workflow_config を camelCase に変換する', async () => {
    vi.stubGlobal('fetch', mockFetchOk(rawTechDefaults))

    const defaults = await fetchTechDefaults()

    expect(defaults.workflowConfig.workflowJsonPath).toBe('/path/to/workflow.json')
    expect(defaults.workflowConfig.imageOutputPath).toBe('/path/to/output')
    expect(defaults.workflowConfig.libraryFilePath).toBe('/path/to/library.yaml')
    expect(defaults.workflowConfig.seedNodeId).toBe(164)
    expect(defaults.workflowConfig.batchSizeNodeId).toBe(22)
    expect(defaults.workflowConfig.negativePromptNodeId).toBe(174)
    expect(defaults.workflowConfig.positivePromptNodeId).toBe(257)
    expect(defaults.workflowConfig.environmentPromptNodeId).toBe(303)
  })

  it('default_prompts を camelCase に変換する', async () => {
    vi.stubGlobal('fetch', mockFetchOk(rawTechDefaults))

    const defaults = await fetchTechDefaults()

    expect(defaults.workflowConfig.defaultPrompts.basePositivePrompt).toBe('masterpiece, best quality')
    expect(defaults.workflowConfig.defaultPrompts.environmentPrompt).toBe('')
    expect(defaults.workflowConfig.defaultPrompts.negativePrompt).toBe('lowres, bad anatomy')
    expect(defaults.workflowConfig.defaultPrompts.batchSize).toBe(1)
  })

  it('404 エラー（未設定時）で ApiError をスローする', async () => {
    vi.stubGlobal('fetch', mockFetchError(404, 'Not Found'))

    const error = await fetchTechDefaults().catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(404)
  })
})

// --- generateConfig ---

describe('generateConfig', () => {
  it('POST /api/generate にリクエストを送信する', async () => {
    vi.stubGlobal('fetch', mockFetchOk('yaml: content', 'application/yaml'))

    await generateConfig(sampleGenerateRequest)

    expect(fetch).toHaveBeenCalledWith(
      '/api/generate',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('Content-Type: application/json ヘッダを付与する', async () => {
    vi.stubGlobal('fetch', mockFetchOk('yaml: content', 'application/yaml'))

    await generateConfig(sampleGenerateRequest)

    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(callArgs[1].headers).toEqual({ 'Content-Type': 'application/json' })
  })

  it('リクエストボディを snake_case に変換して送信する', async () => {
    vi.stubGlobal('fetch', mockFetchOk('yaml: content', 'application/yaml'))

    await generateConfig(sampleGenerateRequest)

    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(callArgs[1].body as string)

    expect(body.global_settings.character_name).toBe('Haru')
    expect(body.global_settings.environment_name).toBe('indoor')
    expect(body.global_settings.environment_prompt).toBe('indoor room, soft lighting')
  })

  it('tech_settings.comfyui_config を snake_case で送信する', async () => {
    vi.stubGlobal('fetch', mockFetchOk('yaml: content', 'application/yaml'))

    await generateConfig(sampleGenerateRequest)

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string)
    expect(body.tech_settings.comfyui_config.server_address).toBe('127.0.0.1:8188')
    expect(body.tech_settings.comfyui_config.client_id).toBe('t2i_client')
  })

  it('tech_settings.workflow_config を snake_case で送信する', async () => {
    vi.stubGlobal('fetch', mockFetchOk('yaml: content', 'application/yaml'))

    await generateConfig(sampleGenerateRequest)

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string)
    const wc = body.tech_settings.workflow_config
    expect(wc.workflow_json_path).toBe('/path/to/workflow.json')
    expect(wc.seed_node_id).toBe(164)
    expect(wc.default_prompts.base_positive_prompt).toBe('masterpiece')
    expect(wc.default_prompts.batch_size).toBe(1)
  })

  it('scenes を snake_case で送信する', async () => {
    vi.stubGlobal('fetch', mockFetchOk('yaml: content', 'application/yaml'))

    await generateConfig(sampleGenerateRequest)

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string)
    expect(body.scenes[0].template_name).toBe('studying')
    expect(body.scenes[0].overrides.batch_size).toBe(2)
  })

  it('overrides の undefined フィールドは送信しない', async () => {
    vi.stubGlobal('fetch', mockFetchOk('yaml: content', 'application/yaml'))

    const request: GenerateRequest = {
      ...sampleGenerateRequest,
      scenes: [{ templateName: 'studying', overrides: { batchSize: 3 } }],
    }
    await generateConfig(request)

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string)
    expect(body.scenes[0].overrides).not.toHaveProperty('positive_prompt')
    expect(body.scenes[0].overrides).not.toHaveProperty('name')
    expect(body.scenes[0].overrides.batch_size).toBe(3)
  })

  it('成功時に Blob を返す', async () => {
    const yamlBlob = new Blob(['scenes: []'], { type: 'application/yaml' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      blob: () => Promise.resolve(yamlBlob),
    }))

    const result = await generateConfig(sampleGenerateRequest)

    expect(result).toBeInstanceOf(Blob)
  })

  it('422 エラーで ApiError をスローする', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchError(422, 'Unprocessable Entity', { detail: 'Schema validation failed' })
    )

    const error = await generateConfig(sampleGenerateRequest).catch((e: unknown) => e)
    expect((error as ApiError).status).toBe(422)
    expect((error as ApiError).detail).toEqual({ detail: 'Schema validation failed' })
  })

  it('400 エラーで ApiError をスローする', async () => {
    vi.stubGlobal('fetch', mockFetchError(400, 'Bad Request'))

    await expect(generateConfig(sampleGenerateRequest)).rejects.toThrow(ApiError)
  })
})
