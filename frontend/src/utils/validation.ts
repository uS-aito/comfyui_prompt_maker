import type { TechDefaults, TechSettingsOverrides } from '../types/settings'

export interface ValidationResult {
  isValid: boolean
  emptyQueueError: boolean
  missingTechFields: string[]
}

/**
 * コンフィグ生成前のバリデーションを実行する。
 *
 * @param queueIds - キュー内のシーンIDリスト（または任意の要素）
 * @param techDefaults - ライブラリから取得したデフォルト技術設定（nullの場合は未ロード）
 * @param overrides - ユーザーが入力した技術設定のオーバーライド値
 * @returns ValidationResult
 */
export function validateGenerateRequest(
  queueIds: unknown[],
  techDefaults: TechDefaults | null,
  overrides: TechSettingsOverrides
): ValidationResult {
  const emptyQueueError = queueIds.length === 0
  const missingTechFields = getMissingTechFields(techDefaults, overrides)

  return {
    isValid: !emptyQueueError && missingTechFields.length === 0,
    emptyQueueError,
    missingTechFields,
  }
}

/** 有効な文字列値かどうかを判定する */
function hasString(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/** 有効な数値かどうかを判定する */
function hasNumber(value: number | undefined | null): boolean {
  return typeof value === 'number' && value > 0
}

/**
 * デフォルト値・オーバーライドの両方が未設定の必須技術設定フィールド名一覧を返す。
 */
function getMissingTechFields(
  defaults: TechDefaults | null,
  overrides: TechSettingsOverrides
): string[] {
  const missing: string[] = []

  const effectiveString = (
    override: string | undefined,
    defaultVal: string | undefined
  ): boolean => hasString(override) || hasString(defaultVal)

  const effectiveNumber = (
    override: number | undefined,
    defaultVal: number | undefined
  ): boolean => hasNumber(override) || hasNumber(defaultVal)

  // ComfyUI 設定
  if (!effectiveString(overrides.comfyuiConfig.serverAddress, defaults?.comfyuiConfig.serverAddress)) {
    missing.push('サーバーアドレス')
  }
  if (!effectiveString(overrides.comfyuiConfig.clientId, defaults?.comfyuiConfig.clientId)) {
    missing.push('クライアントID')
  }

  // ワークフロー設定（文字列フィールド）
  if (!effectiveString(overrides.workflowConfig.workflowJsonPath, defaults?.workflowConfig.workflowJsonPath)) {
    missing.push('ワークフロー JSON パス')
  }
  if (!effectiveString(overrides.workflowConfig.imageOutputPath, defaults?.workflowConfig.imageOutputPath)) {
    missing.push('画像出力パス')
  }
  if (!effectiveString(overrides.workflowConfig.libraryFilePath, defaults?.workflowConfig.libraryFilePath)) {
    missing.push('ライブラリファイルパス')
  }

  // ワークフロー設定（数値フィールド）
  if (!effectiveNumber(overrides.workflowConfig.seedNodeId, defaults?.workflowConfig.seedNodeId)) {
    missing.push('シードノードID')
  }
  if (!effectiveNumber(overrides.workflowConfig.batchSizeNodeId, defaults?.workflowConfig.batchSizeNodeId)) {
    missing.push('バッチサイズノードID')
  }
  if (!effectiveNumber(overrides.workflowConfig.negativePromptNodeId, defaults?.workflowConfig.negativePromptNodeId)) {
    missing.push('ネガティブプロンプトノードID')
  }
  if (!effectiveNumber(overrides.workflowConfig.positivePromptNodeId, defaults?.workflowConfig.positivePromptNodeId)) {
    missing.push('ポジティブプロンプトノードID')
  }
  if (!effectiveNumber(overrides.workflowConfig.environmentPromptNodeId, defaults?.workflowConfig.environmentPromptNodeId)) {
    missing.push('環境プロンプトノードID')
  }

  return missing
}
