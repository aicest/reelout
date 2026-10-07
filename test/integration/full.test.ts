// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../mock/integration'

import { resolveConfig } from '@reelout/config'
import { createContext } from '@reelout/context'
import {
  compact,
  createPlugin,
  execGit,
  executeReleaseWorkflow,
} from '@reelout/core'
import { updatePackageJson, writePackageJson } from '@reelout/npm'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test, vi } from 'vitest'
import { createMockLogger } from '../mock/context'
import {
  getGitCommitSubjects,
  getGitTags,
  initializeGitRepository,
} from '../mock/git'

test('runs workflow without packages', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Another commit'])

      const logger = vi.fn()

      const config = await resolveConfig(cwd)

      const context = await createContext({
        ...config,
        cwd,
        env: process.env,
        stdout: process.stdout,
        stderr: process.stderr,
        logger: createMockLogger(logger),
      })

      expect({
        repository: context.repository,
        ref: context.ref,
        commit: context.commit,
      }).toMatchInlineSnapshot(`
        {
          "commit": {
            "authorDate": "2026-01-01T00:00:01.000Z",
            "body": null,
            "committerDate": "2026-01-01T00:00:01.000Z",
            "files": [],
            "footer": null,
            "hash": "898c5f9dc3c556c426784111741c81c8fffe944b",
            "header": "Another commit",
            "mentions": [],
            "merge": null,
            "notes": [],
            "parent": [
              "f168a6b79de374e3a0b8b418fd1d9cbafad0a163",
            ],
            "references": [],
            "revert": null,
            "scope": null,
            "subject": null,
            "trailers": [],
            "type": null,
          },
          "ref": {
            "name": "main",
            "type": "branch",
          },
          "repository": {
            "host": "github",
            "owner": "mock-owner",
            "repo": "mock-repo",
            "url": "https://github.com/mock-owner/mock-repo",
          },
        }
      `)

      await executeReleaseWorkflow(
        context,
        compact(await Promise.all(config.plugins.map(createPlugin)))
      )

      expect(logger.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "[33mPackage could not be loaded: JSON file at "[1m<cwd>/package.json[22m" could not be read.[39m",
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
})

test('runs workflow with an empty package.json', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await writePackageJson(cwd, {})
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: add empty package.json'])

      await writeFile(path.join(cwd, 'index.js'), 'export const foo = 42;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat: add index file'])

      const logger = vi.fn()

      const config = await resolveConfig(cwd)

      const context = await createContext({
        ...config,
        cwd,
        env: process.env,
        stdout: process.stdout,
        stderr: process.stderr,
        logger: createMockLogger(logger),
      })

      await executeReleaseWorkflow(
        context,
        compact(await Promise.all(config.plugins.map(createPlugin)))
      )

      expect(await getGitTags(cwd)).toEqual([])
      expect(logger.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "[33mPackage could not be loaded: Package version "undefined" in "." is not a valid semantic version.[39m",
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
}, 15_000)

test('releases the root package', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await writePackageJson(cwd, { version: '0.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'chore: add package.json with version',
      ])

      await writeFile(path.join(cwd, 'index.js'), 'export const foo = 42;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat: add index file'])

      const logger = vi.fn()

      const config = await resolveConfig(cwd)

      const context = await createContext({
        ...config,
        cwd,
        env: process.env,
        stdout: process.stdout,
        stderr: process.stderr,
        logger: createMockLogger(logger),
      })

      await executeReleaseWorkflow(
        context,
        compact(await Promise.all(config.plugins.map(createPlugin)))
      )

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v0.1.0 ## Features

        - add index file ([05aec35](https://github.com/mock-owner/mock-repo/commit/05aec3544db665d787088443291f120dfbaaff15))",
        ]
      `)
      expect(logger.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "Status: [32mSUCCESS[39m",
          ],
          [
            "Release complete: [1m[32m1 released[39m[22m [90m(1)[39m

        [42m 0.1.0 ← 0.0.0 [49m[90m minor [39m

        [36m## 0.1.0 (2026-01-01)[39m

        [36m### Features[39m

        - add index file ([05aec35](https://github.com/mock-owner/mock-repo/commit/05aec3544db665d787088443291f120dfbaaff15))
        ",
          ],
        ]
      `)
    })
  })
}, 15_000)

