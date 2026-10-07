// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../../../test/mock/fs'

import { prependChangelog } from '@reelout/core'
import { vol } from 'memfs'
import { expect, test } from 'vitest'

test('creates changelog with default title if missing', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({}),
  })

  await prependChangelog(
    '/repo/CHANGELOG.md',
    '## 1.0.0\n\n### Features\n\n- add new feature\n'
  )

  expect(vol.toJSON()).toEqual({
    '/repo/package.json': JSON.stringify({}),
    '/repo/CHANGELOG.md': `# Changelog\n\n## 1.0.0\n\n### Features\n\n- add new feature\n`,
  })
})

test('prepends new revision after existing title', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({}),
    '/repo/CHANGELOG.md': `# Existing Title\n\n## 1.0.0\n\n### Features\n\n- add new feature\n`,
  })

  await prependChangelog(
    '/repo/CHANGELOG.md',
    `## 1.0.1\n\n### Bug Fixes\n\n- fix bug\n`
  )

  expect(vol.toJSON()).toEqual({
    '/repo/package.json': JSON.stringify({}),
    '/repo/CHANGELOG.md': `# Existing Title\n\n## 1.0.1\n\n### Bug Fixes\n\n- fix bug\n\n## 1.0.0\n\n### Features\n\n- add new feature\n`,
  })
})
