// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/fs'

import {
  execGit,
  executeReleaseWorkflow,
  prependChangelog,
  type GitCommit,
  type Package,
  type ReleasePlan,
} from '@reelout/core'
import plugin from '@reelout/core/changelog'
import { buildPackage, updatePackageJson, writePackageJson } from '@reelout/npm'
import { vol } from 'memfs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { beforeEach, expect, test, vi } from 'vitest'
import {
  context,
  logger,
  repository,
  workspace,
} from '../../../test/mock/context'
import {
  createMockCommit,
  initializeGitRepository,
} from '../../../test/mock/git'

const discoverPackageTag = vi.hoisted(() =>
  vi.fn((pkg: Package) => {
    if (!pkg.version) return null
    const tag = pkg.name
      ? `${pkg.name}@${pkg.version}-mock`
      : `v${pkg.version}-mock`
    return { name: tag }
  })
)

vi.mock(import('@reelout/core/workflow/discovery/discoverPackageTag'), () => ({
  discoverPackageTag: async (cwd, ...args) => discoverPackageTag(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

async function writeChangelog(dir: string, version: string, changes?: string) {
  await prependChangelog(
    path.join(dir, 'CHANGELOG.md'),
    [`## ${version}`, changes || 'Add some changes'].join('\n')
  )
}

test('resolves missing package tags for workspace packages during discovery stage', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    context.cwd = cwd
    workspace.entry = '.'
    workspace.members = ['*']

    const pkgDirA = path.join(cwd, 'pkgA')
    const pkgDirB = path.join(cwd, 'pkgB')
    const pkgDirC = path.join(cwd, 'pkgC')

    await writePackageJson(cwd, { name: undefined, version: '0.0.0' })
    await writePackageJson(pkgDirA, { name: 'pkgA', version: '0.0.0' })
    await writePackageJson(pkgDirB, { name: undefined, version: '0.0.0' })
    await writePackageJson(pkgDirC, { name: undefined, version: '0.0.0' })
    await writeChangelog(cwd, '0.0.0')
    await writeChangelog(pkgDirA, '0.0.0')
    await writeChangelog(pkgDirB, '0.0.0')
    await writeChangelog(pkgDirC, '0.0.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: init packages'])
    await execGit(cwd, ['tag', 'v0.0.0'])
    await execGit(cwd, ['tag', 'pkgA@0.0.0'])
    await execGit(cwd, ['tag', 'pkgB@0.0.0'])
    await execGit(cwd, ['tag', 'pkgC@0.0.0'])

    await writeFile(path.join(pkgDirA, 'index.js'), 'export const a = 1;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat(pkgA): add index'])
    await updatePackageJson(pkgDirA, { version: '0.1.0' })
    await writeChangelog(pkgDirA, '0.1.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore(pkgA): release v0.1.0'])
    await execGit(cwd, ['tag', 'pkgA@0.1.0'])

    const rootPkg = await buildPackage(context.cwd, '.', workspace)
    const pkgA = await buildPackage(context.cwd, 'pkgA', workspace)
    const pkgB = await buildPackage(context.cwd, 'pkgB', workspace)
    const pkgC = await buildPackage(context.cwd, 'pkgC', workspace)

    context.packages = [
      rootPkg,
      pkgA,
      { ...pkgB, tag: undefined },
      { ...pkgC, tag: { name: 'pkgC@0.0.0' } },
    ] as Package[]

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.packages).toMatchInlineSnapshot(`
      [
        {
          "dependencies": [],
          "entry": true,
          "files": "!{package-lock.json,npm-shrinkwrap.json,pnpm-lock.yaml,yarn.lock,*/**/*}",
          "location": ".",
          "name": undefined,
          "private": undefined,
          "root": true,
          "tag": {
            "message": undefined,
            "name": "v0.0.0",
          },
          "version": "0.0.0",
        },
        {
          "dependencies": [],
          "entry": false,
          "files": "pkgA/**/*",
          "location": "pkgA",
          "name": "pkgA",
          "private": undefined,
          "root": false,
          "tag": {
            "message": undefined,
            "name": "pkgA@0.1.0",
          },
          "version": "0.1.0",
        },
        {
          "dependencies": [],
          "entry": false,
          "files": "pkgB/**/*",
          "location": "pkgB",
          "name": undefined,
          "private": undefined,
          "root": false,
          "tag": null,
          "version": "0.0.0",
        },
        {
          "dependencies": [],
          "entry": false,
          "files": "pkgC/**/*",
          "location": "pkgC",
          "name": undefined,
          "private": undefined,
          "root": false,
          "tag": {
            "name": "pkgC@0.0.0",
          },
          "version": "0.0.0",
        },
      ]
    `)
  })
})

