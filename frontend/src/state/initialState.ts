import type { AppState } from './reducer'

export const initialState: AppState = {
  scenes: [],
  environments: [],
  techDefaults: null,
  globalSettings: {
    characterName: '',
    selectedEnvironment: null,
  },
  techSettingsOverrides: {
    comfyuiConfig: {},
    workflowConfig: {},
  },
  sceneQueue: [],
  drawerState: {
    isOpen: false,
    sceneId: null,
  },
  loadingState: {
    library: false,
    generating: false,
  },
  error: null,
}