test('releases workspace packages', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      const pkgDir1 = path.join(cwd, 'packages/pkg1')
      const pkgDir2 = path.join(cwd, 'packages/pkg2')
      const pkgDir3 = path.join(cwd, 'packages/pkg3')
      const pkgDir4 = path.join(cwd, 'packages/pkg4')
      const pkgDir5 = path.join(cwd, 'packages/pkg5')

      await mkdir(pkgDir1, { recursive: true })
      await mkdir(pkgDir2, { recursive: true })
      await mkdir(pkgDir3, { recursive: true })
      await mkdir(pkgDir4, { recursive: true })
      await mkdir(pkgDir5, { recursive: true })

      await writePackageJson(cwd, {})
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: add empty package.json'])

      await writeFile(
        path.join(cwd, 'pnpm-workspace.yaml'),
        `packages:\n  - packages/*`
      )
      await updatePackageJson(cwd, {
        version: '0.0.0',
        private: true,
        dependencies: {
          '@scope/pkg1': 'workspace:^',
          '@scope/pkg2': 'workspace:^',
        },
      })
      await writePackageJson(pkgDir1, { name: '@scope/pkg1', version: '1.0.0' })
      await writePackageJson(pkgDir2, { name: '@scope/pkg2', version: '2.0.0' })
      await writePackageJson(pkgDir3, { name: undefined, version: '3.0.0' })
      await writePackageJson(pkgDir4, { name: undefined, version: undefined })
      await writeFile(path.join(pkgDir5, 'package.json'), 'not a valid json')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: set up workspace'])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const pkg1 = 1;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg1): add index file'])
      await writeFile(path.join(pkgDir2, 'index.js'), 'export const pkg2 = 2;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg2): add index file'])
      await writeFile(path.join(pkgDir3, 'index.js'), 'export const pkg3 = 3;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg3): add index file'])
      await writeFile(path.join(pkgDir4, 'index.js'), 'export const pkg4 = 4;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg4): add index file'])
      await writeFile(path.join(pkgDir5, 'index.js'), 'export const pkg5 = 5;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg5): add index file'])

      const logger = vi.fn()

      const config = await resolveConfig(cwd)

      const context = await createContext({
        ...config,
        cwd,
        env: process.env,
        stdout: process.stdout,
        stderr: process.stderr,
        logger: createMockLogger(logger),
      })

      await executeReleaseWorkflow(
        context,
        compact(await Promise.all(config.plugins.map(createPlugin)))
      )

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.1.0 ## Features

        - **pkg1:** add index file ([fbf9185](https://github.com/mock-owner/mock-repo/commit/fbf9185bfb6e194526092fbffa5d29c265b0fa56))",
          "@scope/pkg2@2.1.0 ## Features

        - **pkg2:** add index file ([753ff05](https://github.com/mock-owner/mock-repo/commit/753ff05cbe89630400021ab1cc1e43508fc204ac))",
          "v0.0.1 ## Features

        - **pkg1:** add index file ([fbf9185](https://github.com/mock-owner/mock-repo/commit/fbf9185bfb6e194526092fbffa5d29c265b0fa56))
        - **pkg2:** add index file ([753ff05](https://github.com/mock-owner/mock-repo/commit/753ff05cbe89630400021ab1cc1e43508fc204ac))",
        ]
      `)
      expect(logger.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "[33mPackage could not be loaded: Package version "undefined" in "packages/pkg4" is not a valid semantic version.[39m",
          ],
          [
            "[33mPackage could not be loaded: JSON file at "[1m<cwd>/packages/pkg5/package.json[22m" could not be parsed.[39m",
          ],
          [
            "[33mTag could not be determined for package at "[1mpackages/pkg3[22m": Package name is required to build a tag name.[39m",
          ],
          [
            "Status: [32mSUCCESS[39m",
          ],
          [
            "Release complete: [1m[32m4 released[39m[22m [90m(4)[39m

        [42m 0.0.1 ← 0.0.0 [49m[90m patch [39m

        [36m## 0.0.1 (2026-01-01)[39m

        [36m### Features[39m

        - **pkg1:** add index file ([fbf9185](https://github.com/mock-owner/mock-repo/commit/fbf9185bfb6e194526092fbffa5d29c265b0fa56))
        - **pkg2:** add index file ([753ff05](https://github.com/mock-owner/mock-repo/commit/753ff05cbe89630400021ab1cc1e43508fc204ac))

        [90m ./packages/pkg3 [39m[42m 3.1.0 ← 3.0.0 [49m[90m minor [39m

        [36m## 3.1.0 (2026-01-01)[39m

        [36m### Features[39m

        - **pkg3:** add index file ([c88544d](https://github.com/mock-owner/mock-repo/commit/c88544d786b6d8169652fb4a4e4295d2f8ba5614))

        [44m @scope/pkg1 [49m[42m 1.1.0 ← 1.0.0 [49m[90m minor [39m

        [36m## 1.1.0 (2026-01-01)[39m

        [36m### Features[39m

        - **pkg1:** add index file ([fbf9185](https://github.com/mock-owner/mock-repo/commit/fbf9185bfb6e194526092fbffa5d29c265b0fa56))

        [44m @scope/pkg2 [49m[42m 2.1.0 ← 2.0.0 [49m[90m minor [39m

        [36m## 2.1.0 (2026-01-01)[39m

        [36m### Features[39m

        - **pkg2:** add index file ([753ff05](https://github.com/mock-owner/mock-repo/commit/753ff05cbe89630400021ab1cc1e43508fc204ac))
        ",
          ],
        ]
      `)
    })
  })
}, 15_000)

