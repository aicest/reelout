// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  execGit,
  executeReleaseWorkflow,
  prependChangelog,
} from '@reelout/core'
import plugin from '@reelout/core/analyzer'
import { buildPackage, updatePackageJson, writePackageJson } from '@reelout/npm'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test, vi } from 'vitest'
import { context, logger, workspace } from '../../../test/mock/context'
import {
  createMockCommit,
  initializeGitRepository,
} from '../../../test/mock/git'

async function writeChangelog(dir: string, version: string, changes?: string) {
  await prependChangelog(
    path.join(dir, 'CHANGELOG.md'),
    [`## ${version}`, changes || 'Add some changes'].join('\n')
  )
}

test('returns empty plans when repository has no commits', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)

    await initializeGitRepository(cwd)

    context.packages = []

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toEqual([])

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    context.packages = []

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toEqual([])
    expect(logger.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "Status: [32mSUCCESS[39m",
        ],
        [
          "Release complete: [33mNo packages are scheduled for release.[39m",
        ],
        [
          "Status: [32mSUCCESS[39m",
        ],
        [
          "Release complete: [33mNo packages are scheduled for release.[39m",
        ],
      ]
    `)
  })
})

test('preserves pre-existing release plans and formats changelog entries', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)

    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '0.0.1' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: add manifest'])
    await writeFile(path.join(cwd, 'index.ts'), 'export const foo = 1;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat: add entry'])

    context.plans = [
      {
        package: await buildPackage(context.cwd, '.', workspace),
        history: [await createMockCommit('hash1', 'build: update deps')],
        release: {
          type: 'major',
          version: '1.0.0',
          changelog: 'Add some changes',
        },
      },
    ]

    await executeReleaseWorkflow(context, [plugin()])

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
              "hash": "hash1",
              "header": "build: update deps",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "update deps",
              "trailers": [],
              "type": "build",
            },
            {
              "authorDate": "2026-01-01T00:00:02.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:02.000Z",
              "files": [
                "index.ts",
              ],
              "footer": null,
              "hash": "f59523ddeda472162913205368ede21caa6fcde5",
              "header": "feat: add entry",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [
                "d2520e532c111c1e98eaa584b94b34d4532257d2",
              ],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add entry",
              "trailers": [],
              "type": "feat",
            },
            {
              "authorDate": "2026-01-01T00:00:01.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:01.000Z",
              "files": [
                "package.json",
              ],
              "footer": null,
              "hash": "d2520e532c111c1e98eaa584b94b34d4532257d2",
              "header": "chore: add manifest",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add manifest",
              "trailers": [],
              "type": "chore",
            },
          ],
          "package": {
            "dependencies": [],
            "entry": true,
            "files": "**/*",
            "location": ".",
            "name": undefined,
            "private": undefined,
            "root": true,
            "version": "0.0.1",
          },
          "release": {
            "changelog": "Add some changes",
            "type": "major",
            "version": "1.0.0",
          },
        },
      ]
    `)
    expect(logger.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "Status: [32mSUCCESS[39m",
        ],
        [
          "Release complete: [1m[32m1 released[39m[22m [90m(0)[39m

      [41m 1.0.0 ← 0.0.1 [49m[90m major [39m

      Add some changes
      ",
        ],
      ]
    `)
  })
})

test('derives release plans for packages missing an explicit version', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)

    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '0.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: add manifest'])
    await writeFile(path.join(cwd, 'index.ts'), 'export const foo = 1;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat: add entry'])

    context.packages = [await buildPackage(context.cwd, '.', workspace)]

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:04.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:04.000Z",
              "files": [
                "index.ts",
              ],
              "footer": null,
              "hash": "7e5c2a5269869238b95d0eb6caa12f8f6f3126ba",
              "header": "feat: add entry",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [
                "2b4ddd9bd50017e8119360200977f658a6a9cae9",
              ],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add entry",
              "trailers": [],
              "type": "feat",
            },
            {
              "authorDate": "2026-01-01T00:00:03.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:03.000Z",
              "files": [
                "package.json",
              ],
              "footer": null,
              "hash": "2b4ddd9bd50017e8119360200977f658a6a9cae9",
              "header": "chore: add manifest",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add manifest",
              "trailers": [],
              "type": "chore",
            },
          ],
          "package": {
            "dependencies": [],
            "entry": true,
            "files": "**/*",
            "location": ".",
            "name": undefined,
            "private": undefined,
            "root": true,
            "version": "0.0.0",
          },
          "release": {
            "type": "minor",
          },
        },
      ]
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
})

test('derives release plans for packages with an existing version', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)

    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '0.0.0' })
    await writeChangelog(cwd, '0.0.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: add manifest'])
    await writeFile(path.join(cwd, 'index.ts'), 'export const foo = 1;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat: add entry'])

    context.packages = [await buildPackage(context.cwd, '.', workspace)]

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:06.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:06.000Z",
              "files": [
                "index.ts",
              ],
              "footer": null,
              "hash": "bb7db3dea5d583257fe650a94ad2ded0c1b87e34",
              "header": "feat: add entry",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [
                "fa5b46c841dc2c01287885e291bbcd582ec38c21",
              ],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add entry",
              "trailers": [],
              "type": "feat",
            },
            {
              "authorDate": "2026-01-01T00:00:05.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:05.000Z",
              "files": [
                "CHANGELOG.md",
                "package.json",
              ],
              "footer": null,
              "hash": "fa5b46c841dc2c01287885e291bbcd582ec38c21",
              "header": "chore: add manifest",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add manifest",
              "trailers": [],
              "type": "chore",
            },
          ],
          "package": {
            "dependencies": [],
            "entry": true,
            "files": "**/*",
            "location": ".",
            "name": undefined,
            "private": undefined,
            "root": true,
            "version": "0.0.0",
          },
          "release": {
            "type": "minor",
          },
        },
      ]
    `)
  })
})

