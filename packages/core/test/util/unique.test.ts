// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { unique } from '@reelout/core'
import { expect, test } from 'vitest'

test('removes duplicates and preserves first occurrence order', () => {
  const a = { x: 1 }
  const b = { x: 1 }

  expect([]).toEqual([])
  expect(unique([1, 1, 2])).toEqual([1, 2])
  expect(unique([1, 2, 1, 3, 2, 4])).toEqual([1, 2, 3, 4])
  expect(unique(['a', 'b', 'a', '1', 1, '1'])).toEqual(['a', 'b', '1', 1])
  expect(unique([true, false, true, false])).toEqual([true, false])
  expect(unique([null, undefined, null, undefined])).toEqual([null, undefined])
  expect(unique([a, b, a, b])).toEqual([a, b])
})
