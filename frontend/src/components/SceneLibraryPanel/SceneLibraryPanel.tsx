import { useAppContext } from '../../state/AppContext'
import type { SceneTemplate } from '../../types/scene'
import scenePlaceholder from '../../assets/scene-placeholder.svg'

export function SceneLibraryPanel() {
  const { state, dispatch } = useAppContext()
  const { scenes, error, loadingState } = state

  const handleSceneClick = (scene: SceneTemplate) => {
    dispatch({ type: 'ADD_SCENE_TO_QUEUE', payload: scene })
  }

  if (error) {
    return <div role="alert">{error}</div>
  }

  if (loadingState.library) {
    return <div>読み込み中...</div>
  }

  if (scenes.length === 0) {
    return <div>シーンが見つかりません</div>
  }

  return (
    <div style={{ overflowY: 'auto' }}>
      <ul role="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {scenes.map((scene) => (
          <li key={scene.name}>
            <button
              onClick={() => handleSceneClick(scene)}
              aria-label={scene.displayName}
            >
              {scene.previewImageUrl ? (
                <img
                  src={scene.previewImageUrl}
                  alt={scene.displayName}
                  style={{ width: 80, height: 80, objectFit: 'cover' }}
                />
              ) : (
                <img
                  src={scenePlaceholder}
                  alt=""
                  aria-hidden="true"
                  style={{ width: 80, height: 80 }}
                />
              )}
              <span>{scene.displayName}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
