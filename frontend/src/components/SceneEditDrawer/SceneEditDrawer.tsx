import type { Dispatch } from 'react'
import type { SceneQueueItem, SceneOverrides } from '../../types/scene'
import type { DefaultPrompts } from '../../types/settings'
import type { AppAction } from '../../state/reducer'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../ui/sheet'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'

interface SceneEditDrawerProps {
  isOpen: boolean
  scene: SceneQueueItem | null
  defaults: DefaultPrompts
  dispatch: Dispatch<AppAction>
}

export function SceneEditDrawer({ isOpen, scene, defaults, dispatch }: SceneEditDrawerProps) {
  const handleClose = () => {
    dispatch({ type: 'CLOSE_DRAWER' })
  }

  const handleChange = (field: keyof SceneOverrides, value: string | number | undefined) => {
    if (!scene) return
    const overrides = scene.overrides
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

  const overrides = scene?.overrides ?? {}
  const displayName = overrides.name ?? scene?.displayName ?? ''

  return (
    <Sheet
      open={isOpen && scene !== null}
      onOpenChange={(open) => { if (!open) dispatch({ type: 'CLOSE_DRAWER' }) }}
    >
      <SheetContent side="right" showCloseButton={false} className="flex flex-col w-[400px] sm:max-w-[400px]">
        {scene && (
          <>
            <SheetHeader className="flex-row items-center justify-between">
              <SheetTitle>シーン名：{displayName} の編集</SheetTitle>
              <Button variant="ghost" size="icon" aria-label="閉じる" onClick={handleClose}>
                ×
              </Button>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 space-y-4">
              <div>
                <label htmlFor="drawer-scene-name" className="block text-sm font-medium mb-1">シーン名</label>
                <Input
                  id="drawer-scene-name"
                  type="text"
                  value={overrides.name ?? ''}
                  placeholder={scene.displayName}
                  onChange={(e) => handleChange('name', e.target.value || undefined)}
                />
              </div>

              <div>
                <label htmlFor="drawer-positive-prompt" className="block text-sm font-medium mb-1">ポジティブプロンプト</label>
                <Textarea
                  id="drawer-positive-prompt"
                  value={overrides.positivePrompt ?? ''}
                  placeholder={defaults.positivePrompt}
                  onChange={(e) => handleChange('positivePrompt', e.target.value || undefined)}
                />
              </div>

              <div>
                <label htmlFor="drawer-negative-prompt" className="block text-sm font-medium mb-1">ネガティブプロンプト</label>
                <Textarea
                  id="drawer-negative-prompt"
                  value={overrides.negativePrompt ?? ''}
                  placeholder={defaults.negativePrompt}
                  onChange={(e) => handleChange('negativePrompt', e.target.value || undefined)}
                />
              </div>

              <div>
                <label htmlFor="drawer-batch-size" className="block text-sm font-medium mb-1">バッチサイズ</label>
                <Input
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

            <SheetFooter>
              <Button onClick={handleClose}>完了</Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
