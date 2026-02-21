import type { Environment } from './environment'

export interface ComfyUIConfig {
  serverAddress: string
  clientId: string
}

export interface DefaultPrompts {
  basePositivePrompt: string
  environmentPrompt: string
  positivePrompt: string
  negativePrompt: string
  batchSize: number
}

export interface WorkflowConfigParams {
  workflowJsonPath: string
  imageOutputPath: string
  libraryFilePath: string
  seedNodeId: number
  batchSizeNodeId: number
  negativePromptNodeId: number
  positivePromptNodeId: number
  environmentPromptNodeId: number
  defaultPrompts: DefaultPrompts
}

export interface TechDefaults {
  comfyuiConfig: ComfyUIConfig
  workflowConfig: WorkflowConfigParams
}

export type TechSettingsOverrides = {
  comfyuiConfig: Partial<ComfyUIConfig>
  workflowConfig: Partial<WorkflowConfigParams>
}

export interface GlobalSettings {
  characterName: string
  selectedEnvironment: Environment | null
}

export interface DrawerState {
  isOpen: boolean
  sceneId: string | null
}

export interface LoadingState {
  library: boolean
  generating: boolean
}
