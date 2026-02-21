import type { SceneQueueItem, SceneOverrides } from '../../types/scene'

interface QueueCardProps {
  item: SceneQueueItem
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function QueueCard({ item, onEdit, onDelete }: QueueCardProps) {
  const isModified = Object.keys(item.overrides).some(
    k => item.overrides[k as keyof SceneOverrides] !== undefined
  )

  const displayName = item.overrides.name ?? item.displayName

  const badges: string[] = []
  if (item.overrides.positivePrompt !== undefined || item.overrides.negativePrompt !== undefined) {
    badges.push('Prompt Modified')
  }
  if (item.overrides.batchSize !== undefined) {
    badges.push(`Batch: ${item.overrides.batchSize}`)
  }

  return (
    <div
      data-modified={isModified ? 'true' : 'false'}
      style={{
        borderLeft: isModified ? '4px solid #3b82f6' : '4px solid transparent',
        display: 'flex',
        alignItems: 'flex-start',
        cursor: 'pointer',
        padding: '8px',
      }}
      onClick={() => onEdit(item.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(item.id) }}
      aria-label={displayName}
    >
      <div style={{ flex: 1 }}>
        <div>{displayName}</div>
        {isModified && badges.length > 0 && (
          <div>
            {badges.map(badge => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        )}
      </div>
      <button
        aria-label={`${displayName}を削除`}
        onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
      >
        ×
      </button>
    </div>
  )
}
