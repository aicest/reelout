// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { mergeConfig } from '@reelout/config'
import { expect, test } from 'vitest'

test('merges user config with default config', () => {
  const defaultConfig = {
    a: 1,
    b: 2,
    c: 3,
    default: true,
    nested: { x: 1, y: 2 },
    list: [{ x: 1 }, { x: 2 }],
  } as object

  const userConfig = {
    a: 10,
    b: null,
    c: undefined,
    nested: { y: 3 },
    list: [{ x: 3 }],
    extra: true,
  } as object

  expect(mergeConfig(defaultConfig, userConfig)).toEqual({
    a: 10,
    b: null,
    c: 3,
    default: true,
    nested: { y: 3 },
    list: [{ x: 3 }],
    extra: true,
  })

  expect(defaultConfig).toEqual({
    a: 1,
    b: 2,
    c: 3,
    default: true,
    nested: { x: 1, y: 2 },
    list: [{ x: 1 }, { x: 2 }],
  })

  expect(userConfig).toEqual({
    a: 10,
    b: null,
    c: undefined,
    nested: { y: 3 },
    list: [{ x: 3 }],
    extra: true,
  })
})
