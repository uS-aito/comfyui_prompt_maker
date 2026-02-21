import { useState } from 'react'
import { useAppContext } from '../../state/AppContext'
import type { TechSettingsOverrides } from '../../types/settings'

export function TechSettingsPanel() {
  const { state, dispatch } = useAppContext()
  const [isExpanded, setIsExpanded] = useState(false)

  const { techDefaults, techSettingsOverrides } = state

  const handleComfyUIChange = (field: 'serverAddress' | 'clientId', value: string) => {
    const updated: TechSettingsOverrides = {
      ...techSettingsOverrides,
      comfyuiConfig: {
        ...techSettingsOverrides.comfyuiConfig,
        [field]: value || undefined,
      },
    }
    dispatch({ type: 'UPDATE_TECH_OVERRIDE', payload: updated })
  }

  const handleWorkflowStringChange = (
    field: 'workflowJsonPath' | 'imageOutputPath' | 'libraryFilePath',
    value: string
  ) => {
    const updated: TechSettingsOverrides = {
      ...techSettingsOverrides,
      workflowConfig: {
        ...techSettingsOverrides.workflowConfig,
        [field]: value || undefined,
      },
    }
    dispatch({ type: 'UPDATE_TECH_OVERRIDE', payload: updated })
  }

  const handleWorkflowNumberChange = (
    field:
      | 'seedNodeId'
      | 'batchSizeNodeId'
      | 'negativePromptNodeId'
      | 'positivePromptNodeId'
      | 'environmentPromptNodeId',
    value: string
  ) => {
    const parsed = parseInt(value, 10)
    const updated: TechSettingsOverrides = {
      ...techSettingsOverrides,
      workflowConfig: {
        ...techSettingsOverrides.workflowConfig,
        [field]: isNaN(parsed) ? undefined : parsed,
      },
    }
    dispatch({ type: 'UPDATE_TECH_OVERRIDE', payload: updated })
  }

  return (
    <div>
      <button onClick={() => setIsExpanded((prev) => !prev)}>
        技術設定 {isExpanded ? '▼' : '▶'}
      </button>

      {isExpanded && (
        <div>
          {/* ComfyUI 設定 */}
          <fieldset>
            <legend>ComfyUI 設定</legend>

            <div>
              <label htmlFor="tech-server-address">サーバーアドレス</label>
              <input
                id="tech-server-address"
                type="text"
                value={techSettingsOverrides.comfyuiConfig.serverAddress ?? ''}
                placeholder={techDefaults?.comfyuiConfig.serverAddress ?? ''}
                onChange={(e) => handleComfyUIChange('serverAddress', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="tech-client-id">クライアントID</label>
              <input
                id="tech-client-id"
                type="text"
                value={techSettingsOverrides.comfyuiConfig.clientId ?? ''}
                placeholder={techDefaults?.comfyuiConfig.clientId ?? ''}
                onChange={(e) => handleComfyUIChange('clientId', e.target.value)}
              />
            </div>
          </fieldset>

          {/* ワークフロー設定 */}
          <fieldset>
            <legend>ワークフロー設定</legend>

            <div>
              <label htmlFor="tech-workflow-json-path">ワークフロー JSON パス</label>
              <input
                id="tech-workflow-json-path"
                type="text"
                value={techSettingsOverrides.workflowConfig.workflowJsonPath ?? ''}
                placeholder={techDefaults?.workflowConfig.workflowJsonPath ?? ''}
                onChange={(e) => handleWorkflowStringChange('workflowJsonPath', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="tech-image-output-path">画像出力パス</label>
              <input
                id="tech-image-output-path"
                type="text"
                value={techSettingsOverrides.workflowConfig.imageOutputPath ?? ''}
                placeholder={techDefaults?.workflowConfig.imageOutputPath ?? ''}
                onChange={(e) => handleWorkflowStringChange('imageOutputPath', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="tech-library-file-path">ライブラリファイルパス</label>
              <input
                id="tech-library-file-path"
                type="text"
                value={techSettingsOverrides.workflowConfig.libraryFilePath ?? ''}
                placeholder={techDefaults?.workflowConfig.libraryFilePath ?? ''}
                onChange={(e) => handleWorkflowStringChange('libraryFilePath', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="tech-seed-node-id">シードノードID</label>
              <input
                id="tech-seed-node-id"
                type="number"
                value={techSettingsOverrides.workflowConfig.seedNodeId?.toString() ?? ''}
                placeholder={techDefaults?.workflowConfig.seedNodeId?.toString() ?? ''}
                onChange={(e) => handleWorkflowNumberChange('seedNodeId', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="tech-batch-size-node-id">バッチサイズノードID</label>
              <input
                id="tech-batch-size-node-id"
                type="number"
                value={techSettingsOverrides.workflowConfig.batchSizeNodeId?.toString() ?? ''}
                placeholder={techDefaults?.workflowConfig.batchSizeNodeId?.toString() ?? ''}
                onChange={(e) => handleWorkflowNumberChange('batchSizeNodeId', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="tech-negative-prompt-node-id">ネガティブプロンプトノードID</label>
              <input
                id="tech-negative-prompt-node-id"
                type="number"
                value={techSettingsOverrides.workflowConfig.negativePromptNodeId?.toString() ?? ''}
                placeholder={techDefaults?.workflowConfig.negativePromptNodeId?.toString() ?? ''}
                onChange={(e) =>
                  handleWorkflowNumberChange('negativePromptNodeId', e.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor="tech-positive-prompt-node-id">ポジティブプロンプトノードID</label>
              <input
                id="tech-positive-prompt-node-id"
                type="number"
                value={techSettingsOverrides.workflowConfig.positivePromptNodeId?.toString() ?? ''}
                placeholder={techDefaults?.workflowConfig.positivePromptNodeId?.toString() ?? ''}
                onChange={(e) =>
                  handleWorkflowNumberChange('positivePromptNodeId', e.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor="tech-environment-prompt-node-id">環境プロンプトノードID</label>
              <input
                id="tech-environment-prompt-node-id"
                type="number"
                value={
                  techSettingsOverrides.workflowConfig.environmentPromptNodeId?.toString() ?? ''
                }
                placeholder={
                  techDefaults?.workflowConfig.environmentPromptNodeId?.toString() ?? ''
                }
                onChange={(e) =>
                  handleWorkflowNumberChange('environmentPromptNodeId', e.target.value)
                }
              />
            </div>
          </fieldset>
        </div>
      )}
    </div>
  )
}
