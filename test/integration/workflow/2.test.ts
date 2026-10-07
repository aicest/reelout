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
  type ReleaseConfig,
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

test('simulates parallel release workflows across milestone tracks', async () => {
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
        version: '1.6.0-0',
      })
      await writeFile(
        path.join(cwd, '.reeloutrc.json'),
        JSON.stringify({
          rules: [
            { pattern: 'main', qualifier: 'dev.{date}', channel: 'next' },
            { pattern: 'release-*', qualifier: 'rc', channel: 'rc' },
          ],
        } satisfies ReleaseConfig)
      )

      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: init'])
      await pushGitChanges(cwd, 'main')
    })

    // CI Workflow Run for User 1 (Nightly context tracking dev channel)
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

    // User 2: Commit and merge patch into dev mainline
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)
      await execGit(cwd, ['config', 'user.name', 'User Two'])
      await execGit(cwd, ['config', 'user.email', 'user2@example.com'])

      await writeFile(
        path.join(cwd, 'packages/pkg1/index.js'),
        'export const pkg1 = 1;'
      )

      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'feat(pkg1): introduce base tracking functionality',
      ])
      await pushGitChanges(cwd, 'main')
    })

    // CI Workflow Run for User 2 (Nightly mainline execution)
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
            "Release complete: [1m[32m1 released[39m[22m [90m(2)[39m

        [44m @scope/pkg1 [49m[42m 1.6.0-dev.20260101.0 ← 1.6.0-0 [49m[90m minor [39m

        [36m## 1.6.0-dev.20260101.0 (2026-01-01)[39m

        [36m### Features[39m

        - **pkg1:** introduce base tracking functionality ([a39f1ae](https://github.com/mock-owner/mock-repo/commit/a39f1aea0b3b0720f128d2b4c5ac90d94778207c))
        ",
          ],
        ]
      `)
    })

    // User 3: Commit and merge a follow-up patch feature into dev mainline
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)
      await execGit(cwd, ['config', 'user.name', 'User Three'])
      await execGit(cwd, ['config', 'user.email', 'user3@example.com'])

      await writeFile(
        path.join(cwd, 'packages/pkg1/index.js'),
        'export const pkg1 = 2;'
      )

      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'feat(pkg1): upgrade core module logic',
      ])
      await pushGitChanges(cwd, 'main')
    })

    // CI Workflow Run for User 3 (Nightly mainline execution)
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
            "Release complete: [1m[32m1 released[39m[22m [90m(2)[39m

        [44m @scope/pkg1 [49m[42m 1.6.0-dev.20260101.1 ← 1.6.0-dev.20260101.0 [49m[90m minor [39m

        [36m## [1.6.0-dev.20260101.1](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.6.0-dev.20260101.0...%40scope%2Fpkg1%401.6.0-dev.20260101.1) (2026-01-01)[39m

        [36m### Features[39m

        - **pkg1:** upgrade core module logic ([3fe11f3](https://github.com/mock-owner/mock-repo/commit/3fe11f313780e515278d48e8bfa0b5ca4f5d94fc))
        ",
          ],
        ]
      `)
    })

    // User 4: Check out dedicated release track branch targeting 1.6 branch stream
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)
      await execGit(cwd, ['checkout', '-b', 'release-1.6'])
      await pushGitChanges(cwd, 'release-1.6')
    })

    // CI Workflow Run for User 4 (Release milestone track execution)
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'release-1.6')

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

    // User 5: Advance mainline upstream targeting future development stages
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)
      await execGit(cwd, ['config', 'user.name', 'User Five'])
      await execGit(cwd, ['config', 'user.email', 'user5@example.com'])

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
        qualifier: '',
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
            "Release complete: [1m[32m1 released[39m[22m [90m(2)[39m

        [44m @scope/pkg1 [49m[42m 1.7.0-0 ← 1.6.0-dev.20260101.1 [49m[90m minor [39m

        [36m## [1.7.0-0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.6.0-dev.20260101.1...%40scope%2Fpkg1%401.7.0-0) (2026-01-01)[39m
        ",
          ],
        ]
      `)
    })

    // CI Workflow Run for User 5 (Nightly mainline execution)
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

    // User 6: Commit patch fix directly to the main development track
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
        'fix(pkg1): address milestone target blocker',
      ])
      await pushGitChanges(cwd, 'main')
    })

    // User 7: Clone main track, fetch milestone track, and cherry-pick the newest fix commit directly from origin/main
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'release-1.6')
      await execGit(cwd, ['fetch', 'origin', 'main:refs/remotes/origin/main'])
      await execGit(cwd, ['cherry-pick', 'origin/main'])
      await pushGitChanges(cwd, 'release-1.6')
    })

    // CI Workflow Run for User 6 (Nightly mainline execution)
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
            "Release complete: [1m[32m1 released[39m[22m [90m(2)[39m

        [44m @scope/pkg1 [49m[42m 1.7.0-dev.20260101.0 ← 1.7.0-0 [49m[90m patch [39m

        [36m## [1.7.0-dev.20260101.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.7.0-0...%40scope%2Fpkg1%401.7.0-dev.20260101.0) (2026-01-01)[39m

        [36m### Bug Fixes[39m

        - **pkg1:** address milestone target blocker ([8c02a7c](https://github.com/mock-owner/mock-repo/commit/8c02a7c8129fd4837e95b55477e43eb2e06ff73f))
        ",
          ],
        ]
      `)
    })

    // CI Workflow Run for User 7 (Release track validation check execution)
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'release-1.6')

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
            "Release complete: [1m[32m1 released[39m[22m [90m(2)[39m

        [44m @scope/pkg1 [49m[42m 1.6.0-rc.0 ← 1.6.0-dev.20260101.1 [49m[90m patch [39m

        [36m## [1.6.0-rc.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.6.0-dev.20260101.1...%40scope%2Fpkg1%401.6.0-rc.0) (2026-01-01)[39m

        [36m### Bug Fixes[39m

        - **pkg1:** address milestone target blocker ([fb8cecf](https://github.com/mock-owner/mock-repo/commit/fb8cecfdb9f2f40ed4a32dfacce1e74c7b2e1b64))
        ",
          ],
        ]
      `)
    })

    // User 8: Intercept milestone branch with second critical isolation hotfix
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'release-1.6')
      await execGit(cwd, ['config', 'user.name', 'User Eight'])
      await execGit(cwd, ['config', 'user.email', 'user8@example.com'])

      await writeFile(
        path.join(cwd, 'packages/pkg1/index.js'),
        'export const pkg1 = 2; // cherry-picked-patch-2'
      )

      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'fix(pkg1): resolve historical pipeline execution regression',
      ])
      await pushGitChanges(cwd, 'release-1.6')
    })

    // CI Workflow Run for User 8 (Release track validation check execution)
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'release-1.6')

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
            "Release complete: [1m[32m1 released[39m[22m [90m(2)[39m

        [44m @scope/pkg1 [49m[42m 1.6.0-rc.1 ← 1.6.0-rc.0 [49m[90m patch [39m

        [36m## [1.6.0-rc.1](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.6.0-rc.0...%40scope%2Fpkg1%401.6.0-rc.1) (2026-01-01)[39m

        [36m### Bug Fixes[39m

        - **pkg1:** resolve historical pipeline execution regression ([bfaad25](https://github.com/mock-owner/mock-repo/commit/bfaad253cc9d56e6bd3044f5031aa3512b4e7f08))
        ",
          ],
        ]
      `)
    })

    // User 9: Manual dispatch trigger on milestone track to force product release promotion
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'release-1.6')

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
            "Release complete: [1m[32m1 released[39m[22m [90m(2)[39m

        [44m @scope/pkg1 [49m[42m 1.6.0 ← 1.6.0-rc.1 [49m[90m minor [39m

        [36m## [1.6.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.6.0-rc.1...%40scope%2Fpkg1%401.6.0) (2026-01-01)[39m
        ",
          ],
        ]
      `)
    })

    vi.setSystemTime(new Date('2026-01-02T00:00:00Z'))

    // User 10: Update the main development track with new feature work
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)
      await execGit(cwd, ['config', 'user.name', 'User Ten'])
      await execGit(cwd, ['config', 'user.email', 'user10@example.com'])

      await writeFile(
        path.join(cwd, 'packages/pkg1/index.js'),
        'export const pkg1 = 3;'
      )

      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'feat(pkg1): implement post-release feature enhancement',
      ])
      await pushGitChanges(cwd, 'main')
    })

    // CI Workflow Run for User 10 (Nightly mainline execution for new changes)
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
            "Release complete: [1m[32m1 released[39m[22m [90m(2)[39m

        [44m @scope/pkg1 [49m[42m 1.7.0-dev.20260102.0 ← 1.7.0-dev.20260101.0 [49m[90m minor [39m

        [36m## [1.7.0-dev.20260102.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.7.0-dev.20260101.0...%40scope%2Fpkg1%401.7.0-dev.20260102.0) (2026-01-02)[39m

        [36m### Features[39m

        - **pkg1:** implement post-release feature enhancement ([b784f51](https://github.com/mock-owner/mock-repo/commit/b784f51b7da32688a176d27823f528454b1aad10))
        ",
          ],
        ]
      `)
    })

    // Final global repository validation assertions executing on full git history context
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)
      await restoreFullGitHistory(cwd)

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.6.0-dev.20260101.0 ## Features

        - **pkg1:** introduce base tracking functionality ([a39f1ae](https://github.com/mock-owner/mock-repo/commit/a39f1aea0b3b0720f128d2b4c5ac90d94778207c))",
          "@scope/pkg1@1.6.0-dev.20260101.1 ## Features

        - **pkg1:** upgrade core module logic ([3fe11f3](https://github.com/mock-owner/mock-repo/commit/3fe11f313780e515278d48e8bfa0b5ca4f5d94fc))",
          "@scope/pkg1@1.7.0-0",
          "@scope/pkg1@1.7.0-dev.20260101.0 ## Bug Fixes

        - **pkg1:** address milestone target blocker ([8c02a7c](https://github.com/mock-owner/mock-repo/commit/8c02a7c8129fd4837e95b55477e43eb2e06ff73f))",
          "@scope/pkg1@1.7.0-dev.20260102.0 ## Features

        - **pkg1:** implement post-release feature enhancement ([b784f51](https://github.com/mock-owner/mock-repo/commit/b784f51b7da32688a176d27823f528454b1aad10))",
        ]
      `)

      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "chore: init",
          "feat(pkg1): introduce base tracking functionality",
          "chore: release @scope/pkg1@1.6.0-dev.20260101.0",
          "feat(pkg1): upgrade core module logic",
          "chore: release @scope/pkg1@1.6.0-dev.20260101.1",
          "chore: release @scope/pkg1@1.7.0-0",
          "fix(pkg1): address milestone target blocker",
          "chore: release @scope/pkg1@1.7.0-dev.20260101.0",
          "feat(pkg1): implement post-release feature enhancement",
          "chore: release @scope/pkg1@1.7.0-dev.20260102.0",
        ]
      `)

      const changelog1 = await readFile(
        path.join(cwd, 'packages/pkg1/CHANGELOG.md'),
        'utf-8'
      )

      expect(changelog1).toMatchInlineSnapshot(`
        "# Changelog

        ## [1.7.0-dev.20260102.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.7.0-dev.20260101.0...%40scope%2Fpkg1%401.7.0-dev.20260102.0) (2026-01-02)

        ### Features

        - **pkg1:** implement post-release feature enhancement ([b784f51](https://github.com/mock-owner/mock-repo/commit/b784f51b7da32688a176d27823f528454b1aad10))

        ## [1.7.0-dev.20260101.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.7.0-0...%40scope%2Fpkg1%401.7.0-dev.20260101.0) (2026-01-01)

        ### Bug Fixes

        - **pkg1:** address milestone target blocker ([8c02a7c](https://github.com/mock-owner/mock-repo/commit/8c02a7c8129fd4837e95b55477e43eb2e06ff73f))

        ## [1.7.0-0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.6.0-dev.20260101.1...%40scope%2Fpkg1%401.7.0-0) (2026-01-01)

        ## [1.6.0-dev.20260101.1](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.6.0-dev.20260101.0...%40scope%2Fpkg1%401.6.0-dev.20260101.1) (2026-01-01)

        ### Features

        - **pkg1:** upgrade core module logic ([3fe11f3](https://github.com/mock-owner/mock-repo/commit/3fe11f313780e515278d48e8bfa0b5ca4f5d94fc))

        ## 1.6.0-dev.20260101.0 (2026-01-01)

        ### Features

        - **pkg1:** introduce base tracking functionality ([a39f1ae](https://github.com/mock-owner/mock-repo/commit/a39f1aea0b3b0720f128d2b4c5ac90d94778207c))
        "
      `)

      await execGit(cwd, ['fetch', 'origin', 'release-1.6:release-1.6'])
      await execGit(cwd, ['checkout', 'release-1.6'])

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.6.0 ## Features

        - **pkg1:** introduce base tracking functionality ([a39f1ae](https://github.com/mock-owner/mock-repo/commit/a39f1aea0b3b0720f128d2b4c5ac90d94778207c))
        - **pkg1:** upgrade core module logic ([3fe11f3](https://github.com/mock-owner/mock-repo/commit/3fe11f313780e515278d48e8bfa0b5ca4f5d94fc))

        ## Bug Fixes

        - **pkg1:** address milestone target blocker ([fb8cecf](https://github.com/mock-owner/mock-repo/commit/fb8cecfdb9f2f40ed4a32dfacce1e74c7b2e1b64))
        - **pkg1:** resolve historical pipeline execution regression ([bfaad25](https://github.com/mock-owner/mock-repo/commit/bfaad253cc9d56e6bd3044f5031aa3512b4e7f08))",
          "@scope/pkg1@1.6.0-dev.20260101.0 ## Features

        - **pkg1:** introduce base tracking functionality ([a39f1ae](https://github.com/mock-owner/mock-repo/commit/a39f1aea0b3b0720f128d2b4c5ac90d94778207c))",
          "@scope/pkg1@1.6.0-dev.20260101.1 ## Features

        - **pkg1:** upgrade core module logic ([3fe11f3](https://github.com/mock-owner/mock-repo/commit/3fe11f313780e515278d48e8bfa0b5ca4f5d94fc))",
          "@scope/pkg1@1.6.0-rc.0 ## Bug Fixes

        - **pkg1:** address milestone target blocker ([fb8cecf](https://github.com/mock-owner/mock-repo/commit/fb8cecfdb9f2f40ed4a32dfacce1e74c7b2e1b64))",
          "@scope/pkg1@1.6.0-rc.1 ## Bug Fixes

        - **pkg1:** resolve historical pipeline execution regression ([bfaad25](https://github.com/mock-owner/mock-repo/commit/bfaad253cc9d56e6bd3044f5031aa3512b4e7f08))",
          "@scope/pkg1@1.7.0-0",
          "@scope/pkg1@1.7.0-dev.20260101.0 ## Bug Fixes

        - **pkg1:** address milestone target blocker ([8c02a7c](https://github.com/mock-owner/mock-repo/commit/8c02a7c8129fd4837e95b55477e43eb2e06ff73f))",
          "@scope/pkg1@1.7.0-dev.20260102.0 ## Features

        - **pkg1:** implement post-release feature enhancement ([b784f51](https://github.com/mock-owner/mock-repo/commit/b784f51b7da32688a176d27823f528454b1aad10))",
        ]
      `)

      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "chore: init",
          "feat(pkg1): introduce base tracking functionality",
          "chore: release @scope/pkg1@1.6.0-dev.20260101.0",
          "feat(pkg1): upgrade core module logic",
          "chore: release @scope/pkg1@1.6.0-dev.20260101.1",
          "fix(pkg1): address milestone target blocker",
          "chore: release @scope/pkg1@1.6.0-rc.0",
          "fix(pkg1): resolve historical pipeline execution regression",
          "chore: release @scope/pkg1@1.6.0-rc.1",
          "chore: release @scope/pkg1@1.6.0",
        ]
      `)

      const changelog2 = await readFile(
        path.join(cwd, 'packages/pkg1/CHANGELOG.md'),
        'utf-8'
      )

      expect(changelog2).toMatchInlineSnapshot(`
        "# Changelog

        ## [1.6.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.6.0-rc.1...%40scope%2Fpkg1%401.6.0) (2026-01-01)

        ## [1.6.0-rc.1](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.6.0-rc.0...%40scope%2Fpkg1%401.6.0-rc.1) (2026-01-01)

        ### Bug Fixes

        - **pkg1:** resolve historical pipeline execution regression ([bfaad25](https://github.com/mock-owner/mock-repo/commit/bfaad253cc9d56e6bd3044f5031aa3512b4e7f08))

        ## [1.6.0-rc.0](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.6.0-dev.20260101.1...%40scope%2Fpkg1%401.6.0-rc.0) (2026-01-01)

        ### Bug Fixes

        - **pkg1:** address milestone target blocker ([fb8cecf](https://github.com/mock-owner/mock-repo/commit/fb8cecfdb9f2f40ed4a32dfacce1e74c7b2e1b64))

        ## [1.6.0-dev.20260101.1](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.6.0-dev.20260101.0...%40scope%2Fpkg1%401.6.0-dev.20260101.1) (2026-01-01)

        ### Features

        - **pkg1:** upgrade core module logic ([3fe11f3](https://github.com/mock-owner/mock-repo/commit/3fe11f313780e515278d48e8bfa0b5ca4f5d94fc))

        ## 1.6.0-dev.20260101.0 (2026-01-01)

        ### Features

        - **pkg1:** introduce base tracking functionality ([a39f1ae](https://github.com/mock-owner/mock-repo/commit/a39f1aea0b3b0720f128d2b4c5ac90d94778207c))
        "
      `)
    })
  })
}, 60_000)