test('ignores version mismatches between package context and repository tags', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)

    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '0.0.0' })
    await writeChangelog(cwd, '0.0.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: add manifest'])
    await writeFile(path.join(cwd, 'index.ts'), 'export const foo = 1;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat: add entry'])

    context.packages = [
      {
        ...(await buildPackage(context.cwd, '.', workspace)),
        version: '9.9.9',
      },
    ]

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:08.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:08.000Z",
              "files": [
                "index.ts",
              ],
              "footer": null,
              "hash": "85f204e24400120ccd72d3456ba3717c56e85322",
              "header": "feat: add entry",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [
                "ca75fcf44368f134a350fd67c82c7000ba174a38",
              ],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add entry",
              "trailers": [],
              "type": "feat",
            },
            {
              "authorDate": "2026-01-01T00:00:07.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:07.000Z",
              "files": [
                "CHANGELOG.md",
                "package.json",
              ],
              "footer": null,
              "hash": "ca75fcf44368f134a350fd67c82c7000ba174a38",
              "header": "chore: add manifest",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add manifest",
              "trailers": [],
              "type": "chore",
            },
          ],
          "package": {
            "dependencies": [],
            "entry": true,
            "files": "**/*",
            "location": ".",
            "name": undefined,
            "private": undefined,
            "root": true,
            "version": "9.9.9",
          },
          "release": {
            "type": "minor",
          },
        },
      ]
    `)
  })
})

test('identifies package changes across a multi-package workspace', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)
    workspace.entry = '.'
    workspace.members = ['*']

    await initializeGitRepository(cwd)

    const pkgDir1 = path.join(cwd, 'foo')
    const pkgDir2 = path.join(cwd, 'bar')
    const pkgDir3 = path.join(cwd, 'baz')
    const pkgDir4 = path.join(cwd, 'qux')

    const pkg0 = {
      version: '0.0.0',
      workspaces: workspace.members,
      dependencies: { foo: 'workspace:^' },
    }
    const pkg1 = {
      name: 'foo',
      version: '0.0.0',
    }
    const pkg2 = {
      name: 'bar',
      version: '0.0.0',
    }
    const pkg3 = {
      name: 'baz',
      version: '0.0.0',
    }
    const pkg4 = {
      name: undefined,
      version: '0.0.0',
    }

    await writePackageJson(cwd, { ...pkg0 })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: init workspace'])

    await writeFile(path.join(cwd, 'index.ts'), 'export const root = true;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat: add entry'])

    await updatePackageJson(cwd, { version: '1.0.0-dev' })
    await writeChangelog(cwd, '1.0.0-dev')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: release dev'])
    await execGit(cwd, ['tag', 'v1.0.0-dev'])

    await writePackageJson(pkgDir1, { ...pkg1 })
    await writePackageJson(pkgDir2, { ...pkg2 })
    await writeChangelog(pkgDir1, pkg1.version)
    await writeChangelog(pkgDir2, pkg2.version)
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: init pkgs'])
    await execGit(cwd, ['tag', 'foo@0.0.0'])
    await execGit(cwd, ['tag', 'bar@0.0.0'])

    await writePackageJson(pkgDir3, { ...pkg3 })
    await writeChangelog(pkgDir3, pkg3.version)
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: init baz'])
    await execGit(cwd, ['tag', 'baz@0.0.0'])
    await execGit(cwd, ['tag', 'baz@0.0.1', '-a', '-m', 'baz@0.0.1'])

    await writePackageJson(pkgDir4, { ...pkg4 })
    await writeChangelog(pkgDir4, pkg4.version)
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: init qux'])
    await execGit(cwd, ['tag', 'qux@0.0.0'])

    await writeFile(path.join(pkgDir1, 'index.ts'), 'export const foo = 1;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat(foo): add entry'])

    await updatePackageJson(cwd, { version: '1.0.0' })
    await updatePackageJson(pkgDir1, { version: '1.0.0' })
    await writeChangelog(cwd, '1.0.0')
    await writeChangelog(pkgDir1, '1.0.0')
    await writeFile(path.join(cwd, 'README.md'), '')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: release foo'])
    await execGit(cwd, ['tag', 'v1.0.0'])
    await execGit(cwd, ['tag', 'foo@1.0.0'])

    await writeFile(path.join(pkgDir1, 'index.ts'), 'export const foo = 2;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'fix(foo): update entry'])

    await writeFile(path.join(pkgDir2, 'index.ts'), 'export const bar = 1;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat(bar): add entry'])

    await updatePackageJson(pkgDir4, { version: undefined })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: break qux'])

    await writeFile(path.join(pkgDir4, 'index.ts'), 'export const qux = true;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat(qux): add entry'])

    await updatePackageJson(pkgDir4, { version: '0.1.0-dev' })
    await writeChangelog(pkgDir4, '0.1.0-dev')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: set qux v0'])

    await writeFile(path.join(cwd, 'README.md'), '# Hello')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'docs: update readme'])

    context.packages = [
      await buildPackage(context.cwd, '.', workspace),
      await buildPackage(context.cwd, 'foo', workspace),
      await buildPackage(context.cwd, 'bar', workspace),
      await buildPackage(context.cwd, 'baz', workspace),
      await buildPackage(context.cwd, 'qux', workspace),
    ]

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:30.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:30.000Z",
              "files": [
                "README.md",
              ],
              "footer": null,
              "hash": "4b210a3b37c107552b169895fc1d4cef97d07ec8",
              "header": "docs: update readme",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [
                "be6251f9a736450dca7fbf22b3f4a1d01a5d7fa8",
              ],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "update readme",
              "trailers": [],
              "type": "docs",
            },
            {
              "authorDate": "2026-01-01T00:00:25.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:25.000Z",
              "files": [
                "foo/index.ts",
              ],
              "footer": null,
              "hash": "0564b8dfcae6a82147d8f3dc523647c07b91adce",
              "header": "fix(foo): update entry",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [
                "600ed8a1b1e9f463777b161b59f09cd66792f4fa",
              ],
              "references": [],
              "revert": null,
              "scope": "foo",
              "subject": "update entry",
              "trailers": [],
              "type": "fix",
            },
          ],
          "package": {
            "dependencies": [
              "foo",
            ],
            "entry": true,
            "files": "!{package-lock.json,npm-shrinkwrap.json,pnpm-lock.yaml,yarn.lock,*/**/*}",
            "location": ".",
            "name": undefined,
            "private": undefined,
            "root": true,
            "version": "1.0.0",
          },
          "release": {
            "type": "patch",
          },
        },
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:25.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:25.000Z",
              "files": [
                "foo/index.ts",
              ],
              "footer": null,
              "hash": "0564b8dfcae6a82147d8f3dc523647c07b91adce",
              "header": "fix(foo): update entry",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [
                "600ed8a1b1e9f463777b161b59f09cd66792f4fa",
              ],
              "references": [],
              "revert": null,
              "scope": "foo",
              "subject": "update entry",
              "trailers": [],
              "type": "fix",
            },
          ],
          "package": {
            "dependencies": [],
            "entry": false,
            "files": "foo/**/*",
            "location": "foo",
            "name": "foo",
            "private": undefined,
            "root": false,
            "version": "1.0.0",
          },
          "release": {
            "type": "patch",
          },
        },
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:26.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:26.000Z",
              "files": [
                "bar/index.ts",
              ],
              "footer": null,
              "hash": "c1c10b015ec53eabe6c4cd1ca72cb0111b55fa82",
              "header": "feat(bar): add entry",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [
                "0564b8dfcae6a82147d8f3dc523647c07b91adce",
              ],
              "references": [],
              "revert": null,
              "scope": "bar",
              "subject": "add entry",
              "trailers": [],
              "type": "feat",
            },
          ],
          "package": {
            "dependencies": [],
            "entry": false,
            "files": "bar/**/*",
            "location": "bar",
            "name": "bar",
            "private": undefined,
            "root": false,
            "version": "0.0.0",
          },
          "release": {
            "type": "minor",
          },
        },
        {
          "history": [],
          "package": {
            "dependencies": [],
            "entry": false,
            "files": "baz/**/*",
            "location": "baz",
            "name": "baz",
            "private": undefined,
            "root": false,
            "version": "0.0.0",
          },
          "release": null,
        },
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:29.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:29.000Z",
              "files": [
                "qux/CHANGELOG.md",
                "qux/package.json",
              ],
              "footer": null,
              "hash": "be6251f9a736450dca7fbf22b3f4a1d01a5d7fa8",
              "header": "chore: set qux v0",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [
                "15c723bbac802e3b6d6a8023cd71e791109e77a4",
              ],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "set qux v0",
              "trailers": [],
              "type": "chore",
            },
            {
              "authorDate": "2026-01-01T00:00:28.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:28.000Z",
              "files": [
                "qux/index.ts",
              ],
              "footer": null,
              "hash": "15c723bbac802e3b6d6a8023cd71e791109e77a4",
              "header": "feat(qux): add entry",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [
                "1abbdcc656314fca4a810268a6b3380307c3da40",
              ],
              "references": [],
              "revert": null,
              "scope": "qux",
              "subject": "add entry",
              "trailers": [],
              "type": "feat",
            },
            {
              "authorDate": "2026-01-01T00:00:27.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:27.000Z",
              "files": [
                "qux/package.json",
              ],
              "footer": null,
              "hash": "1abbdcc656314fca4a810268a6b3380307c3da40",
              "header": "chore: break qux",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [
                "c1c10b015ec53eabe6c4cd1ca72cb0111b55fa82",
              ],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "break qux",
              "trailers": [],
              "type": "chore",
            },
          ],
          "package": {
            "dependencies": [],
            "entry": false,
            "files": "qux/**/*",
            "location": "qux",
            "name": undefined,
            "private": undefined,
            "root": false,
            "version": "0.1.0-dev",
          },
          "release": {
            "type": "minor",
          },
        },
      ]
    `)
  })
})

