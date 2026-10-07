// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../../../test/mock/fs'

import { writeChangelog, type ReleasePlan } from '@reelout/core'
import { vol } from 'memfs'
import { expect, test } from 'vitest'

test('does not write changelog when release content is empty', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({}),
    '/repo/packages/foo/package.json': JSON.stringify({}),
  })

  await writeChangelog('/repo', {
    package: { location: '.' },
    release: null,
  } as ReleasePlan)

  await writeChangelog('/repo', {
    package: { location: 'packages/foo', changelogFile: 'changelog.md' },
    release: null,
  } as ReleasePlan)

  expect(vol.toJSON()).toMatchInlineSnapshot(`
    {
      "/repo/package.json": "{}",
      "/repo/packages/foo/package.json": "{}",
    }
  `)
})

test('writes changelog content under the title', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({}),
    '/repo/packages/foo/package.json': JSON.stringify({}),
  })

  await writeChangelog('/repo', {
    package: { location: '.' },
    release: { changelog: `## 1.0.0\n\n### Features\n\n- add new feature\n` },
  } as ReleasePlan)

  await writeChangelog('/repo', {
    package: { location: 'packages/foo', changelogFile: 'changelog.md' },
    release: { changelog: '## 1.2.3\n\n### Bug Fixes\n\n- fix bug\n' },
  } as ReleasePlan)

  expect(vol.toJSON()).toMatchInlineSnapshot(`
    {
      "/repo/CHANGELOG.md": "# Changelog

    ## 1.0.0

    ### Features

    - add new feature
    ",
      "/repo/package.json": "{}",
      "/repo/packages/foo/changelog.md": "# Changelog

    ## 1.2.3

    ### Bug Fixes

    - fix bug
    ",
      "/repo/packages/foo/package.json": "{}",
    }
  `)
})
