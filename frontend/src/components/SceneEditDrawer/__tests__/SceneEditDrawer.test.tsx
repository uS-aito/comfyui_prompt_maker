/**
 * SceneEditDrawer ユニットテスト (タスク 10)
 *
 * シーン詳細編集ドロワーの動作を検証する
 * - isOpen=false のとき非表示
 * - isOpen=true のときドロワー本体・タイトル・フォームが表示される
 * - 未変更フィールドに default_prompts 値がプレースホルダとして表示される
 * - 変更時に UPDATE_SCENE_OVERRIDE が即時 dispatch される
 * - 閉じるボタン・完了ボタン・オーバーレイクリックで CLOSE_DRAWER が dispatch される
 * - ドロワー表示中は半透明オーバーレイが表示される
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { SceneEditDrawer } from '../SceneEditDrawer'
import type { SceneQueueItem } from '../../../types/scene'
import type { DefaultPrompts } from '../../../types/settings'

// --- テスト用フィクスチャ ---

const mockDefaults: DefaultPrompts = {
  basePositivePrompt: 'masterpiece, best quality',
  environmentPrompt: 'indoor room',
  positivePrompt: 'default positive prompt',
  negativePrompt: 'lowres, bad anatomy',
  batchSize: 1,
}

const baseScene: SceneQueueItem = {
  id: 'test-id-1',
  templateName: 'studying',
  displayName: '勉強しているシーン',
  overrides: {},
}

const modifiedScene: SceneQueueItem = {
  id: 'test-id-2',
  templateName: 'studying',
  displayName: '勉強しているシーン',
  overrides: {
    positivePrompt: 'modified positive',
    batchSize: 5,
  },
}

// --- 非表示 ---

describe('SceneEditDrawer - 非表示', () => {
  it('isOpen が false の場合、ドロワーが表示されない', () => {
    render(
      <SceneEditDrawer
        isOpen={false}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('isOpen が false の場合、オーバーレイが表示されない', () => {
    render(
      <SceneEditDrawer
        isOpen={false}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    expect(screen.queryByTestId('drawer-overlay')).toBeNull()
  })

  it('scene が null の場合、ドロワーが表示されない', () => {
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={null}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

// --- 表示 ---

describe('SceneEditDrawer - 表示', () => {
  it('isOpen が true の場合、ドロワーが表示される', () => {
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    expect(screen.getByRole('dialog')).toBeDefined()
  })

  it('タイトルにシーン名が含まれる', () => {
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    expect(screen.getByText(/勉強しているシーン.*の編集|の編集.*勉強しているシーン/)).toBeDefined()
  })

  it('シーン名入力フィールドが表示される', () => {
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/^シーン名$/)).toBeDefined()
  })

  it('ポジティブプロンプト入力フィールドが表示される', () => {
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/ポジティブプロンプト/)).toBeDefined()
  })

  it('ネガティブプロンプト入力フィールドが表示される', () => {
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/ネガティブプロンプト/)).toBeDefined()
  })

  it('バッチサイズ入力フィールドが表示される', () => {
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/バッチサイズ/)).toBeDefined()
  })

  it('半透明オーバーレイが表示される', () => {
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    expect(screen.getByTestId('drawer-overlay')).toBeDefined()
  })
})

// --- プレースホルダ表示 ---

describe('SceneEditDrawer - プレースホルダ表示', () => {
  it('overrides がない場合、ポジティブプロンプトに defaults 値がプレースホルダとして表示される', () => {
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    const input = screen.getByLabelText(/ポジティブプロンプト/)
    expect(input.getAttribute('placeholder')).toBe(mockDefaults.positivePrompt)
  })

  it('overrides がない場合、ネガティブプロンプトに defaults 値がプレースホルダとして表示される', () => {
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    const input = screen.getByLabelText(/ネガティブプロンプト/)
    expect(input.getAttribute('placeholder')).toBe(mockDefaults.negativePrompt)
  })

  it('overrides がない場合、バッチサイズに defaults 値がプレースホルダとして表示される', () => {
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    const input = screen.getByLabelText(/バッチサイズ/)
    expect(input.getAttribute('placeholder')).toBe(String(mockDefaults.batchSize))
  })

  it('overrides に positivePrompt がある場合、その値が入力フィールドに表示される', () => {
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={modifiedScene}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    const input = screen.getByLabelText(/ポジティブプロンプト/) as HTMLTextAreaElement
    expect(input.value).toBe('modified positive')
  })

  it('overrides に batchSize がある場合、その値が入力フィールドに表示される', () => {
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={modifiedScene}
        defaults={mockDefaults}
        dispatch={vi.fn()}
      />
    )
    const input = screen.getByLabelText(/バッチサイズ/) as HTMLInputElement
    expect(input.value).toBe('5')
  })
})

// --- 編集とオートセーブ ---

describe('SceneEditDrawer - 編集とオートセーブ', () => {
  it('ポジティブプロンプトを変更すると UPDATE_SCENE_OVERRIDE が dispatch される', () => {
    const dispatch = vi.fn()
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={dispatch}
      />
    )
    const input = screen.getByLabelText(/ポジティブプロンプト/)
    fireEvent.change(input, { target: { value: 'new positive prompt' } })
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_SCENE_OVERRIDE',
      payload: {
        id: baseScene.id,
        overrides: expect.objectContaining({ positivePrompt: 'new positive prompt' }),
      },
    })
  })

  it('ネガティブプロンプトを変更すると UPDATE_SCENE_OVERRIDE が dispatch される', () => {
    const dispatch = vi.fn()
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={dispatch}
      />
    )
    const input = screen.getByLabelText(/ネガティブプロンプト/)
    fireEvent.change(input, { target: { value: 'new negative prompt' } })
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_SCENE_OVERRIDE',
      payload: {
        id: baseScene.id,
        overrides: expect.objectContaining({ negativePrompt: 'new negative prompt' }),
      },
    })
  })

  it('バッチサイズを変更すると UPDATE_SCENE_OVERRIDE が dispatch される', () => {
    const dispatch = vi.fn()
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={dispatch}
      />
    )
    const input = screen.getByLabelText(/バッチサイズ/)
    fireEvent.change(input, { target: { value: '3' } })
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_SCENE_OVERRIDE',
      payload: {
        id: baseScene.id,
        overrides: expect.objectContaining({ batchSize: 3 }),
      },
    })
  })

  it('シーン名を変更すると UPDATE_SCENE_OVERRIDE が dispatch される', () => {
    const dispatch = vi.fn()
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={dispatch}
      />
    )
    const input = screen.getByLabelText(/^シーン名$/)
    fireEvent.change(input, { target: { value: '新しいシーン名' } })
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_SCENE_OVERRIDE',
      payload: {
        id: baseScene.id,
        overrides: expect.objectContaining({ name: '新しいシーン名' }),
      },
    })
  })

  it('ポジティブプロンプトを空にすると overrides から positivePrompt が除去される', () => {
    const dispatch = vi.fn()
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={modifiedScene}
        defaults={mockDefaults}
        dispatch={dispatch}
      />
    )
    const input = screen.getByLabelText(/ポジティブプロンプト/)
    fireEvent.change(input, { target: { value: '' } })
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_SCENE_OVERRIDE',
      payload: {
        id: modifiedScene.id,
        overrides: expect.not.objectContaining({ positivePrompt: expect.anything() }),
      },
    })
  })
})

// --- 閉じる操作 ---

describe('SceneEditDrawer - 閉じる操作', () => {
  it('閉じるボタンをクリックすると CLOSE_DRAWER が dispatch される', () => {
    const dispatch = vi.fn()
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={dispatch}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /閉じる/ }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE_DRAWER' })
  })

  it('完了ボタンをクリックすると CLOSE_DRAWER が dispatch される', () => {
    const dispatch = vi.fn()
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={dispatch}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /完了/ }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE_DRAWER' })
  })

  it('オーバーレイをクリックすると CLOSE_DRAWER が dispatch される', () => {
    const dispatch = vi.fn()
    render(
      <SceneEditDrawer
        isOpen={true}
        scene={baseScene}
        defaults={mockDefaults}
        dispatch={dispatch}
      />
    )
    fireEvent.click(screen.getByTestId('drawer-overlay'))
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE_DRAWER' })
  })
})
