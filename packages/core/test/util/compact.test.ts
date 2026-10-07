// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { compact } from '@reelout/core'
import { expect, test } from 'vitest'

test('removes null and undefined values', () => {
  expect(compact(['str', '', 0, 0n, false, null, undefined])).toEqual([
    'str',
    '',
    0,
    0n,
    false,
  ])
})
