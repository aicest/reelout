// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../../test/mock/env'

import { isQuietEnvironment } from '@reelout/core'
import { Writable } from 'node:stream'
import { expect, test } from 'vitest'

function createContext(stdout: NodeJS.WritableStream, env = {}) {
  return { env, stdout }
}

function createStream(isTTY?: unknown): NodeJS.WritableStream {
  return Object.assign(new Writable(), { isTTY })
}

test('stays loud when a TTY is attached outside of CI', () => {
  expect(isQuietEnvironment(createContext(createStream(true)))).toBe(false)
})

test('stays quiet when a plain pipe is used outside of CI', () => {
  expect(isQuietEnvironment(createContext(createStream()))).toBe(true)
  expect(isQuietEnvironment(createContext(createStream(false)))).toBe(true)
})

test('stays loud in CI even without a TTY so the job log keeps the output', () => {
  const env = { CI: 'true' }

  expect(isQuietEnvironment(createContext(createStream(), env))).toBe(false)
  expect(isQuietEnvironment(createContext(createStream(true), env))).toBe(false)
})

test('treats a falsy CI value as not running in CI', () => {
  const env = { CI: 'false' }

  expect(isQuietEnvironment(createContext(createStream(), env))).toBe(true)
  expect(isQuietEnvironment(createContext(createStream(true), env))).toBe(false)
})

test('stays quiet when isTTY is truthy but not strictly true', () => {
  expect(isQuietEnvironment(createContext(createStream(1)))).toBe(true)
})