test('skips changelog generation when plan release is null', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.plans = [
      {
        package: { location: '.' },
        history: [] as GitCommit[],
        release: null,
      },
    ] as ReleasePlan[]

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [],
          "package": {
            "location": ".",
          },
          "release": null,
        },
      ]
    `)
  })
})

test('skips changelog generation when release version is missing', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.plans = [
      {
        package: { location: '.' },
        history: [] as GitCommit[],
        release: { type: 'patch', version: null },
      },
    ] as ReleasePlan[]

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [],
          "package": {
            "location": ".",
          },
          "release": {
            "type": "patch",
            "version": null,
          },
        },
      ]
    `)
  })
})

test('falls back to discovering package tag during build stage when missing', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.plans = [
      {
        package: { location: '.', tag: null },
        history: [] as GitCommit[],
        release: { type: 'patch', version: '1.0.1' },
      },
    ] as ReleasePlan[]

    await executeReleaseWorkflow(context, [plugin()])

    expect(discoverPackageTag.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "location": ".",
            "tag": null,
          },
        ],
      ]
    `)
    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [],
          "package": {
            "location": ".",
            "tag": null,
          },
          "release": {
            "changelog": "## 1.0.1 (2026-01-01)
      ",
            "type": "patch",
            "version": "1.0.1",
          },
        },
      ]
    `)
  })
})

test('uses existing package tag during build stage without triggering tag discovery', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.plans = [
      {
        package: { location: '.', version: '1.0.0', tag: { name: 'v1.0.0' } },
        history: [] as GitCommit[],
        release: { type: 'patch', version: '1.0.1' },
      },
    ] as ReleasePlan[]

    await executeReleaseWorkflow(context, [plugin()])

    expect(discoverPackageTag).not.toHaveBeenCalled()
    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [],
          "package": {
            "location": ".",
            "tag": {
              "name": "v1.0.0",
            },
            "version": "1.0.0",
          },
          "release": {
            "changelog": "## 1.0.1 (2026-01-01)
      ",
            "type": "patch",
            "version": "1.0.1",
          },
        },
      ]
    `)
  })
})

test('handles null or malformed commit history gracefully without throwing', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.plans = [
      {
        package: { location: '.' },
        history: null as unknown,
        release: { type: 'patch', version: '1.0.1' },
      },
    ] as ReleasePlan[]

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": null,
          "package": {
            "location": ".",
          },
          "release": {
            "type": "patch",
            "version": "1.0.1",
          },
        },
      ]
    `)
  })
})