test('promotes prerelease and zero-major versions when allowEmpty is true', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd
    workspace.entry = '.'
    workspace.members = ['*']

    await initializeGitRepository(cwd)

    const pkgDir1 = path.join(cwd, 'pkg1')
    const pkgDir2 = path.join(cwd, 'pkg2')
    const pkgDir3 = path.join(cwd, 'pkg3')
    const pkgDir4 = path.join(cwd, 'pkg4')
    const pkgDir5 = path.join(cwd, 'pkg5')
    const pkgDir6 = path.join(cwd, 'pkg6')
    const pkgDir7 = path.join(cwd, 'pkg7')
    const pkgDir8 = path.join(cwd, 'pkg8')

    await writePackageJson(pkgDir1, { name: 'pkg1', version: '0.0.0' })
    await writePackageJson(pkgDir2, { name: 'pkg2', version: '0.1.0-dev.0' })
    await writePackageJson(pkgDir3, { name: 'pkg3', version: '0.1.0' })
    await writePackageJson(pkgDir4, { name: 'pkg4', version: '1.0.0-dev.0' })
    await writePackageJson(pkgDir5, { name: 'pkg5', version: '1.1.0' })
    await writePackageJson(pkgDir6, { name: 'pkg6', version: '1.2.0-dev.0' })
    await writePackageJson(pkgDir7, { name: 'pkg7', version: '2.0.0-0' })
    await writePackageJson(pkgDir8, { name: 'pkg8', version: '2.0.0-rc' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: init project'])
    await execGit(cwd, ['tag', 'pkg1@0.0.0'])
    await execGit(cwd, ['tag', 'pkg2@0.1.0-dev.0'])
    await execGit(cwd, ['tag', 'pkg3@0.1.0'])
    await execGit(cwd, ['tag', 'pkg4@1.0.0-dev.0'])
    await execGit(cwd, ['tag', 'pkg5@1.1.0'])
    await execGit(cwd, ['tag', 'pkg6@1.2.0-dev.0'])

    context.packages = [
      await buildPackage(context.cwd, 'pkg1', workspace),
      await buildPackage(context.cwd, 'pkg2', workspace),
      await buildPackage(context.cwd, 'pkg3', workspace),
      await buildPackage(context.cwd, 'pkg4', workspace),
      await buildPackage(context.cwd, 'pkg5', workspace),
      await buildPackage(context.cwd, 'pkg6', workspace),
      await buildPackage(context.cwd, 'pkg7', workspace),
      await buildPackage(context.cwd, 'pkg8', workspace),
    ]

    context.type = 'auto'
    context.versionQualifier = undefined
    context.allowEmpty = true

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [],
          "package": {
            "dependencies": [],
            "entry": false,
            "files": "pkg1/**/*",
            "location": "pkg1",
            "name": "pkg1",
            "private": undefined,
            "root": false,
            "version": "0.0.0",
          },
          "release": null,
        },
        {
          "history": [],
          "package": {
            "dependencies": [],
            "entry": false,
            "files": "pkg2/**/*",
            "location": "pkg2",
            "name": "pkg2",
            "private": undefined,
            "root": false,
            "version": "0.1.0-dev.0",
          },
          "release": {
            "transition": "continue",
            "type": "minor",
          },
        },
        {
          "history": [],
          "package": {
            "dependencies": [],
            "entry": false,
            "files": "pkg3/**/*",
            "location": "pkg3",
            "name": "pkg3",
            "private": undefined,
            "root": false,
            "version": "0.1.0",
          },
          "release": {
            "transition": "advance",
            "type": "major",
          },
        },
        {
          "history": [],
          "package": {
            "dependencies": [],
            "entry": false,
            "files": "pkg4/**/*",
            "location": "pkg4",
            "name": "pkg4",
            "private": undefined,
            "root": false,
            "version": "1.0.0-dev.0",
          },
          "release": {
            "transition": "continue",
            "type": "major",
          },
        },
        {
          "history": [],
          "package": {
            "dependencies": [],
            "entry": false,
            "files": "pkg5/**/*",
            "location": "pkg5",
            "name": "pkg5",
            "private": undefined,
            "root": false,
            "version": "1.1.0",
          },
          "release": null,
        },
        {
          "history": [],
          "package": {
            "dependencies": [],
            "entry": false,
            "files": "pkg6/**/*",
            "location": "pkg6",
            "name": "pkg6",
            "private": undefined,
            "root": false,
            "version": "1.2.0-dev.0",
          },
          "release": {
            "transition": "continue",
            "type": "minor",
          },
        },
        {
          "history": [],
          "package": {
            "dependencies": [],
            "entry": false,
            "files": "pkg7/**/*",
            "location": "pkg7",
            "name": "pkg7",
            "private": undefined,
            "root": false,
            "version": "2.0.0-0",
          },
          "release": {
            "transition": "continue",
            "type": "major",
          },
        },
        {
          "history": [],
          "package": {
            "dependencies": [],
            "entry": false,
            "files": "pkg8/**/*",
            "location": "pkg8",
            "name": "pkg8",
            "private": undefined,
            "root": false,
            "version": "2.0.0-rc",
          },
          "release": {
            "transition": "continue",
            "type": "major",
          },
        },
      ]
    `)
  })
})

test('propagates release plans to dependent packages on workspace updates', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)
    workspace.entry = '.'
    workspace.members = ['*']

    await initializeGitRepository(cwd)

    await writePackageJson(cwd, {
      name: undefined,
      version: '0.0.0',
      workspaces: ['*'],
      dependencies: { 'foo': 'workspace:^' },
    })
    await writePackageJson(path.join(cwd, 'foo'), {
      name: 'foo',
      version: '0.0.0',
      dependencies: { 'bar': 'workspace:^' },
    })
    await writePackageJson(path.join(cwd, 'bar'), {
      name: 'bar',
      version: '0.0.0',
      dependencies: { 'baz': 'workspace:^' },
    })
    await writePackageJson(path.join(cwd, 'baz'), {
      name: 'baz',
      version: '0.0.0',
      dependencies: {},
    })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: init pkgs'])

    await writeFile(path.join(cwd, 'bar/index.ts'), 'export const bar = 42;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat(bar): add entry'])

    context.packages = [
      await buildPackage(context.cwd, '.', workspace),
      await buildPackage(context.cwd, 'foo', workspace),
      await buildPackage(context.cwd, 'bar', workspace),
      await buildPackage(context.cwd, 'baz', workspace),
    ]

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:39.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:39.000Z",
              "files": [
                "bar/index.ts",
              ],
              "footer": null,
              "hash": "802e66162562f7dec74431756a3893860df101dc",
              "header": "feat(bar): add entry",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [
                "8d8b75804c5231ff2be58002f41c40d1fa0f8b2a",
              ],
              "references": [],
              "revert": null,
              "scope": "bar",
              "subject": "add entry",
              "trailers": [],
              "type": "feat",
            },
            {
              "authorDate": "2026-01-01T00:00:38.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:38.000Z",
              "files": [
                "bar/package.json",
                "baz/package.json",
                "foo/package.json",
                "package.json",
              ],
              "footer": null,
              "hash": "8d8b75804c5231ff2be58002f41c40d1fa0f8b2a",
              "header": "chore: init pkgs",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "init pkgs",
              "trailers": [],
              "type": "chore",
            },
          ],
          "package": {
            "dependencies": [
              "foo",
            ],
            "entry": true,
            "files": "!{package-lock.json,npm-shrinkwrap.json,pnpm-lock.yaml,yarn.lock,*/**/*}",
            "location": ".",
            "name": undefined,
            "private": undefined,
            "root": true,
            "version": "0.0.0",
          },
          "release": {
            "type": "patch",
          },
        },
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:39.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:39.000Z",
              "files": [
                "bar/index.ts",
              ],
              "footer": null,
              "hash": "802e66162562f7dec74431756a3893860df101dc",
              "header": "feat(bar): add entry",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [
                "8d8b75804c5231ff2be58002f41c40d1fa0f8b2a",
              ],
              "references": [],
              "revert": null,
              "scope": "bar",
              "subject": "add entry",
              "trailers": [],
              "type": "feat",
            },
            {
              "authorDate": "2026-01-01T00:00:38.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:38.000Z",
              "files": [
                "bar/package.json",
                "baz/package.json",
                "foo/package.json",
                "package.json",
              ],
              "footer": null,
              "hash": "8d8b75804c5231ff2be58002f41c40d1fa0f8b2a",
              "header": "chore: init pkgs",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "init pkgs",
              "trailers": [],
              "type": "chore",
            },
          ],
          "package": {
            "dependencies": [
              "bar",
            ],
            "entry": false,
            "files": "foo/**/*",
            "location": "foo",
            "name": "foo",
            "private": undefined,
            "root": false,
            "version": "0.0.0",
          },
          "release": {
            "type": "patch",
          },
        },
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:39.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:39.000Z",
              "files": [
                "bar/index.ts",
              ],
              "footer": null,
              "hash": "802e66162562f7dec74431756a3893860df101dc",
              "header": "feat(bar): add entry",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [
                "8d8b75804c5231ff2be58002f41c40d1fa0f8b2a",
              ],
              "references": [],
              "revert": null,
              "scope": "bar",
              "subject": "add entry",
              "trailers": [],
              "type": "feat",
            },
            {
              "authorDate": "2026-01-01T00:00:38.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:38.000Z",
              "files": [
                "bar/package.json",
                "baz/package.json",
                "foo/package.json",
                "package.json",
              ],
              "footer": null,
              "hash": "8d8b75804c5231ff2be58002f41c40d1fa0f8b2a",
              "header": "chore: init pkgs",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "init pkgs",
              "trailers": [],
              "type": "chore",
            },
          ],
          "package": {
            "dependencies": [
              "baz",
            ],
            "entry": false,
            "files": "bar/**/*",
            "location": "bar",
            "name": "bar",
            "private": undefined,
            "root": false,
            "version": "0.0.0",
          },
          "release": {
            "type": "minor",
          },
        },
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:38.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:38.000Z",
              "files": [
                "bar/package.json",
                "baz/package.json",
                "foo/package.json",
                "package.json",
              ],
              "footer": null,
              "hash": "8d8b75804c5231ff2be58002f41c40d1fa0f8b2a",
              "header": "chore: init pkgs",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "init pkgs",
              "trailers": [],
              "type": "chore",
            },
          ],
          "package": {
            "dependencies": [],
            "entry": false,
            "files": "baz/**/*",
            "location": "baz",
            "name": "baz",
            "private": undefined,
            "root": false,
            "version": "0.0.0",
          },
          "release": null,
        },
      ]
    `)
  })
})
