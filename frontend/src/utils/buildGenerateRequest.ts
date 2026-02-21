import type { AppState } from '../state/reducer'
import type { GenerateRequest } from '../types/api'
import type { DefaultPrompts } from '../types/settings'

const EMPTY_DEFAULT_PROMPTS: DefaultPrompts = {
  basePositivePrompt: '',
  environmentPrompt: '',
  positivePrompt: '',
  negativePrompt: '',
  batchSize: 1,
}

/**
 * 現在の AppState から GenerateRequest を組み立てる。
 * techDefaults と techSettingsOverrides をマージし、override 値を優先する。
 * バリデーション通過後に呼ぶことを前提とする。
 */
export function buildGenerateRequest(state: AppState): GenerateRequest {
  const { globalSettings, techDefaults, techSettingsOverrides, sceneQueue } = state
  const { selectedEnvironment } = globalSettings
  const defaults = techDefaults
  const overrides = techSettingsOverrides

  const comfyuiConfig = {
    serverAddress:
      overrides.comfyuiConfig.serverAddress ?? defaults?.comfyuiConfig.serverAddress ?? '',
    clientId: overrides.comfyuiConfig.clientId ?? defaults?.comfyuiConfig.clientId ?? '',
  }

  const workflowConfig = {
    workflowJsonPath:
      overrides.workflowConfig.workflowJsonPath ??
      defaults?.workflowConfig.workflowJsonPath ??
      '',
    imageOutputPath:
      overrides.workflowConfig.imageOutputPath ?? defaults?.workflowConfig.imageOutputPath ?? '',
    libraryFilePath:
      overrides.workflowConfig.libraryFilePath ?? defaults?.workflowConfig.libraryFilePath ?? '',
    seedNodeId: overrides.workflowConfig.seedNodeId ?? defaults?.workflowConfig.seedNodeId ?? 0,
    batchSizeNodeId:
      overrides.workflowConfig.batchSizeNodeId ?? defaults?.workflowConfig.batchSizeNodeId ?? 0,
    negativePromptNodeId:
      overrides.workflowConfig.negativePromptNodeId ??
      defaults?.workflowConfig.negativePromptNodeId ??
      0,
    positivePromptNodeId:
      overrides.workflowConfig.positivePromptNodeId ??
      defaults?.workflowConfig.positivePromptNodeId ??
      0,
    environmentPromptNodeId:
      overrides.workflowConfig.environmentPromptNodeId ??
      defaults?.workflowConfig.environmentPromptNodeId ??
      0,
    defaultPrompts: defaults?.workflowConfig.defaultPrompts ?? EMPTY_DEFAULT_PROMPTS,
  }

  return {
    globalSettings: {
      characterName: globalSettings.characterName,
      environmentName: selectedEnvironment?.name ?? '',
      environmentPrompt: selectedEnvironment?.environmentPrompt ?? '',
    },
    techSettings: {
      comfyuiConfig,
      workflowConfig,
    },
    scenes: sceneQueue.map((item) => ({
      templateName: item.templateName,
      overrides: item.overrides,
    })),
  }
}
