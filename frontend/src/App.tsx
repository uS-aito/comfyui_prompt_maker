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
      <div style={{ display: 'flex', height: '100%' }}>
        {/* 左ペイン: グローバル設定 + 技術設定 */}
        <div style={{ flex: '0 0 300px', overflowY: 'auto' }}>
          <GlobalSettingsPanel />
          <TechSettingsPanel />
        </div>

        {/* 中央ペイン: シーンライブラリ */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <SceneLibraryPanel />
        </div>

        {/* 右ペイン: シーンキュー */}
        <div style={{ flex: '0 0 300px', overflowY: 'auto' }}>
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
