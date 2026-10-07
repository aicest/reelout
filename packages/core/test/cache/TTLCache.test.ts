// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { TTLCache } from '@reelout/core'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('stores value and returns it via get and has', () => {
  const cache = new TTLCache<string, number>()

  cache.set('key1', 42, 5_000)

  expect(cache.get('key1')).toBe(42)
  expect(cache.has('key1')).toBe(true)
})

test('expires entry when ttl elapses and removes it from cache', () => {
  const cache = new TTLCache<string, string>()

  cache.set('temp', 'data', 1_000)

  vi.advanceTimersByTime(999)

  expect(cache.has('temp')).toBe(true)

  vi.advanceTimersByTime(1)

  expect(cache.get('temp')).toBeUndefined()
  expect(cache.has('temp')).toBe(false)
})

test('resets ttl when setting an existing key', () => {
  const cache = new TTLCache<string, string>()

  cache.set('refresh', 'initial', 1_000)

  vi.advanceTimersByTime(500)

  cache.set('refresh', 'updated', 1_000)

  vi.advanceTimersByTime(400)

  expect(cache.get('refresh')).toBe('updated')

  vi.advanceTimersByTime(400)

  expect(cache.get('refresh')).toBe('updated')

  vi.advanceTimersByTime(200)

  expect(cache.has('refresh')).toBe(true)

  vi.advanceTimersByTime(800)

  expect(cache.get('refresh')).toBeUndefined()
  expect(cache.has('refresh')).toBe(false)
})

test('refreshes ttl on read to implement sliding expiration', () => {
  const cache = new TTLCache<string, string>()

  cache.set('sliding', 'value', 1_000)

  vi.advanceTimersByTime(800)

  expect(cache.get('sliding')).toBe('value')

  vi.advanceTimersByTime(500)

  expect(cache.has('sliding')).toBe(true)

  vi.advanceTimersByTime(500)

  expect(cache.get('sliding')).toBeUndefined()
})

test('uses default ttl when none is provided', () => {
  const cache = new TTLCache<string, string>()

  cache.set('defaultKey', 'defaultValue')

  vi.advanceTimersByTime(59_999)

  expect(cache.has('defaultKey')).toBe(true)

  vi.advanceTimersByTime(1)

  expect(cache.get('defaultKey')).toBeUndefined()
})

test('deletes entry and clears its timer', () => {
  const cache = new TTLCache<string, string>()

  cache.set('manual', 'payload', 5_000)

  expect(cache.delete('manual')).toBe(true)
  expect(cache.get('manual')).toBeUndefined()
  expect(cache.delete('non-existent')).toBe(false)
  expect(vi.getTimerCount()).toBe(0)
})

test('clears all entries and their timers', () => {
  const cache = new TTLCache<string, string>()

  cache.set('a', '1', 5_000)
  cache.set('b', '2', 10_000)
  cache.clear()

  expect(cache.get('a')).toBeUndefined()
  expect(cache.get('b')).toBeUndefined()
  expect(vi.getTimerCount()).toBe(0)
})
