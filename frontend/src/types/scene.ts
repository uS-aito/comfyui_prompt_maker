export interface SceneTemplate {
  name: string
  displayName: string
  positivePrompt: string
  negativePrompt: string
  batchSize: number
  previewImageUrl: string | null
}

export interface SceneOverrides {
  name?: string
  positivePrompt?: string
  negativePrompt?: string
  batchSize?: number
}

export interface SceneQueueItem {
  id: string
  templateName: string
  displayName: string
  overrides: SceneOverrides
}