test('generates header-only changelog when commit history is empty', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.plans = [
      {
        package: { location: '.' },
        history: [] as GitCommit[],
        release: { type: 'patch', version: '1.0.1' },
      },
    ] as ReleasePlan[]

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [],
          "package": {
            "location": ".",
          },
          "release": {
            "changelog": "## 1.0.1 (2026-01-01)
      ",
            "type": "patch",
            "version": "1.0.1",
          },
        },
      ]
    `)
  })
})

test('generates changelog compare link using existing package tag', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.repository = repository

    context.plans = [
      {
        package: { location: '.', version: '1.0.0', tag: { name: 'v1.0.0' } },
        history: [
          await createMockCommit(
            'abc1234',
            'feat(core): add changelog generation support'
          ),
        ],
        release: { type: 'patch', version: '1.0.1', tag: { name: 'v1.0.1' } },
      },
    ] as ReleasePlan[]

    await executeReleaseWorkflow(context, [plugin()])

    expect(discoverPackageTag).not.toHaveBeenCalled()
    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:00.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:01.000Z",
              "files": [],
              "footer": null,
              "hash": "abc1234",
              "header": "feat(core): add changelog generation support",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": "core",
              "subject": "add changelog generation support",
              "trailers": [],
              "type": "feat",
            },
          ],
          "package": {
            "location": ".",
            "tag": {
              "name": "v1.0.0",
            },
            "version": "1.0.0",
          },
          "release": {
            "changelog": "## [1.0.1](https://github.com/mock-owner/mock-repo/compare/v1.0.0...v1.0.1) (2026-01-01)

      ### Features

      - **core:** add changelog generation support ([abc1234](https://github.com/mock-owner/mock-repo/commit/abc1234))
      ",
            "tag": {
              "name": "v1.0.1",
            },
            "type": "patch",
            "version": "1.0.1",
          },
        },
      ]
    `)
  })
})

test('generates changelog compare link using fallback discovered tag when package tag is missing', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.repository = repository

    context.plans = [
      {
        package: { location: '.', version: '1.0.0', tag: null },
        history: [
          await createMockCommit(
            'abc1234',
            'feat(core): add changelog generation support'
          ),
        ],
        release: { type: 'patch', version: '1.0.1', tag: { name: 'v1.0.1' } },
      },
    ] as ReleasePlan[]

    await executeReleaseWorkflow(context, [plugin()])

    expect(discoverPackageTag.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "location": ".",
            "tag": null,
            "version": "1.0.0",
          },
        ],
      ]
    `)
    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:00.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:01.000Z",
              "files": [],
              "footer": null,
              "hash": "abc1234",
              "header": "feat(core): add changelog generation support",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": "core",
              "subject": "add changelog generation support",
              "trailers": [],
              "type": "feat",
            },
          ],
          "package": {
            "location": ".",
            "tag": null,
            "version": "1.0.0",
          },
          "release": {
            "changelog": "## [1.0.1](https://github.com/mock-owner/mock-repo/compare/v1.0.0-mock...v1.0.1) (2026-01-01)

      ### Features

      - **core:** add changelog generation support ([abc1234](https://github.com/mock-owner/mock-repo/commit/abc1234))
      ",
            "tag": {
              "name": "v1.0.1",
            },
            "type": "patch",
            "version": "1.0.1",
          },
        },
      ]
    `)
  })
})

test('skips writing changelog files to disk in dry-run mode', async () => {
  vol.fromJSON({ '/repo': null })

  context.dryRun = true

  context.plans = [
    {
      package: { location: '.' },
      release: { changelog: `## 1.0.0\n\n### Features\n\n- add new feature\n` },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(vol.toJSON()).toMatchInlineSnapshot(`
    {
      "/repo": null,
    }
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [33mNo packages are scheduled for release.[39m",
      ],
    ]
  `)
})

test('writes generated changelog files to disk for each release plan', async () => {
  vol.fromJSON({ '/repo': null })

  context.plans = [
    {
      package: { location: '.' },
      release: { changelog: `## 1.0.0\n\n### Features\n\n- add new feature\n` },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(vol.toJSON()).toMatchInlineSnapshot(`
    {
      "/repo/CHANGELOG.md": "# Changelog

    ## 1.0.0

    ### Features

    - add new feature
    ",
    }
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [33mNo packages are scheduled for release.[39m",
      ],
    ]
  `)
})
