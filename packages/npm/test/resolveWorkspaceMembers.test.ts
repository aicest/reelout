// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/fs'

import { resolveWorkspaceMembers } from '@reelout/npm'
import { vol } from 'memfs'
import { expect, test } from 'vitest'

test('reads patterns from pnpm-workspace.yaml', async () => {
  const cwd = '/repo'

  vol.fromJSON({
    '/repo/pnpm-workspace.yaml': [
      'packages:',
      "  - 'packages/*'",
      "  - 'apps/*'",
    ].join('\n'),
  })

  const patterns = await resolveWorkspaceMembers(cwd)

  expect(patterns).toEqual(['packages/*', 'apps/*'])
})

test('reads patterns from package.json', async () => {
  const cwd = '/repo'

  vol.fromJSON({
    '/repo/package.json': JSON.stringify({
      version: '1.0.0',
      workspaces: ['packages/*'],
    }),
  })

  const patterns = await resolveWorkspaceMembers(cwd)

  expect(patterns).toEqual(['packages/*'])
})

test('returns null if no patterns are found', async () => {
  const cwd = '/repo'

  vol.fromJSON({
    '/repo/package.json': JSON.stringify({ version: '2.0.0' }),
    '/repo/pnpm-workspace.yaml': '',
  })

  const patterns = await resolveWorkspaceMembers(cwd)

  expect(patterns).toBeNull()
})

test('returns null if no workspace files are present', async () => {
  const cwd = '/repo'

  vol.fromJSON({})

  const patterns = await resolveWorkspaceMembers(cwd)

  expect(patterns).toBeNull()
})
