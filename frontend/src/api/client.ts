import type { SceneTemplate } from '../types/scene'
import type { Environment } from '../types/environment'
import type {
  TechDefaults,
  DefaultPrompts,
  ComfyUIConfig,
  WorkflowConfigParams,
} from '../types/settings'
import type { GenerateRequest } from '../types/api'

// --- エラー型 ---

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// --- レスポンス検査ヘルパー ---

async function checkResponse(response: Response): Promise<Response> {
  if (!response.ok) {
    let detail: unknown
    try {
      detail = await response.json()
    } catch {
      // JSON パース失敗は無視
    }
    throw new ApiError(response.status, response.statusText, detail)
  }
  return response
}

// --- snake_case → camelCase 変換ヘルパー ---

function toSceneTemplate(raw: Record<string, unknown>): SceneTemplate {
  return {
    name: raw.name as string,
    displayName: raw.display_name as string,
    positivePrompt: raw.positive_prompt as string,
    negativePrompt: raw.negative_prompt as string,
    batchSize: raw.batch_size as number,
    previewImageUrl: raw.preview_image_url as string | null,
  }
}

function toEnvironment(raw: Record<string, unknown>): Environment {
  return {
    name: raw.name as string,
    displayName: raw.display_name as string,
    environmentPrompt: raw.environment_prompt as string,
    thumbnailUrl: raw.thumbnail_url as string | null,
  }
}

function toDefaultPrompts(raw: Record<string, unknown>): DefaultPrompts {
  return {
    basePositivePrompt: raw.base_positive_prompt as string,
    environmentPrompt: raw.environment_prompt as string,
    positivePrompt: raw.positive_prompt as string,
    negativePrompt: raw.negative_prompt as string,
    batchSize: raw.batch_size as number,
  }
}

function toComfyUIConfig(raw: Record<string, unknown>): ComfyUIConfig {
  return {
    serverAddress: raw.server_address as string,
    clientId: raw.client_id as string,
  }
}

function toWorkflowConfigParams(raw: Record<string, unknown>): WorkflowConfigParams {
  return {
    workflowJsonPath: raw.workflow_json_path as string,
    imageOutputPath: raw.image_output_path as string,
    libraryFilePath: raw.library_file_path as string,
    seedNodeId: raw.seed_node_id as number,
    batchSizeNodeId: raw.batch_size_node_id as number,
    negativePromptNodeId: raw.negative_prompt_node_id as number,
    positivePromptNodeId: raw.positive_prompt_node_id as number,
    environmentPromptNodeId: raw.environment_prompt_node_id as number,
    defaultPrompts: toDefaultPrompts(raw.default_prompts as Record<string, unknown>),
  }
}

function toTechDefaults(raw: Record<string, unknown>): TechDefaults {
  return {
    comfyuiConfig: toComfyUIConfig(raw.comfyui_config as Record<string, unknown>),
    workflowConfig: toWorkflowConfigParams(raw.workflow_config as Record<string, unknown>),
  }
}

// --- camelCase → snake_case シリアライズ ---

function serializeGenerateRequest(request: GenerateRequest): unknown {
  const { globalSettings, techSettings, scenes } = request
  return {
    global_settings: {
      character_name: globalSettings.characterName,
      environment_name: globalSettings.environmentName,
      environment_prompt: globalSettings.environmentPrompt,
    },
    tech_settings: {
      comfyui_config: {
        server_address: techSettings.comfyuiConfig.serverAddress,
        client_id: techSettings.comfyuiConfig.clientId,
      },
      workflow_config: {
        workflow_json_path: techSettings.workflowConfig.workflowJsonPath,
        image_output_path: techSettings.workflowConfig.imageOutputPath,
        library_file_path: techSettings.workflowConfig.libraryFilePath,
        seed_node_id: techSettings.workflowConfig.seedNodeId,
        batch_size_node_id: techSettings.workflowConfig.batchSizeNodeId,
        negative_prompt_node_id: techSettings.workflowConfig.negativePromptNodeId,
        positive_prompt_node_id: techSettings.workflowConfig.positivePromptNodeId,
        environment_prompt_node_id: techSettings.workflowConfig.environmentPromptNodeId,
        default_prompts: {
          base_positive_prompt: techSettings.workflowConfig.defaultPrompts.basePositivePrompt,
          environment_prompt: techSettings.workflowConfig.defaultPrompts.environmentPrompt,
          positive_prompt: techSettings.workflowConfig.defaultPrompts.positivePrompt,
          negative_prompt: techSettings.workflowConfig.defaultPrompts.negativePrompt,
          batch_size: techSettings.workflowConfig.defaultPrompts.batchSize,
        },
      },
    },
    scenes: scenes.map((scene) => ({
      template_name: scene.templateName,
      overrides: {
        ...(scene.overrides.name !== undefined && { name: scene.overrides.name }),
        ...(scene.overrides.positivePrompt !== undefined && {
          positive_prompt: scene.overrides.positivePrompt,
        }),
        ...(scene.overrides.negativePrompt !== undefined && {
          negative_prompt: scene.overrides.negativePrompt,
        }),
        ...(scene.overrides.batchSize !== undefined && { batch_size: scene.overrides.batchSize }),
      },
    })),
  }
}

// --- API 関数 ---

export async function fetchScenes(): Promise<SceneTemplate[]> {
  const response = await checkResponse(await fetch('/api/scenes'))
  const data = (await response.json()) as unknown[]
  return data.map((item) => toSceneTemplate(item as Record<string, unknown>))
}

export async function fetchEnvironments(): Promise<Environment[]> {
  const response = await checkResponse(await fetch('/api/environments'))
  const data = (await response.json()) as unknown[]
  return data.map((item) => toEnvironment(item as Record<string, unknown>))
}

export async function fetchTechDefaults(): Promise<TechDefaults> {
  const response = await checkResponse(await fetch('/api/settings/defaults'))
  const data = (await response.json()) as Record<string, unknown>
  return toTechDefaults(data)
}

export async function generateConfig(request: GenerateRequest): Promise<Blob> {
  const response = await checkResponse(
    await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serializeGenerateRequest(request)),
    })
  )
  return response.blob()
}
