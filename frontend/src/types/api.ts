import type { SceneOverrides } from './scene'
import type { ComfyUIConfig, WorkflowConfigParams } from './settings'

export interface GenerateRequest {
  globalSettings: {
    characterName: string
    environmentName: string
    environmentPrompt: string
  }
  techSettings: {
    comfyuiConfig: ComfyUIConfig
    workflowConfig: WorkflowConfigParams
  }
  scenes: Array<{
    templateName: string
    overrides: SceneOverrides
  }>
}
