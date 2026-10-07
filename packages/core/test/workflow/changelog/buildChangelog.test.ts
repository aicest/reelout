// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { buildChangelog, formatFile } from '@reelout/core'
import { vol } from 'memfs'
import { beforeEach, expect, test, vi } from 'vitest'
import { context, repository } from '../../../../../test/mock/context'
import { createMockCommit } from '../../../../../test/mock/git'

vi.mock(import('@reelout/core/util/formatFile'), async (importActual) => ({
  formatFile: vi.fn((await importActual()).formatFile),
}))

beforeEach(() => {
  vi.resetAllMocks()
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({ version: '1.0.0' }),
    '/repo/CHANGELOG.md': '',
  })
})

test('omits version header when release version is missing', async () => {
  const commits = [
    await createMockCommit(
      'a1b2c3d',
      'feat(auth): add OAuth2 provider support'
    ),
    await createMockCommit(
      '4e5f6a7',
      'fix(db): resolve connection pool leak under high load'
    ),
  ]

  const result = await buildChangelog(context, commits)

  expect(result).toMatchInlineSnapshot(`
    "### Features

    - **auth:** add OAuth2 provider support a1b2c3d

    ### Bug Fixes

    - **db:** resolve connection pool leak under high load 4e5f6a7
    "
  `)
})

test('groups commits by type and includes breaking changes section when version is provided', async () => {
  const result = await buildChangelog(
    context,
    [
      await createMockCommit(
        'a1b2c3d',
        'feat(auth): add OAuth2 provider support'
      ),
      await createMockCommit(
        '4e5f6a7',
        'fix(db): resolve connection pool leak under high load'
      ),
      await createMockCommit(
        '8b9c0d1',
        'perf(parser): optimize AST traversal speed'
      ),
      await createMockCommit(
        '2f3e4d5',
        'docs: update deployment and configuration guide'
      ),
      await createMockCommit(
        '6c7d8e9',
        'refactor(core): simplify plugin lifecycle hooks'
      ),
      await createMockCommit(
        '0f1a2b3',
        'feat!: drop support for Node.js 18',
        'BREAKING CHANGE: Node.js 18 is no longer supported. Please upgrade to Node.js 20 or higher.'
      ),
      await createMockCommit(
        '4b5c6d7',
        'chore(deps): update dependency vitest to v3'
      ),
    ],
    {
      version: '1.0.0',
    }
  )

  expect(result).toMatchInlineSnapshot(`
    "## 1.0.0 (2026-01-01)

    ### ⚠ BREAKING CHANGES

    - Node.js 18 is no longer supported. Please upgrade to Node.js 20 or higher.

    ### Features

    - **auth:** add OAuth2 provider support a1b2c3d
    - drop support for Node.js 18 0f1a2b3

    ### Bug Fixes

    - **db:** resolve connection pool leak under high load 4e5f6a7

    ### Performance Improvements

    - **parser:** optimize AST traversal speed 8b9c0d1
    "
  `)
})

test('filters out commit footer metadata such as sign-offs and co-authors', async () => {
  const result = await buildChangelog(
    context,
    [
      await createMockCommit(
        '1111111',
        'feat(cli): add dry-run mode for releases\n\nSigned-off-by: Maintainer <maintainer@example.com>'
      ),
      await createMockCommit(
        '2222222',
        'fix(config): handle missing rc configuration fields\n\nReviewed-by: Reviewer <reviewer@example.com>'
      ),
      await createMockCommit(
        '3333333',
        'chore: prepare 1.1.0-rc release\n\nCo-authored-by: Contributor <contributor@example.com>'
      ),
    ],
    {
      version: '1.1.0',
    }
  )

  expect(result).toMatchInlineSnapshot(`
    "## 1.1.0 (2026-01-01)

    ### Features

    - **cli:** add dry-run mode for releases 1111111

    ### Bug Fixes

    - **config:** handle missing rc configuration fields 2222222
    "
  `)
})

test('links commit hashes to repository commit URLs when repository context is present', async () => {
  using _ = vi.spyOn(context, 'repository', 'get').mockReturnValue(repository)

  const result = await buildChangelog(
    context,
    [
      await createMockCommit('6a7b8c9', 'feat(api): expose public webhooks'),
      await createMockCommit(
        '0e1f2a3',
        'fix(core): correctly parse empty json responses'
      ),
    ],
    {
      version: '0.1.0',
    }
  )

  expect(result).toMatchInlineSnapshot(`
    "## 0.1.0 (2026-01-01)

    ### Features

    - **api:** expose public webhooks ([6a7b8c9](https://github.com/mock-owner/mock-repo/commit/6a7b8c9))

    ### Bug Fixes

    - **core:** correctly parse empty json responses ([0e1f2a3](https://github.com/mock-owner/mock-repo/commit/0e1f2a3))
    "
  `)
})

test('links version header to comparison URL when both previous and current tags are provided', async () => {
  using _ = vi.spyOn(context, 'repository', 'get').mockReturnValue(repository)

  const result = await buildChangelog(
    context,
    [
      await createMockCommit(
        '7d8e9f0',
        'feat: introduce batch processing capability'
      ),
      await createMockCommit(
        '1a2b3c4',
        'fix: update rate limit threshold defaults'
      ),
    ],
    {
      version: '1.1.0',
      previousTag: 'v1.0.0',
      currentTag: 'v1.1.0',
    }
  )

  expect(result).toMatchInlineSnapshot(`
    "## [1.1.0](https://github.com/mock-owner/mock-repo/compare/v1.0.0...v1.1.0) (2026-01-01)

    ### Features

    - introduce batch processing capability ([7d8e9f0](https://github.com/mock-owner/mock-repo/commit/7d8e9f0))

    ### Bug Fixes

    - update rate limit threshold defaults ([1a2b3c4](https://github.com/mock-owner/mock-repo/commit/1a2b3c4))
    "
  `)
})

test('resolves target file path using package directory and custom changelog filename before formatting', async () => {
  const result = await buildChangelog(
    context,
    [
      await createMockCommit(
        '3d4e5f6',
        'feat: implement custom changelog formatting rules'
      ),
      await createMockCommit(
        '8a9b0c1',
        'docs: document changelog configuration options'
      ),
    ],
    {
      packageDir: 'packages/foo',
      changelogFile: 'HISTORY.md',
      version: '2.0.0',
    }
  )

  expect(result).toMatchInlineSnapshot(`
    "## 2.0.0 (2026-01-01)

    ### Features

    - implement custom changelog formatting rules 3d4e5f6
    "
  `)

  expect(vi.mocked(formatFile).mock.calls).toMatchInlineSnapshot(`
    [
      [
        "/repo/packages/foo/HISTORY.md",
        "## 2.0.0 (2026-01-01)

    ### Features

    * implement custom changelog formatting rules 3d4e5f6
    ",
      ],
    ]
  `)
})
