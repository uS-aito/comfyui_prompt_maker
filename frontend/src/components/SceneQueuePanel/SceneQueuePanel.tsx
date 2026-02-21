import { useState } from 'react'
import { useAppContext } from '../../state/AppContext'
import { generateConfig, ApiError } from '../../api/client'
import { buildGenerateRequest } from '../../utils/buildGenerateRequest'
import { downloadBlob } from '../../utils/download'
import { validateGenerateRequest } from '../../utils/validation'
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sceneQueue.length === 0 ? (
          <div>シーンが追加されていません</div>
        ) : (
          <ul role="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
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
        <div role="alert">シーンを1件以上追加してください</div>
      )}

      {missingTechFields.length > 0 && (
        <div role="alert">
          <div>未設定の必須項目があります</div>
          <ul>
            {missingTechFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      )}

      {generateError && (
        <div role="alert">{generateError}</div>
      )}

      <div style={{ flexShrink: 0 }}>
        <button onClick={handleGenerate}>作成（Generate）</button>
      </div>
    </div>
  )
}
