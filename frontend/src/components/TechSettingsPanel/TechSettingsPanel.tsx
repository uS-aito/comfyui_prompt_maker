import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useAppContext } from '../../state/AppContext'
import type { TechSettingsOverrides } from '../../types/settings'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'

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
    <div className="p-4">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          )}
          技術設定
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 pt-2">
          {/* ComfyUI 設定 */}
          <fieldset className="rounded-md border p-4">
            <legend className="px-1 text-sm font-medium">ComfyUI 設定</legend>

            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tech-server-address" className="text-sm font-medium">
                  サーバーアドレス
                </label>
                <Input
                  id="tech-server-address"
                  type="text"
                  value={techSettingsOverrides.comfyuiConfig.serverAddress ?? ''}
                  placeholder={techDefaults?.comfyuiConfig.serverAddress ?? ''}
                  onChange={(e) => handleComfyUIChange('serverAddress', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tech-client-id" className="text-sm font-medium">
                  クライアントID
                </label>
                <Input
                  id="tech-client-id"
                  type="text"
                  value={techSettingsOverrides.comfyuiConfig.clientId ?? ''}
                  placeholder={techDefaults?.comfyuiConfig.clientId ?? ''}
                  onChange={(e) => handleComfyUIChange('clientId', e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          {/* ワークフロー設定 */}
          <fieldset className="rounded-md border p-4">
            <legend className="px-1 text-sm font-medium">ワークフロー設定</legend>

            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tech-workflow-json-path" className="text-sm font-medium">
                  ワークフロー JSON パス
                </label>
                <Input
                  id="tech-workflow-json-path"
                  type="text"
                  value={techSettingsOverrides.workflowConfig.workflowJsonPath ?? ''}
                  placeholder={techDefaults?.workflowConfig.workflowJsonPath ?? ''}
                  onChange={(e) => handleWorkflowStringChange('workflowJsonPath', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tech-image-output-path" className="text-sm font-medium">
                  画像出力パス
                </label>
                <Input
                  id="tech-image-output-path"
                  type="text"
                  value={techSettingsOverrides.workflowConfig.imageOutputPath ?? ''}
                  placeholder={techDefaults?.workflowConfig.imageOutputPath ?? ''}
                  onChange={(e) => handleWorkflowStringChange('imageOutputPath', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tech-library-file-path" className="text-sm font-medium">
                  ライブラリファイルパス
                </label>
                <Input
                  id="tech-library-file-path"
                  type="text"
                  value={techSettingsOverrides.workflowConfig.libraryFilePath ?? ''}
                  placeholder={techDefaults?.workflowConfig.libraryFilePath ?? ''}
                  onChange={(e) => handleWorkflowStringChange('libraryFilePath', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tech-seed-node-id" className="text-sm font-medium">
                  シードノードID
                </label>
                <Input
                  id="tech-seed-node-id"
                  type="number"
                  value={techSettingsOverrides.workflowConfig.seedNodeId?.toString() ?? ''}
                  placeholder={techDefaults?.workflowConfig.seedNodeId?.toString() ?? ''}
                  onChange={(e) => handleWorkflowNumberChange('seedNodeId', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tech-batch-size-node-id" className="text-sm font-medium">
                  バッチサイズノードID
                </label>
                <Input
                  id="tech-batch-size-node-id"
                  type="number"
                  value={techSettingsOverrides.workflowConfig.batchSizeNodeId?.toString() ?? ''}
                  placeholder={techDefaults?.workflowConfig.batchSizeNodeId?.toString() ?? ''}
                  onChange={(e) => handleWorkflowNumberChange('batchSizeNodeId', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tech-negative-prompt-node-id" className="text-sm font-medium">
                  ネガティブプロンプトノードID
                </label>
                <Input
                  id="tech-negative-prompt-node-id"
                  type="number"
                  value={techSettingsOverrides.workflowConfig.negativePromptNodeId?.toString() ?? ''}
                  placeholder={techDefaults?.workflowConfig.negativePromptNodeId?.toString() ?? ''}
                  onChange={(e) =>
                    handleWorkflowNumberChange('negativePromptNodeId', e.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tech-positive-prompt-node-id" className="text-sm font-medium">
                  ポジティブプロンプトノードID
                </label>
                <Input
                  id="tech-positive-prompt-node-id"
                  type="number"
                  value={techSettingsOverrides.workflowConfig.positivePromptNodeId?.toString() ?? ''}
                  placeholder={techDefaults?.workflowConfig.positivePromptNodeId?.toString() ?? ''}
                  onChange={(e) =>
                    handleWorkflowNumberChange('positivePromptNodeId', e.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tech-environment-prompt-node-id" className="text-sm font-medium">
                  環境プロンプトノードID
                </label>
                <Input
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
            </div>
          </fieldset>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
