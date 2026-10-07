// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../../test/mock/fs'

import { writeJson } from '@reelout/core'
import { vol } from 'memfs'
import { expect, test } from 'vitest'

test('writes JSON file and creates directories', async () => {
  await writeJson('/repo/a/b/c.json', { foo: 'bar', nested: { a: 1 } })

  expect(vol.toJSON()).toEqual({
    '/repo/a/b/c.json': `${JSON.stringify(
      { foo: 'bar', nested: { a: 1 } },
      null,
      2
    )}\n`,
  })
})
