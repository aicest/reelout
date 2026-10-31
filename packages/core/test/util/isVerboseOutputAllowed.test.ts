// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../../test/mock/env'

import { isVerboseOutputAllowed } from '@reelout/core'
import { Writable } from 'node:stream'
import { expect, test } from 'vitest'

function createStream(isTTY?: unknown): NodeJS.WritableStream {
  return Object.assign(new Writable(), { isTTY })
}

test('returns true when a TTY is attached outside of CI', () => {
  expect(isVerboseOutputAllowed(createStream(true), {})).toBe(true)
})

test('returns false when a plain pipe is used outside of CI', () => {
  expect(isVerboseOutputAllowed(createStream(), {})).toBe(false)
  expect(isVerboseOutputAllowed(createStream(false), {})).toBe(false)
  expect(isVerboseOutputAllowed(undefined, {})).toBe(false)
})

test('returns true in CI even without a TTY so the job log keeps the output', () => {
  expect(isVerboseOutputAllowed(createStream(), { CI: 'true' })).toBe(true)
  expect(isVerboseOutputAllowed(undefined, { CI: '1' })).toBe(true)
  expect(isVerboseOutputAllowed(createStream(true), { CI: 'true' })).toBe(true)
})

test('treats a falsy CI value as not running in CI', () => {
  expect(isVerboseOutputAllowed(createStream(), { CI: 'false' })).toBe(false)
  expect(isVerboseOutputAllowed(createStream(true), { CI: 'false' })).toBe(true)
})

test('returns false when isTTY is truthy but not strictly true', () => {
  expect(isVerboseOutputAllowed(createStream(1), {})).toBe(false)
})
