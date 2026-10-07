// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isDefined } from '@reelout/core'
import { expect, test } from 'vitest'

test('filters nullish keeping falsy', () => {
  expect(['str', '', 0, 0n, false, null, undefined].filter(isDefined)).toEqual([
    'str',
    '',
    0,
    0n,
    false,
  ])
})
