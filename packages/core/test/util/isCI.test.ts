// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../../test/mock/env'

import { isCI } from '@reelout/core'
import { expect, test, vi } from 'vitest'

test('returns true when CI flag is enabled', () => {
  vi.stubEnv('CI', 'true')
  expect(isCI(process.env)).toBe(true)

  vi.stubEnv('CI', '1')
  expect(isCI(process.env)).toBe(true)
})

test('returns false when CI flag is disabled or absent', () => {
  vi.stubEnv('CI', 'false')
  expect(isCI(process.env)).toBe(false)

  vi.stubEnv('CI', '0')
  expect(isCI(process.env)).toBe(false)

  vi.stubEnv('CI', '')
  expect(isCI(process.env)).toBe(false)
})
