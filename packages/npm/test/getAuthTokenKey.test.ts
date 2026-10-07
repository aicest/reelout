// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { getAuthTokenKey } from '@reelout/npm'
import { expect, test } from 'vitest'

test('normalizes a registry URL to an auth token storage key', async () => {
  expect(getAuthTokenKey('https://registry.npmjs.org/')).toBe(
    '//registry.npmjs.org/:_authToken'
  )
})
