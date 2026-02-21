import type { SceneTemplate, SceneOverrides, SceneQueueItem } from '../types/scene'
import type { Environment } from '../types/environment'
import type {
  TechDefaults,
  TechSettingsOverrides,
  GlobalSettings,
  DrawerState,
  LoadingState,
} from '../types/settings'

export interface AppState {
  scenes: SceneTemplate[]
  environments: Environment[]
  techDefaults: TechDefaults | null
  globalSettings: GlobalSettings
  techSettingsOverrides: TechSettingsOverrides
  sceneQueue: SceneQueueItem[]
  drawerState: DrawerState
  loadingState: LoadingState
  error: string | null
}

export type AppAction =
  | { type: 'SET_LIBRARY_DATA'; payload: { scenes: SceneTemplate[]; environments: Environment[]; techDefaults: TechDefaults } }
  | { type: 'SET_CHARACTER_NAME'; payload: string }
  | { type: 'SELECT_ENVIRONMENT'; payload: Environment | null }
  | { type: 'UPDATE_TECH_OVERRIDE'; payload: TechSettingsOverrides }
  | { type: 'ADD_SCENE_TO_QUEUE'; payload: SceneTemplate }
  | { type: 'REMOVE_SCENE_FROM_QUEUE'; payload: string }
  | { type: 'UPDATE_SCENE_OVERRIDE'; payload: { id: string; overrides: SceneOverrides } }
  | { type: 'OPEN_DRAWER'; payload: string }
  | { type: 'CLOSE_DRAWER' }
  | { type: 'SET_LOADING'; payload: Partial<LoadingState> }
  | { type: 'SET_ERROR'; payload: string | null }

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LIBRARY_DATA':
      return {
        ...state,
        scenes: action.payload.scenes,
        environments: action.payload.environments,
        techDefaults: action.payload.techDefaults,
      }

    case 'SET_CHARACTER_NAME':
      return {
        ...state,
        globalSettings: {
          ...state.globalSettings,
          characterName: action.payload,
        },
      }

    case 'SELECT_ENVIRONMENT':
      return {
        ...state,
        globalSettings: {
          ...state.globalSettings,
          selectedEnvironment: action.payload,
        },
      }

    case 'UPDATE_TECH_OVERRIDE':
      return {
        ...state,
        techSettingsOverrides: action.payload,
      }

    case 'ADD_SCENE_TO_QUEUE': {
      const newItem: SceneQueueItem = {
        id: crypto.randomUUID(),
        templateName: action.payload.name,
        displayName: action.payload.displayName,
        overrides: {},
      }
      return {
        ...state,
        sceneQueue: [...state.sceneQueue, newItem],
      }
    }

    case 'REMOVE_SCENE_FROM_QUEUE':
      return {
        ...state,
        sceneQueue: state.sceneQueue.filter((item) => item.id !== action.payload),
      }

    case 'UPDATE_SCENE_OVERRIDE':
      return {
        ...state,
        sceneQueue: state.sceneQueue.map((item) =>
          item.id === action.payload.id
            ? { ...item, overrides: action.payload.overrides }
            : item
        ),
      }

    case 'OPEN_DRAWER':
      return {
        ...state,
        drawerState: {
          isOpen: true,
          sceneId: action.payload,
        },
      }

    case 'CLOSE_DRAWER':
      return {
        ...state,
        drawerState: {
          isOpen: false,
          sceneId: null,
        },
      }

    case 'SET_LOADING':
      return {
        ...state,
        loadingState: {
          ...state.loadingState,
          ...action.payload,
        },
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      }
  }
}
