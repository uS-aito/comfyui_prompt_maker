import { X } from 'lucide-react'
import type { SceneQueueItem, SceneOverrides } from '../../types/scene'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
      className={cn(
        'border rounded-md bg-card p-3 flex items-start cursor-pointer border-l-4',
        isModified ? 'border-l-blue-500' : 'border-l-transparent'
      )}
      onClick={() => onEdit(item.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(item.id) }}
      aria-label={displayName}
    >
      <div className="flex-1">
        <div>{displayName}</div>
        {isModified && badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {badges.map(badge => (
              <Badge key={badge} variant="secondary">{badge}</Badge>
            ))}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`${displayName}を削除`}
        onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
      >
        <X />
      </Button>
    </div>
  )
}
