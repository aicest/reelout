// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/fs'

import type { Workspace } from '@reelout/core'
import { loadWorkspacePackages } from '@reelout/npm'
import { vol } from 'memfs'
import { beforeEach, expect, test } from 'vitest'

let workspace: Workspace

beforeEach(() => {
  workspace = { entry: '.', members: null }
})

test('returns empty array when not configured', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({ version: '1.0.0' }),
    '/repo/pnpm-workspace.yaml': '',
  })

  expect(await loadWorkspacePackages('/repo', workspace)).toMatchInlineSnapshot(
    `[]`
  )
})

test('returns packages matching patterns sorted', async () => {
  workspace.entry = '.'
  workspace.members = ['packages/*']

  vol.fromJSON({
    '/repo/package.json': JSON.stringify({
      version: '0.0.0',
      workspaces: ['packages/*'],
    }),
    '/repo/packages/pkg1/package.json': JSON.stringify({
      name: 'pkg1',
      version: '1.0.0',
    }),
    '/repo/packages/pkg2/package.json': JSON.stringify({
      name: 'pkg2',
      version: '2.0.0',
    }),
  })

  expect(await loadWorkspacePackages('/repo', workspace))
    .toMatchInlineSnapshot(`
      [
        {
          "status": "fulfilled",
          "value": {
            "dependencies": [],
            "entry": false,
            "files": "packages/pkg1/**/*",
            "location": "packages/pkg1",
            "name": "pkg1",
            "private": undefined,
            "root": false,
            "version": "1.0.0",
          },
        },
        {
          "status": "fulfilled",
          "value": {
            "dependencies": [],
            "entry": false,
            "files": "packages/pkg2/**/*",
            "location": "packages/pkg2",
            "name": "pkg2",
            "private": undefined,
            "root": false,
            "version": "2.0.0",
          },
        },
      ]
    `)
})

test('skips invalid packages and rejects unparsable entries', async () => {
  workspace.entry = '.'
  workspace.members = ['packages/*']

  vol.fromJSON({
    '/repo/packages/pkg1/package.json': JSON.stringify({ version: '1.0.0' }),
    '/repo/packages/pkg2/package.json': JSON.stringify({}),
    '/repo/packages/pkg3/package.json': 'not a json',
  })

  expect(await loadWorkspacePackages('/repo', workspace))
    .toMatchInlineSnapshot(`
      [
        {
          "status": "fulfilled",
          "value": {
            "dependencies": [],
            "entry": false,
            "files": "packages/pkg1/**/*",
            "location": "packages/pkg1",
            "name": undefined,
            "private": undefined,
            "root": false,
            "version": "1.0.0",
          },
        },
        {
          "reason": [Error: Package version "undefined" in "packages/pkg2" is not a valid semantic version.],
          "status": "rejected",
        },
        {
          "reason": [Error: JSON file at "[1m/repo/packages/pkg3/package.json[22m" could not be parsed.],
          "status": "rejected",
        },
      ]
    `)
})
