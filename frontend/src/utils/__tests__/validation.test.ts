/**
 * validateGenerateRequest ユニットテスト（タスク 11.1）
 *
 * 生成前バリデーションの動作を検証する
 * - キューが空の場合は emptyQueueError を返す
 * - 必須技術設定項目が未設定の場合は missingTechFields にフィールド名を返す
 * - デフォルト値がある場合は有効とみなす
 * - オーバーライド値がある場合は有効とみなす（デフォルト未設定でも）
 * - すべての条件を満たす場合は isValid: true を返す
 */

import { describe, it, expect } from 'vitest'
import { validateGenerateRequest } from '../validation'
import type { TechDefaults, TechSettingsOverrides } from '../../types/settings'

// --- テスト用フィクスチャ ---

const fullTechDefaults: TechDefaults = {
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

// --- キュー空チェック ---

describe('validateGenerateRequest - キューが空の場合', () => {
  it('キューが空のとき emptyQueueError が true になる', () => {
    const result = validateGenerateRequest([], fullTechDefaults, emptyOverrides)
    expect(result.emptyQueueError).toBe(true)
  })

  it('キューが空のとき isValid が false になる', () => {
    const result = validateGenerateRequest([], fullTechDefaults, emptyOverrides)
    expect(result.isValid).toBe(false)
  })

  it('キューに1件以上あるとき emptyQueueError が false になる', () => {
    const result = validateGenerateRequest(['scene1'], fullTechDefaults, emptyOverrides)
    expect(result.emptyQueueError).toBe(false)
  })
})

// --- 技術設定の必須フィールドチェック（デフォルト値あり） ---

describe('validateGenerateRequest - デフォルト値がある場合', () => {
  it('すべてのデフォルト値が設定されていれば missingTechFields が空になる', () => {
    const result = validateGenerateRequest(['scene1'], fullTechDefaults, emptyOverrides)
    expect(result.missingTechFields).toEqual([])
  })

  it('すべての条件を満たすとき isValid が true になる', () => {
    const result = validateGenerateRequest(['scene1'], fullTechDefaults, emptyOverrides)
    expect(result.isValid).toBe(true)
  })
})

// --- 技術設定の必須フィールドチェック（デフォルト値なし・オーバーライドなし） ---

describe('validateGenerateRequest - デフォルト値もオーバーライドもない場合', () => {
  it('techDefaults が null のとき全必須フィールドが missingTechFields に含まれる', () => {
    const result = validateGenerateRequest(['scene1'], null, emptyOverrides)
    expect(result.isValid).toBe(false)
    expect(result.missingTechFields.length).toBeGreaterThan(0)
  })

  it('serverAddress がデフォルトもオーバーライドも未設定のとき missingTechFields に含まれる', () => {
    const defaults: TechDefaults = {
      ...fullTechDefaults,
      comfyuiConfig: { serverAddress: '', clientId: 't2i_client' },
    }
    const result = validateGenerateRequest(['scene1'], defaults, emptyOverrides)
    expect(result.missingTechFields).toContain('サーバーアドレス')
  })

  it('clientId がデフォルトもオーバーライドも未設定のとき missingTechFields に含まれる', () => {
    const defaults: TechDefaults = {
      ...fullTechDefaults,
      comfyuiConfig: { serverAddress: '127.0.0.1:8188', clientId: '' },
    }
    const result = validateGenerateRequest(['scene1'], defaults, emptyOverrides)
    expect(result.missingTechFields).toContain('クライアントID')
  })

  it('workflowJsonPath が未設定のとき missingTechFields に含まれる', () => {
    const defaults: TechDefaults = {
      ...fullTechDefaults,
      workflowConfig: { ...fullTechDefaults.workflowConfig, workflowJsonPath: '' },
    }
    const result = validateGenerateRequest(['scene1'], defaults, emptyOverrides)
    expect(result.missingTechFields).toContain('ワークフロー JSON パス')
  })

  it('imageOutputPath が未設定のとき missingTechFields に含まれる', () => {
    const defaults: TechDefaults = {
      ...fullTechDefaults,
      workflowConfig: { ...fullTechDefaults.workflowConfig, imageOutputPath: '' },
    }
    const result = validateGenerateRequest(['scene1'], defaults, emptyOverrides)
    expect(result.missingTechFields).toContain('画像出力パス')
  })

  it('libraryFilePath が未設定のとき missingTechFields に含まれる', () => {
    const defaults: TechDefaults = {
      ...fullTechDefaults,
      workflowConfig: { ...fullTechDefaults.workflowConfig, libraryFilePath: '' },
    }
    const result = validateGenerateRequest(['scene1'], defaults, emptyOverrides)
    expect(result.missingTechFields).toContain('ライブラリファイルパス')
  })

  it('seedNodeId が未設定のとき missingTechFields に含まれる', () => {
    const defaults: TechDefaults = {
      ...fullTechDefaults,
      workflowConfig: { ...fullTechDefaults.workflowConfig, seedNodeId: 0 },
    }
    const result = validateGenerateRequest(['scene1'], defaults, emptyOverrides)
    expect(result.missingTechFields).toContain('シードノードID')
  })

  it('batchSizeNodeId が未設定のとき missingTechFields に含まれる', () => {
    const defaults: TechDefaults = {
      ...fullTechDefaults,
      workflowConfig: { ...fullTechDefaults.workflowConfig, batchSizeNodeId: 0 },
    }
    const result = validateGenerateRequest(['scene1'], defaults, emptyOverrides)
    expect(result.missingTechFields).toContain('バッチサイズノードID')
  })

  it('negativePromptNodeId が未設定のとき missingTechFields に含まれる', () => {
    const defaults: TechDefaults = {
      ...fullTechDefaults,
      workflowConfig: { ...fullTechDefaults.workflowConfig, negativePromptNodeId: 0 },
    }
    const result = validateGenerateRequest(['scene1'], defaults, emptyOverrides)
    expect(result.missingTechFields).toContain('ネガティブプロンプトノードID')
  })

  it('positivePromptNodeId が未設定のとき missingTechFields に含まれる', () => {
    const defaults: TechDefaults = {
      ...fullTechDefaults,
      workflowConfig: { ...fullTechDefaults.workflowConfig, positivePromptNodeId: 0 },
    }
    const result = validateGenerateRequest(['scene1'], defaults, emptyOverrides)
    expect(result.missingTechFields).toContain('ポジティブプロンプトノードID')
  })

  it('environmentPromptNodeId が未設定のとき missingTechFields に含まれる', () => {
    const defaults: TechDefaults = {
      ...fullTechDefaults,
      workflowConfig: { ...fullTechDefaults.workflowConfig, environmentPromptNodeId: 0 },
    }
    const result = validateGenerateRequest(['scene1'], defaults, emptyOverrides)
    expect(result.missingTechFields).toContain('環境プロンプトノードID')
  })
})

// --- オーバーライド値による補完 ---

describe('validateGenerateRequest - オーバーライド値がある場合', () => {
  it('デフォルト値が空でもオーバーライドで補完されれば有効になる', () => {
    const defaults: TechDefaults = {
      ...fullTechDefaults,
      comfyuiConfig: { serverAddress: '', clientId: 't2i_client' },
    }
    const overrides: TechSettingsOverrides = {
      comfyuiConfig: { serverAddress: '192.168.1.1:8188' },
      workflowConfig: {},
    }
    const result = validateGenerateRequest(['scene1'], defaults, overrides)
    expect(result.missingTechFields).not.toContain('サーバーアドレス')
  })

  it('デフォルト値がゼロでもオーバーライドで補完されれば有効になる（数値フィールド）', () => {
    const defaults: TechDefaults = {
      ...fullTechDefaults,
      workflowConfig: { ...fullTechDefaults.workflowConfig, seedNodeId: 0 },
    }
    const overrides: TechSettingsOverrides = {
      comfyuiConfig: {},
      workflowConfig: { seedNodeId: 100 },
    }
    const result = validateGenerateRequest(['scene1'], defaults, overrides)
    expect(result.missingTechFields).not.toContain('シードノードID')
  })

  it('techDefaults が null でもすべてのフィールドをオーバーライドで指定すれば有効になる', () => {
    const overrides: TechSettingsOverrides = {
      comfyuiConfig: { serverAddress: '127.0.0.1:8188', clientId: 't2i_client' },
      workflowConfig: {
        workflowJsonPath: '/workflow.json',
        imageOutputPath: '/output',
        libraryFilePath: '/library.yaml',
        seedNodeId: 164,
        batchSizeNodeId: 22,
        negativePromptNodeId: 174,
        positivePromptNodeId: 257,
        environmentPromptNodeId: 303,
      },
    }
    const result = validateGenerateRequest(['scene1'], null, overrides)
    expect(result.isValid).toBe(true)
    expect(result.missingTechFields).toEqual([])
  })
})

// --- キューと技術設定の両方が問題ある場合 ---

describe('validateGenerateRequest - 複合エラー', () => {
  it('キューが空かつ技術設定も不足している場合、両方のエラーが返る', () => {
    const result = validateGenerateRequest([], null, emptyOverrides)
    expect(result.emptyQueueError).toBe(true)
    expect(result.missingTechFields.length).toBeGreaterThan(0)
    expect(result.isValid).toBe(false)
  })
})
