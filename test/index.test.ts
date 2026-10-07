// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import * as module from 'reelout'
import { expect, test } from 'vitest'

test('exposes the correct API contract', () => {
  expect(Object.keys(module).sort()).toMatchInlineSnapshot(`
    [
      "execCommand",
      "execGit",
      "formatError",
      "formatFile",
      "interpolate",
    ]
  `)
})
