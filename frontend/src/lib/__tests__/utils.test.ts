import { cn } from '../utils'

describe('cn', () => {
  it('クラス名を結合する', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('falsy な値を無視する', () => {
    expect(cn('foo', false as unknown as string, undefined, 'baz')).toBe('foo baz')
  })

  it('Tailwind の競合クラスを解決する（後のクラスが優先）', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('引数なしで空文字列を返す', () => {
    expect(cn()).toBe('')
  })
})
