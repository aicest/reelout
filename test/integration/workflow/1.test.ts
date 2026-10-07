// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../mock/integration'

import { resolveConfig } from '@reelout/config'
import { createContext } from '@reelout/context'
import {
  compact,
  createPlugin,
  execGit,
  executeReleaseWorkflow,
  pushGitChanges,
  restoreFullGitHistory,
} from '@reelout/core'
import { writePackageJson } from '@reelout/npm'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test, vi } from 'vitest'
import { createMockLogger } from '../../mock/context'
import {
  cloneGitRepository,
  getGitCommitSubjects,
  getGitTags,
  initializeGitRepository,
} from '../../mock/git'

test('simulates mainline release workflows under manual promotion', async () => {
  await temporaryDirectoryTask(async (remote) => {
    // User 1: Init repository & project structure
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)
      await execGit(cwd, ['config', 'user.name', 'User One'])
      await execGit(cwd, ['config', 'user.email', 'user1@example.com'])

      await writePackageJson(cwd, {
        version: '0.0.0',
        private: true,
        workspaces: ['packages/*'],
      })
      await writePackageJson(path.join(cwd, 'packages/pkg1'), {
        name: '@scope/pkg1',
        version: '0.0.0',
      })
      await writePackageJson(path.join(cwd, 'packages/pkg2'), {
        name: '@scope/pkg2',
        version: '0.0.0',
      })

      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: init'])
      await pushGitChanges(cwd, 'main')
    })

    // CI workflow run for User 1
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

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

    // User 2: Commit and merge pkg1 updates
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)
      await execGit(cwd, ['config', 'user.name', 'User Two'])
      await execGit(cwd, ['config', 'user.email', 'user2@example.com'])

      await writeFile(
        path.join(cwd, 'packages/pkg1/index.js'),
        'export const pkg1 = 1;'
      )

      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg1): minor update'])
      await pushGitChanges(cwd, 'main')
    })

    // CI workflow run for User 2
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

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

      expect(logger.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "Status: [32mSUCCESS[39m",
          ],
          [
            "Release complete: [1m[32m1 released[39m[22m [90m(3)[39m

        [44m @scope/pkg1 [49m[42m 0.1.0 ← 0.0.0 [49m[90m minor [39m

        [36m## 0.1.0 (2026-01-01)[39m

        [36m### Features[39m

        - **pkg1:** minor update ([3cdb3d7](https://github.com/mock-owner/mock-repo/commit/3cdb3d7eafb9b1c93bd831f35e4e4b52aa69fbc9))
        ",
          ],
        ]
      `)
    })

    // User 3: Commit and merge pkg2 updates
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)
      await execGit(cwd, ['config', 'user.name', 'User Three'])
      await execGit(cwd, ['config', 'user.email', 'user3@example.com'])

      await writeFile(
        path.join(cwd, 'packages/pkg2/index.js'),
        'export const pkg2 = 1;'
      )

      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg2): minor update'])
      await pushGitChanges(cwd, 'main')
    })

    // CI workflow run for User 3
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

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

      expect(logger.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "Status: [32mSUCCESS[39m",
          ],
          [
            "Release complete: [1m[32m1 released[39m[22m [90m(3)[39m

        [44m @scope/pkg2 [49m[42m 0.1.0 ← 0.0.0 [49m[90m minor [39m

        [36m## 0.1.0 (2026-01-01)[39m

        [36m### Features[39m

        - **pkg2:** minor update ([4ab90da](https://github.com/mock-owner/mock-repo/commit/4ab90da5537e45a2146064d36a8dda3614412400))
        ",
          ],
        ]
      `)
    })

    // User 4: Trigger promotion dispatch (promote = true)
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const logger = vi.fn()

      const config = await resolveConfig(cwd)

      const context = await createContext({
        ...config,
        cwd,
        env: process.env,
        stdout: process.stdout,
        stderr: process.stderr,
        logger: createMockLogger(logger),
        type: 'auto',
        qualifier: false,
        allowEmpty: true,
      })

      await executeReleaseWorkflow(
        context,
        compact(await Promise.all(config.plugins.map(createPlugin)))
      )

      expect(logger.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "Status: [32mSUCCESS[39m",
          ],
          [
            "Release complete: [1m[32m2 released[39m[22m [90m(3)[39m

        [44m @scope/pkg1 [49m[41m 1.0.0 ← 0.1.0 [49m[90m major [39m

        [36m## [1.0.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%400.1.0...%40scope%2Fpkg1%401.0.0) (2026-01-01)[39m

        [44m @scope/pkg2 [49m[41m 1.0.0 ← 0.1.0 [49m[90m major [39m

        [36m## [1.0.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg2%400.1.0...%40scope%2Fpkg2%401.0.0) (2026-01-01)[39m
        ",
          ],
        ]
      `)
    })

    // User 5: Commit and merge synchronized upgrades across separate commits
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)
      await execGit(cwd, ['config', 'user.name', 'User Five'])
      await execGit(cwd, ['config', 'user.email', 'user5@example.com'])

      await writeFile(
        path.join(cwd, 'packages/pkg1/index.js'),
        'export const pkg1 = 2;'
      )
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg1): upgrade'])

      await writeFile(
        path.join(cwd, 'packages/pkg2/index.js'),
        'export const pkg2 = 2;'
      )
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg2): upgrade'])

      await pushGitChanges(cwd, 'main')
    })

    // CI workflow run for User 5
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

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

      expect(logger.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "Status: [32mSUCCESS[39m",
          ],
          [
            "Release complete: [1m[32m2 released[39m[22m [90m(3)[39m

        [44m @scope/pkg1 [49m[42m 1.1.0 ← 1.0.0 [49m[90m minor [39m

        [36m## [1.1.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.0.0...%40scope%2Fpkg1%401.1.0) (2026-01-01)[39m

        [36m### Features[39m

        - **pkg1:** upgrade ([94ff09d](https://github.com/mock-owner/mock-repo/commit/94ff09d92a888024e58d80edfb8139d94a02f39f))

        [44m @scope/pkg2 [49m[42m 1.1.0 ← 1.0.0 [49m[90m minor [39m

        [36m## [1.1.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg2%401.0.0...%40scope%2Fpkg2%401.1.0) (2026-01-01)[39m

        [36m### Features[39m

        - **pkg2:** upgrade ([fec3c77](https://github.com/mock-owner/mock-repo/commit/fec3c77adefc055f0bcc262e91d55d8af5243a71))
        ",
          ],
        ]
      `)
    })

    // User 6: Commit and merge a patch fix
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)
      await execGit(cwd, ['config', 'user.name', 'User Six'])
      await execGit(cwd, ['config', 'user.email', 'user6@example.com'])

      await writeFile(
        path.join(cwd, 'packages/pkg1/index.js'),
        'export const pkg1 = 2; // hotfix'
      )

      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'fix(pkg1): resolve runtime regression',
      ])
      await pushGitChanges(cwd, 'main')
    })

    // CI workflow run for User 6
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

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

      expect(logger.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "Status: [32mSUCCESS[39m",
          ],
          [
            "Release complete: [1m[32m1 released[39m[22m [90m(3)[39m

        [44m @scope/pkg1 [49m[42m 1.1.1 ← 1.1.0 [49m[90m patch [39m

        [36m## [1.1.1](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.1.0...%40scope%2Fpkg1%401.1.1) (2026-01-01)[39m

        [36m### Bug Fixes[39m

        - **pkg1:** resolve runtime regression ([fbb7e39](https://github.com/mock-owner/mock-repo/commit/fbb7e3909853fe40a8fa4cd94a88b8f43b5090f1))
        ",
          ],
        ]
      `)
    })

    // User 7: Trigger second promotion dispatch (promote = true)
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const logger = vi.fn()

      const config = await resolveConfig(cwd)

      const context = await createContext({
        ...config,
        cwd,
        env: process.env,
        stdout: process.stdout,
        stderr: process.stderr,
        logger: createMockLogger(logger),
        type: 'minor',
      })

      await executeReleaseWorkflow(
        context,
        compact(await Promise.all(config.plugins.map(createPlugin)))
      )

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

    // Final global checks against downstream release artifact outputs
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)
      await restoreFullGitHistory(cwd)

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@0.1.0 ## Features

        - **pkg1:** minor update ([3cdb3d7](https://github.com/mock-owner/mock-repo/commit/3cdb3d7eafb9b1c93bd831f35e4e4b52aa69fbc9))",
          "@scope/pkg1@1.0.0 ## Features

        - **pkg1:** minor update ([3cdb3d7](https://github.com/mock-owner/mock-repo/commit/3cdb3d7eafb9b1c93bd831f35e4e4b52aa69fbc9))",
          "@scope/pkg1@1.1.0 ## Features

        - **pkg1:** upgrade ([94ff09d](https://github.com/mock-owner/mock-repo/commit/94ff09d92a888024e58d80edfb8139d94a02f39f))",
          "@scope/pkg1@1.1.1 ## Bug Fixes

        - **pkg1:** resolve runtime regression ([fbb7e39](https://github.com/mock-owner/mock-repo/commit/fbb7e3909853fe40a8fa4cd94a88b8f43b5090f1))",
          "@scope/pkg2@0.1.0 ## Features

        - **pkg2:** minor update ([4ab90da](https://github.com/mock-owner/mock-repo/commit/4ab90da5537e45a2146064d36a8dda3614412400))",
          "@scope/pkg2@1.0.0 ## Features

        - **pkg2:** minor update ([4ab90da](https://github.com/mock-owner/mock-repo/commit/4ab90da5537e45a2146064d36a8dda3614412400))",
          "@scope/pkg2@1.1.0 ## Features

        - **pkg2:** upgrade ([fec3c77](https://github.com/mock-owner/mock-repo/commit/fec3c77adefc055f0bcc262e91d55d8af5243a71))",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "chore: init",
          "feat(pkg1): minor update",
          "chore: release @scope/pkg1@0.1.0",
          "feat(pkg2): minor update",
          "chore: release @scope/pkg2@0.1.0",
          "chore: release @scope/pkg1@1.0.0, @scope/pkg2@1.0.0",
          "feat(pkg1): upgrade",
          "feat(pkg2): upgrade",
          "chore: release @scope/pkg1@1.1.0, @scope/pkg2@1.1.0",
          "fix(pkg1): resolve runtime regression",
          "chore: release @scope/pkg1@1.1.1",
        ]
      `)

      const changelog1 = await readFile(
        path.join(cwd, 'packages/pkg1/CHANGELOG.md'),
        'utf-8'
      )
      const changelog2 = await readFile(
        path.join(cwd, 'packages/pkg2/CHANGELOG.md'),
        'utf-8'
      )

      expect(changelog1).toMatchInlineSnapshot(`
        "# Changelog

        ## [1.1.1](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.1.0...%40scope%2Fpkg1%401.1.1) (2026-01-01)

        ### Bug Fixes

        - **pkg1:** resolve runtime regression ([fbb7e39](https://github.com/mock-owner/mock-repo/commit/fbb7e3909853fe40a8fa4cd94a88b8f43b5090f1))

        ## [1.1.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.0.0...%40scope%2Fpkg1%401.1.0) (2026-01-01)

        ### Features

        - **pkg1:** upgrade ([94ff09d](https://github.com/mock-owner/mock-repo/commit/94ff09d92a888024e58d80edfb8139d94a02f39f))

        ## [1.0.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%400.1.0...%40scope%2Fpkg1%401.0.0) (2026-01-01)

        ## 0.1.0 (2026-01-01)

        ### Features

        - **pkg1:** minor update ([3cdb3d7](https://github.com/mock-owner/mock-repo/commit/3cdb3d7eafb9b1c93bd831f35e4e4b52aa69fbc9))
        "
      `)
      expect(changelog2).toMatchInlineSnapshot(`
        "# Changelog

        ## [1.1.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg2%401.0.0...%40scope%2Fpkg2%401.1.0) (2026-01-01)

        ### Features

        - **pkg2:** upgrade ([fec3c77](https://github.com/mock-owner/mock-repo/commit/fec3c77adefc055f0bcc262e91d55d8af5243a71))

        ## [1.0.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg2%400.1.0...%40scope%2Fpkg2%401.0.0) (2026-01-01)

        ## 0.1.0 (2026-01-01)

        ### Features

        - **pkg2:** minor update ([4ab90da](https://github.com/mock-owner/mock-repo/commit/4ab90da5537e45a2146064d36a8dda3614412400))
        "
      `)
    })
  })
}, 60_000)
