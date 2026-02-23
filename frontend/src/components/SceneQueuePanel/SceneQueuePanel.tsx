import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAppContext } from '../../state/AppContext'
import { generateConfig, ApiError } from '../../api/client'
import { buildGenerateRequest } from '../../utils/buildGenerateRequest'
import { downloadBlob } from '../../utils/download'
import { validateGenerateRequest } from '../../utils/validation'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { QueueCard } from './QueueCard'

export function SceneQueuePanel() {
  const { state, dispatch } = useAppContext()
  const { sceneQueue, techDefaults, techSettingsOverrides } = state

  const [emptyQueueError, setEmptyQueueError] = useState(false)
  const [missingTechFields, setMissingTechFields] = useState<string[]>([])
  const [generateError, setGenerateError] = useState<string | null>(null)

  const handleEdit = (id: string) => {
    dispatch({ type: 'OPEN_DRAWER', payload: id })
  }

  const handleDelete = (id: string) => {
    dispatch({ type: 'REMOVE_SCENE_FROM_QUEUE', payload: id })
  }

  const handleGenerate = async () => {
    const validationResult = validateGenerateRequest(sceneQueue, techDefaults, techSettingsOverrides)
    setEmptyQueueError(validationResult.emptyQueueError)
    setMissingTechFields(validationResult.missingTechFields)
    if (!validationResult.isValid) {
      return
    }

    setGenerateError(null)
    dispatch({ type: 'SET_LOADING', payload: { generating: true } })

    try {
      const request = buildGenerateRequest(state)
      const blob = await generateConfig(request)
      downloadBlob(blob, 'workflow_config.yaml')
    } catch (err) {
      if (err instanceof ApiError) {
        const detail =
          err.detail !== undefined
            ? typeof err.detail === 'string'
              ? err.detail
              : JSON.stringify(err.detail)
            : err.message
        setGenerateError(`コンフィグの生成に失敗しました: ${detail}`)
      } else {
        setGenerateError('コンフィグの生成に失敗しました')
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { generating: false } })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {sceneQueue.length === 0 ? (
          <p className="text-muted-foreground text-sm p-4">シーンが追加されていません</p>
        ) : (
          <ul role="list" className="list-none p-0 m-0">
            {sceneQueue.map((item) => (
              <li key={item.id}>
                <QueueCard
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {emptyQueueError && (
        <Alert className="mx-2 mb-2">
          <AlertDescription>シーンを1件以上追加してください</AlertDescription>
        </Alert>
      )}

      {missingTechFields.length > 0 && (
        <Alert className="mx-2 mb-2">
          <AlertDescription>
            <div>未設定の必須項目があります</div>
            <ul>
              {missingTechFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {generateError && (
        <Alert variant="destructive" className="mx-2 mb-2">
          <AlertDescription>{generateError}</AlertDescription>
        </Alert>
      )}

      <div className="shrink-0 p-2">
        <Button
          onClick={handleGenerate}
          disabled={state.loadingState.generating}
          className="w-full"
        >
          {state.loadingState.generating && <Loader2 className="animate-spin" />}
          作成（Generate）
        </Button>
      </div>
    </div>
  )
}
