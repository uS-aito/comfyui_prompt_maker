import { useEffect } from 'react'
import { AppProvider, useAppContext } from './state/AppContext'
import { fetchScenes, fetchEnvironments, fetchTechDefaults } from './api/client'
import { SceneLibraryPanel } from './components/SceneLibraryPanel/SceneLibraryPanel'
import { GlobalSettingsPanel } from './components/GlobalSettingsPanel/GlobalSettingsPanel'
import { TechSettingsPanel } from './components/TechSettingsPanel/TechSettingsPanel'
import { SceneQueuePanel } from './components/SceneQueuePanel/SceneQueuePanel'
import { SceneEditDrawer } from './components/SceneEditDrawer/SceneEditDrawer'
import type { DefaultPrompts } from './types/settings'

const EMPTY_DEFAULT_PROMPTS: DefaultPrompts = {
  basePositivePrompt: '',
  environmentPrompt: '',
  positivePrompt: '',
  negativePrompt: '',
  batchSize: 1,
}

function AppContent() {
  const { state, dispatch } = useAppContext()

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: { library: true } })
    Promise.all([fetchScenes(), fetchEnvironments(), fetchTechDefaults()])
      .then(([scenes, environments, techDefaults]) => {
        dispatch({ type: 'SET_LIBRARY_DATA', payload: { scenes, environments, techDefaults } })
      })
      .catch(() => {
        dispatch({ type: 'SET_ERROR', payload: '初期データの取得に失敗しました' })
      })
      .finally(() => {
        dispatch({ type: 'SET_LOADING', payload: { library: false } })
      })
  }, [dispatch])

  const { drawerState, sceneQueue, techDefaults } = state
  const scene = sceneQueue.find(item => item.id === drawerState.sceneId) ?? null
  const defaults = techDefaults?.workflowConfig.defaultPrompts ?? EMPTY_DEFAULT_PROMPTS

  return (
    <>
      <div className="flex h-screen bg-background text-foreground">
        {/* 左ペイン: グローバル設定 + 技術設定 */}
        <div className="w-[300px] shrink-0 overflow-y-auto border-r border-border p-4">
          <GlobalSettingsPanel />
          <TechSettingsPanel />
        </div>

        {/* 中央ペイン: シーンライブラリ */}
        <div className="flex-1 overflow-y-auto p-4">
          <SceneLibraryPanel />
        </div>

        {/* 右ペイン: シーンキュー */}
        <div className="w-[300px] shrink-0 overflow-y-auto border-l border-border p-4">
          <SceneQueuePanel />
        </div>
      </div>

      <SceneEditDrawer
        isOpen={drawerState.isOpen}
        scene={scene}
        defaults={defaults}
        dispatch={dispatch}
      />
    </>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
