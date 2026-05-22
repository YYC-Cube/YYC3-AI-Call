import { beforeAll } from 'vitest'

beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    const store: Record<string, string> = {}
    globalThis.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { Object.keys(store).forEach(k => delete store[k]) },
      get length() { return Object.keys(store).length },
      key: (i: number) => Object.keys(store)[i] ?? null,
    } as Storage
  }

  if (typeof globalThis.KeyboardEvent === 'undefined') {
    globalThis.KeyboardEvent = class KeyboardEvent extends Event {
      key: string
      code: string
      ctrlKey: boolean
      shiftKey: boolean
      altKey: boolean
      metaKey: boolean
      constructor(type: string, init: any = {}) {
        super(type)
        this.key = init.key ?? ''
        this.code = init.code ?? ''
        this.ctrlKey = init.ctrlKey ?? false
        this.shiftKey = init.shiftKey ?? false
        this.altKey = init.altKey ?? false
        this.metaKey = init.metaKey ?? false
      }
    } as any
  }

  if (typeof globalThis.document === 'undefined') {
    const styleMap: Record<string, string> = {}
    globalThis.document = {
      documentElement: {
        style: {
          setProperty: (name: string, value: string) => { styleMap[name] = value },
          getPropertyValue: (name: string) => styleMap[name] ?? '',
        },
      },
    } as any
  }

  if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = {
      randomUUID: () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    } as any
  }
})
