// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/fs'

import { readPackageJson } from '@reelout/npm'
import { vol } from 'memfs'
import { expect, test } from 'vitest'

test('returns parsed package.json', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({
      name: 'foo',
      version: '1.2.3',
    }),
  })

  expect(await readPackageJson('/repo')).toEqual({
    name: 'foo',
    version: '1.2.3',
  })
})
