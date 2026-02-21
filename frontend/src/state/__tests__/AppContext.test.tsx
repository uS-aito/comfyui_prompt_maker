/**
 * AppContext / AppProvider ユニットテスト (タスク 6.2)
 *
 * AppProvider が状態を提供し、dispatch で状態遷移することを検証する
 */

import { render, screen, act } from '@testing-library/react'
import { useAppContext, AppProvider } from '../AppContext'

// useAppContext を使用するテスト用コンポーネント
function TestConsumer() {
  const { state, dispatch } = useAppContext()
  return (
    <div>
      <span data-testid="character-name">{state.globalSettings.characterName}</span>
      <span data-testid="queue-length">{state.sceneQueue.length}</span>
      <span data-testid="error">{state.error ?? 'no-error'}</span>
      <button
        onClick={() => dispatch({ type: 'SET_CHARACTER_NAME', payload: 'Haru' })}
        data-testid="set-name-btn"
      >
        Set Name
      </button>
      <button
        onClick={() =>
          dispatch({
            type: 'ADD_SCENE_TO_QUEUE',
            payload: {
              name: 'studying',
              displayName: '勉強シーン',
              positivePrompt: 'sitting at desk',
              negativePrompt: '',
              batchSize: 1,
              previewImageUrl: null,
            },
          })
        }
        data-testid="add-scene-btn"
      >
        Add Scene
      </button>
      <button
        onClick={() => dispatch({ type: 'SET_ERROR', payload: 'テストエラー' })}
        data-testid="set-error-btn"
      >
        Set Error
      </button>
    </div>
  )
}

// Provider なしで useAppContext を呼ぶコンポーネント（エラー確認用）
function TestConsumerWithoutProvider() {
  try {
    useAppContext()
    return <div data-testid="no-throw">OK</div>
  } catch (e) {
    return <div data-testid="threw-error">{(e as Error).message}</div>
  }
}

describe('AppProvider', () => {
  it('子コンポーネントをレンダリングする', () => {
    render(
      <AppProvider>
        <div data-testid="child">child content</div>
      </AppProvider>
    )
    expect(screen.getByTestId('child')).toBeDefined()
  })

  it('初期状態でキャラクター名が空文字', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    expect(screen.getByTestId('character-name').textContent).toBe('')
  })

  it('初期状態でキューが空', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    expect(screen.getByTestId('queue-length').textContent).toBe('0')
  })

  it('初期状態でエラーが null', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    expect(screen.getByTestId('error').textContent).toBe('no-error')
  })
})

describe('useAppContext', () => {
  it('dispatch で SET_CHARACTER_NAME を実行すると状態が更新される', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    act(() => {
      screen.getByTestId('set-name-btn').click()
    })
    expect(screen.getByTestId('character-name').textContent).toBe('Haru')
  })

  it('dispatch で ADD_SCENE_TO_QUEUE を実行するとキューが増える', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    act(() => {
      screen.getByTestId('add-scene-btn').click()
    })
    expect(screen.getByTestId('queue-length').textContent).toBe('1')
  })

  it('dispatch で SET_ERROR を実行するとエラーが設定される', () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )
    act(() => {
      screen.getByTestId('set-error-btn').click()
    })
    expect(screen.getByTestId('error').textContent).toBe('テストエラー')
  })

  it('AppProvider の外で useAppContext を呼ぶとエラーをスローする', () => {
    // console.error を一時的に抑制
    const consoleError = console.error
    console.error = () => {}
    render(<TestConsumerWithoutProvider />)
    console.error = consoleError

    expect(screen.getByTestId('threw-error').textContent).toContain(
      'useAppContext must be used within an AppProvider'
    )
  })
})