test('prints a dry-run report for workspace releases', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      const pkgDir1 = path.join(cwd, 'packages/pkg1')
      const pkgDir2 = path.join(cwd, 'packages/pkg2')
      const pkgDir3 = path.join(cwd, 'packages/pkg3')
      const pkgDir4 = path.join(cwd, 'packages/pkg4')
      const pkgDir5 = path.join(cwd, 'packages/pkg5')

      await mkdir(pkgDir1, { recursive: true })
      await mkdir(pkgDir2, { recursive: true })
      await mkdir(pkgDir3, { recursive: true })
      await mkdir(pkgDir4, { recursive: true })
      await mkdir(pkgDir5, { recursive: true })

      await writePackageJson(cwd, { version: '0.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: init package'])

      await writeFile(
        path.join(cwd, 'pnpm-workspace.yaml'),
        `packages:\n  - packages/*`
      )
      await writePackageJson(pkgDir1, { name: '@scope/pkg1', version: '1.0.0' })
      await writePackageJson(pkgDir2, { name: '@scope/pkg2', version: '2.0.0' })
      await writePackageJson(pkgDir3, { name: undefined, version: '3.0.0' })
      await writePackageJson(pkgDir4, { name: undefined, version: undefined })
      await writeFile(path.join(pkgDir5, 'package.json'), 'not a valid json')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat: set up workspace'])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const foo = 42;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg1): add index file'])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const foo = 43;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'fix(pkg1): update index file'])

      const logger = vi.fn()

      const config = await resolveConfig(cwd)

      const context = await createContext({
        ...config,
        cwd,
        env: process.env,
        stdout: process.stdout,
        stderr: process.stderr,
        logger: createMockLogger(logger),
        dryRun: true,
      })

      await executeReleaseWorkflow(
        context,
        compact(await Promise.all(config.plugins.map(createPlugin)))
      )

      expect(await getGitCommitSubjects(cwd)).toEqual([
        'chore: init package',
        'feat: set up workspace',
        'feat(pkg1): add index file',
        'fix(pkg1): update index file',
      ])
      expect(await getGitTags(cwd)).toEqual([])
      expect(logger.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "[33mPackage could not be loaded: Package version "undefined" in "packages/pkg4" is not a valid semantic version.[39m",
          ],
          [
            "[33mPackage could not be loaded: JSON file at "[1m<cwd>/packages/pkg5/package.json[22m" could not be parsed.[39m",
          ],
          [
            "[33mTag could not be determined for package at "[1mpackages/pkg3[22m": Package name is required to build a tag name.[39m",
          ],
          [
            "Status: [32mSUCCESS[39m",
          ],
          [
            "Release complete: [1m[32m4 released[39m[22m [90m(4)[39m

        [42m 0.1.0 ← 0.0.0 [49m[90m minor [39m

        [36m## 0.1.0 (2026-01-01)[39m

        [36m### Features[39m

        - set up workspace ([6d1ec56](https://github.com/mock-owner/mock-repo/commit/6d1ec56ef55f7c817248c4295890709e1d9ed663))

        [90m ./packages/pkg3 [39m[42m 3.1.0 ← 3.0.0 [49m[90m minor [39m

        [36m## 3.1.0 (2026-01-01)[39m

        [36m### Features[39m

        - set up workspace ([6d1ec56](https://github.com/mock-owner/mock-repo/commit/6d1ec56ef55f7c817248c4295890709e1d9ed663))

        [44m @scope/pkg1 [49m[42m 1.1.0 ← 1.0.0 [49m[90m minor [39m

        [36m## 1.1.0 (2026-01-01)[39m

        [36m### Features[39m

        - **pkg1:** add index file ([5ce9dc6](https://github.com/mock-owner/mock-repo/commit/5ce9dc67745fc4f84b3be4120a9c9277df704cab))
        - set up workspace ([6d1ec56](https://github.com/mock-owner/mock-repo/commit/6d1ec56ef55f7c817248c4295890709e1d9ed663))

        [36m### Bug Fixes[39m

        - **pkg1:** update index file ([a119b76](https://github.com/mock-owner/mock-repo/commit/a119b767a24fd9907ccc423834759b23d5af6f41))

        [44m @scope/pkg2 [49m[42m 2.1.0 ← 2.0.0 [49m[90m minor [39m

        [36m## 2.1.0 (2026-01-01)[39m

        [36m### Features[39m

        - set up workspace ([6d1ec56](https://github.com/mock-owner/mock-repo/commit/6d1ec56ef55f7c817248c4295890709e1d9ed663))
        ",
          ],
        ]
      `)
    })
  })
}, 15_000)
