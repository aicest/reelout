// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { InMemoryStore } from '@reelout/context/InMemoryStore'
import { expect, test } from 'vitest'

test('initializes empty object for new plugin', () => {
  const store = new InMemoryStore()
  const state = store.get('foo')

  expect(state).toEqual({})
})

test('returns identical object reference across multiple gets', () => {
  const store = new InMemoryStore()
  const first = store.get('foo')
  const second = store.get('foo')

  expect(first).toBe(second)
})

test('isolates unique states among distinct plugins', () => {
  type State = { flag?: boolean }
  const store = new InMemoryStore()
  const a = store.get('foo') as State
  const b = store.get('bar') as State

  a.flag = true

  expect(b.flag).toBe(undefined)
})

test('retains direct state modifications on future retrievals', () => {
  type State = { count?: number }
  const store = new InMemoryStore()
  const state = store.get('foo') as State

  state.count = 42

  const updated = store.get('foo') as State

  expect(updated.count).toBe(42)
})
