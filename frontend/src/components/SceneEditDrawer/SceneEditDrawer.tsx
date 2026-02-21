import type { Dispatch } from 'react'
import type { SceneQueueItem, SceneOverrides } from '../../types/scene'
import type { DefaultPrompts } from '../../types/settings'
import type { AppAction } from '../../state/reducer'

interface SceneEditDrawerProps {
  isOpen: boolean
  scene: SceneQueueItem | null
  defaults: DefaultPrompts
  dispatch: Dispatch<AppAction>
}

export function SceneEditDrawer({ isOpen, scene, defaults, dispatch }: SceneEditDrawerProps) {
  if (!isOpen || !scene) return null

  const overrides = scene.overrides
  const displayName = overrides.name ?? scene.displayName

  const handleClose = () => {
    dispatch({ type: 'CLOSE_DRAWER' })
  }

  const handleChange = (field: keyof SceneOverrides, value: string | number | undefined) => {
    const newOverrides: SceneOverrides = { ...overrides }
    if (value === undefined || value === '') {
      delete newOverrides[field]
    } else {
      (newOverrides as Record<string, unknown>)[field] = value
    }
    dispatch({
      type: 'UPDATE_SCENE_OVERRIDE',
      payload: { id: scene.id, overrides: newOverrides },
    })
  }

  return (
    <>
      <div
        data-testid="drawer-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 50,
        }}
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-label={`シーン名：${displayName} の編集`}
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100%',
          width: '400px',
          backgroundColor: 'white',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>シーン名：{displayName} の編集</h2>
          <button aria-label="閉じる" onClick={handleClose}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div>
            <label htmlFor="drawer-scene-name">シーン名</label>
            <input
              id="drawer-scene-name"
              type="text"
              value={overrides.name ?? ''}
              placeholder={scene.displayName}
              onChange={(e) => handleChange('name', e.target.value || undefined)}
            />
          </div>

          <div>
            <label htmlFor="drawer-positive-prompt">ポジティブプロンプト</label>
            <textarea
              id="drawer-positive-prompt"
              value={overrides.positivePrompt ?? ''}
              placeholder={defaults.positivePrompt}
              onChange={(e) => handleChange('positivePrompt', e.target.value || undefined)}
            />
          </div>

          <div>
            <label htmlFor="drawer-negative-prompt">ネガティブプロンプト</label>
            <textarea
              id="drawer-negative-prompt"
              value={overrides.negativePrompt ?? ''}
              placeholder={defaults.negativePrompt}
              onChange={(e) => handleChange('negativePrompt', e.target.value || undefined)}
            />
          </div>

          <div>
            <label htmlFor="drawer-batch-size">バッチサイズ</label>
            <input
              id="drawer-batch-size"
              type="number"
              value={overrides.batchSize ?? ''}
              placeholder={String(defaults.batchSize)}
              min={1}
              onChange={(e) =>
                handleChange('batchSize', e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
        </div>

        <button onClick={handleClose}>完了</button>
      </div>
    </>
  )
}
