import { vi } from 'vitest'

// Radix UI コンポーネントは jsdom に未実装のポインターキャプチャ API を使用する
// Select, Popover, DropdownMenu などのテストで必要
Element.prototype.hasPointerCapture = vi.fn(() => false)
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()

// Radix Select は選択済みアイテムにスクロールする際に scrollIntoView を呼ぶ
// jsdom では未実装のため、no-op でモックする
Element.prototype.scrollIntoView = vi.fn()
