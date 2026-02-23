import { useAppContext } from '../../state/AppContext'
import type { SceneTemplate } from '../../types/scene'
import scenePlaceholder from '../../assets/scene-placeholder.svg'
import { Alert, AlertDescription } from '../ui/alert'

export function SceneLibraryPanel() {
  const { state, dispatch } = useAppContext()
  const { scenes, error, loadingState } = state

  const handleSceneClick = (scene: SceneTemplate) => {
    dispatch({ type: 'ADD_SCENE_TO_QUEUE', payload: scene })
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (loadingState.library) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        読み込み中...
      </div>
    )
  }

  if (scenes.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        シーンが見つかりません
      </div>
    )
  }

  return (
    <div className="overflow-y-auto">
      <ul role="list" className="list-none p-0 m-0 space-y-2 p-2">
        {scenes.map((scene) => (
          <li key={scene.name}>
            <button
              onClick={() => handleSceneClick(scene)}
              aria-label={scene.displayName}
              className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
            >
              {scene.previewImageUrl ? (
                <img
                  src={scene.previewImageUrl}
                  alt={scene.displayName}
                  className="w-20 h-20 object-cover rounded-md shrink-0"
                />
              ) : (
                <img
                  src={scenePlaceholder}
                  alt=""
                  aria-hidden="true"
                  className="w-20 h-20 rounded-md shrink-0"
                />
              )}
              <span className="text-sm font-medium">{scene.displayName}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
