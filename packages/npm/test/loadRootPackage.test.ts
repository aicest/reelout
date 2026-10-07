// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/fs'

import type { Workspace } from '@reelout/core'
import { loadRootPackage } from '@reelout/npm'
import { vol } from 'memfs'
import { beforeEach, expect, test } from 'vitest'

let workspace: Workspace

beforeEach(() => {
  workspace = { entry: '.', members: null }
})

test('returns root package when exists', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({ version: '2.0.0' }),
  })

  expect(await loadRootPackage('/repo', workspace)).toMatchInlineSnapshot(`
    {
      "status": "fulfilled",
      "value": {
        "dependencies": [],
        "entry": true,
        "files": "**/*",
        "location": ".",
        "name": undefined,
        "private": undefined,
        "root": true,
        "version": "2.0.0",
      },
    }
  `)
})

test('returns rejected result when cannot read', async () => {
  expect(await loadRootPackage('/repo', workspace)).toMatchInlineSnapshot(`
    {
      "reason": [Error: JSON file at "[1m/repo/package.json[22m" could not be read.],
      "status": "rejected",
    }
  `)
})
