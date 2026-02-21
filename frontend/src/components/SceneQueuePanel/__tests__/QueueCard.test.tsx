/**
 * QueueCard ユニットテスト (タスク 9.1)
 *
 * シーンキュー内の各カードの表示・操作を検証する
 * - シーン名・ステータスバッジの表示
 * - overrides があるときのアクセントライン・変更項目バッジ表示
 * - 削除ボタン（×）クリックで onDelete が呼ばれる
 * - カードクリックで onEdit が呼ばれる
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { QueueCard } from '../QueueCard'
import type { SceneQueueItem } from '../../../types/scene'

// --- テスト用フィクスチャ ---

const baseItem: SceneQueueItem = {
  id: 'test-id-1',
  templateName: 'studying',
  displayName: '勉強しているシーン',
  overrides: {},
}

const modifiedItem: SceneQueueItem = {
  id: 'test-id-2',
  templateName: 'studying',
  displayName: '勉強しているシーン',
  overrides: {
    positivePrompt: 'modified positive',
    batchSize: 5,
  },
}

// --- 基本表示 ---

describe('QueueCard - 基本表示', () => {
  it('シーン名が表示される', () => {
    render(<QueueCard item={baseItem} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('勉強しているシーン')).toBeDefined()
  })

  it('削除ボタンが表示される', () => {
    render(<QueueCard item={baseItem} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByRole('button', { name: /削除/ })).toBeDefined()
  })

  it('overrides が空の場合に data-modified が false', () => {
    const { container } = render(<QueueCard item={baseItem} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const card = container.firstChild as HTMLElement
    expect(card.dataset.modified).toBe('false')
  })

  it('overrides が空の場合に変更項目バッジが表示されない', () => {
    render(<QueueCard item={baseItem} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.queryByText('Prompt Modified')).toBeNull()
    expect(screen.queryByText(/^Batch:/)).toBeNull()
  })
})

// --- overrides のある表示 ---

describe('QueueCard - overrides があるとき', () => {
  it('overrides があるときに data-modified が true', () => {
    const { container } = render(<QueueCard item={modifiedItem} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const card = container.firstChild as HTMLElement
    expect(card.dataset.modified).toBe('true')
  })

  it('positivePrompt が変更されているとき "Prompt Modified" バッジが表示される', () => {
    render(<QueueCard item={modifiedItem} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Prompt Modified')).toBeDefined()
  })

  it('batchSize が変更されているとき "Batch: N" バッジが表示される', () => {
    render(<QueueCard item={modifiedItem} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Batch: 5')).toBeDefined()
  })

  it('negativePrompt が変更されているとき "Prompt Modified" バッジが表示される', () => {
    const itemWithNegPrompt: SceneQueueItem = {
      ...baseItem,
      overrides: { negativePrompt: 'modified negative' },
    }
    render(<QueueCard item={itemWithNegPrompt} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Prompt Modified')).toBeDefined()
  })

  it('overrides.name が設定されているとき上書きシーン名が表示される', () => {
    const itemWithName: SceneQueueItem = {
      ...baseItem,
      overrides: { name: '上書きシーン名' },
    }
    render(<QueueCard item={itemWithName} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('上書きシーン名')).toBeDefined()
  })

  it('overrides.name がなければ元の displayName が表示される', () => {
    render(<QueueCard item={modifiedItem} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('勉強しているシーン')).toBeDefined()
  })
})

// --- インタラクション ---

describe('QueueCard - インタラクション', () => {
  it('削除ボタンをクリックすると onDelete が id とともに呼ばれる', () => {
    const onDelete = vi.fn()
    render(<QueueCard item={baseItem} onEdit={vi.fn()} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: /削除/ }))
    expect(onDelete).toHaveBeenCalledWith(baseItem.id)
  })

  it('削除ボタンをクリックしても onEdit は呼ばれない', () => {
    const onEdit = vi.fn()
    render(<QueueCard item={baseItem} onEdit={onEdit} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /削除/ }))
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('カードをクリックすると onEdit が id とともに呼ばれる', () => {
    const onEdit = vi.fn()
    render(<QueueCard item={baseItem} onEdit={onEdit} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '勉強しているシーン' }))
    expect(onEdit).toHaveBeenCalledWith(baseItem.id)
  })

  it('削除ボタンをクリックするとイベントが親カードに伝播しない', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(<QueueCard item={baseItem} onEdit={onEdit} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: /削除/ }))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onEdit).not.toHaveBeenCalled()
  })
})
