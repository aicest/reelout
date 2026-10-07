// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { createProcessAbortSignal } from '@reelout/cli'
import { expect, test, vi } from 'vitest'

test('returns an AbortSignal containing a controller and a disposable cleanup method in a non-aborted state', () => {
  using signal = createProcessAbortSignal()

  expect(signal).toBeInstanceOf(AbortSignal)
  expect(signal.controller).toBeInstanceOf(AbortController)
  expect(typeof signal[Symbol.dispose]).toBe('function')
  expect(signal.aborted).toBe(false)
})

test('registers and cleans up process event listeners for SIGINT and SIGTERM during initialization and disposal', () => {
  using spy1 = vi.spyOn(process, 'on')
  using spy2 = vi.spyOn(process, 'off')

  using signal = createProcessAbortSignal()

  expect(spy1).toHaveBeenCalledWith('SIGINT', expect.any(Function))
  expect(spy1).toHaveBeenCalledWith('SIGTERM', expect.any(Function))

  {
    using _ = signal
  }

  expect(spy2).toHaveBeenCalledWith('SIGINT', expect.any(Function))
  expect(spy2).toHaveBeenCalledWith('SIGTERM', expect.any(Function))
})

test('aborts the signal automatically when disposed if not already aborted', () => {
  using signal = createProcessAbortSignal()

  expect(signal.aborted).toBe(false)

  {
    using _ = signal
  }

  expect(signal.aborted).toBe(true)
})

test('aborts the signal when a SIGINT or SIGTERM process event is emitted', () => {
  using signal = createProcessAbortSignal()

  expect(signal.aborted).toBe(false)

  process.emit('SIGINT')

  expect(signal.aborted).toBe(true)
})
