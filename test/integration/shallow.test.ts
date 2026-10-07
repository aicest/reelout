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
  pushGitChanges,
} from '@reelout/core'
import { updatePackageJson, writePackageJson } from '@reelout/npm'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test, vi } from 'vitest'
import { createMockLogger } from '../mock/context'
import {
  cloneGitRepository,
  getGitCommitSubjects,
  getGitTags,
  initializeGitRepository,
} from '../mock/git'

async function showLastCommit(cwd: string): Promise<string | null> {
  return (await execGit(cwd, ['log', '-1', '--format=%B'])).trim()
}

test('releases packages in shallow clone across varying manifests', async () => {
  await temporaryDirectoryTask(async (remote) => {
    // Task 1: Initialize remote repository and build the workspace layout tree
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
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: link internal packages'])

      await writePackageJson(pkgDir1, {
        name: '@scope/pkg1',
        version: '1.0.0',
        dependencies: { '@scope/pkg2': 'workspace:^' },
      })
      await writeFile(path.join(pkgDir1, 'index.js'), 'export const pkg1 = 1;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg1): add index file'])

      await writePackageJson(pkgDir2, {
        name: '@scope/pkg2',
        version: '2.0.0',
        dependencies: { '@scope/pkg3': 'workspace:^' },
      })
      await writeFile(path.join(pkgDir2, 'index.js'), 'export const pkg2 = 2;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg2): add entry script'])

      await writePackageJson(pkgDir3, { name: undefined, version: '3.0.0' })
      await writeFile(path.join(pkgDir3, 'index.js'), 'export const pkg3 = 3;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg3): omit package name'])

      await writePackageJson(pkgDir4, { name: undefined, version: undefined })
      await writeFile(path.join(pkgDir4, 'index.js'), 'export const pkg4 = 4;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg4): omit name and version'])

      await writeFile(path.join(pkgDir5, 'package.json'), 'not a valid json')
      await writeFile(path.join(pkgDir5, 'index.js'), 'export const pkg5 = 5;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'feat(pkg5): use invalid manifest json',
      ])

      await pushGitChanges(cwd, 'main', '--tags')

      expect(await getGitTags(remote)).toMatchInlineSnapshot(`[]`)
      expect(await getGitCommitSubjects(remote)).toMatchInlineSnapshot(`
        [
          "chore: add empty package.json",
          "chore: link internal packages",
          "feat(pkg1): add index file",
          "feat(pkg2): add entry script",
          "feat(pkg3): omit package name",
          "feat(pkg4): omit name and version",
          "feat(pkg5): use invalid manifest json",
        ]
      `)
    })

    // Task 2: Validate baseline execution state inside a clean shallow checkout environment
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

      expect(await getGitTags(remote)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.1.0 ## Features

        - **pkg1:** add index file ([6eb7792](https://github.com/mock-owner/mock-repo/commit/6eb7792b3d85bafb5b0bd7f6210c9cd6ed3d5d73))
        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))",
          "@scope/pkg2@2.1.0 ## Features

        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))",
          "v0.0.1 ## Features

        - **pkg1:** add index file ([6eb7792](https://github.com/mock-owner/mock-repo/commit/6eb7792b3d85bafb5b0bd7f6210c9cd6ed3d5d73))
        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))",
        ]
      `)
      expect(await showLastCommit(remote)).toMatchInlineSnapshot(`
        "chore: release v0.0.1, @scope/pkg1@1.1.0, @scope/pkg2@2.1.0

        Version Updates:
        - .: 0.0.0 → 0.0.1
        - @scope/pkg1: 1.0.0 → 1.1.0
        - @scope/pkg2: 2.0.0 → 2.1.0

        Notable Changes:
        - feat(pkg1): add index file
        - feat(pkg2): add entry script

        Release-Agent: ReelOut/0.0.0"
      `)
      expect(await getGitCommitSubjects(remote)).toMatchInlineSnapshot(`
        [
          "chore: add empty package.json",
          "chore: link internal packages",
          "feat(pkg1): add index file",
          "feat(pkg2): add entry script",
          "feat(pkg3): omit package name",
          "feat(pkg4): omit name and version",
          "feat(pkg5): use invalid manifest json",
          "chore: release v0.0.1, @scope/pkg1@1.1.0, @scope/pkg2@2.1.0",
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

        - **pkg1:** add index file ([6eb7792](https://github.com/mock-owner/mock-repo/commit/6eb7792b3d85bafb5b0bd7f6210c9cd6ed3d5d73))
        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))

        [90m ./packages/pkg3 [39m[42m 3.1.0 ← 3.0.0 [49m[90m minor [39m

        [36m## 3.1.0 (2026-01-01)[39m

        [36m### Features[39m

        - **pkg3:** omit package name ([89354e7](https://github.com/mock-owner/mock-repo/commit/89354e77aad3d3579eca45cf3aca382f9322f990))

        [44m @scope/pkg1 [49m[42m 1.1.0 ← 1.0.0 [49m[90m minor [39m

        [36m## 1.1.0 (2026-01-01)[39m

        [36m### Features[39m

        - **pkg1:** add index file ([6eb7792](https://github.com/mock-owner/mock-repo/commit/6eb7792b3d85bafb5b0bd7f6210c9cd6ed3d5d73))
        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))

        [44m @scope/pkg2 [49m[42m 2.1.0 ← 2.0.0 [49m[90m minor [39m

        [36m## 2.1.0 (2026-01-01)[39m

        [36m### Features[39m

        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))
        ",
          ],
        ]
      `)
    })

    // Task 3: Introduce standard fixes across dependency paths
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const pkgDir1 = path.join(cwd, 'packages/pkg1')
      const pkgDir2 = path.join(cwd, 'packages/pkg2')

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const pkg1 = 2;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'fix(pkg1): update entry exports'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const pkg2 = 3;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'fix(pkg2): correct module logic'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    // Task 4: Process and execute the changes introduced in Task 3
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

      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "feat(pkg5): use invalid manifest json",
          "chore: release v0.0.1, @scope/pkg1@1.1.0, @scope/pkg2@2.1.0",
          "fix(pkg1): update entry exports",
          "fix(pkg2): correct module logic",
          "chore: release v0.0.2, @scope/pkg1@1.1.1, @scope/pkg2@2.1.1",
        ]
      `)
      expect(await getGitTags(remote)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.1.0 ## Features

        - **pkg1:** add index file ([6eb7792](https://github.com/mock-owner/mock-repo/commit/6eb7792b3d85bafb5b0bd7f6210c9cd6ed3d5d73))
        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))",
          "@scope/pkg1@1.1.1 ## Bug Fixes

        - **pkg1:** update entry exports ([8be045d](https://github.com/mock-owner/mock-repo/commit/8be045de87e3c0d6cc25d6a865fa9aa543ac9b64))
        - **pkg2:** correct module logic ([8f013a7](https://github.com/mock-owner/mock-repo/commit/8f013a7983c41e5d461d62dec15944f707a076c8))",
          "@scope/pkg2@2.1.0 ## Features

        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))",
          "@scope/pkg2@2.1.1 ## Bug Fixes

        - **pkg2:** correct module logic ([8f013a7](https://github.com/mock-owner/mock-repo/commit/8f013a7983c41e5d461d62dec15944f707a076c8))",
          "v0.0.1 ## Features

        - **pkg1:** add index file ([6eb7792](https://github.com/mock-owner/mock-repo/commit/6eb7792b3d85bafb5b0bd7f6210c9cd6ed3d5d73))
        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))",
          "v0.0.2 ## Bug Fixes

        - **pkg1:** update entry exports ([8be045d](https://github.com/mock-owner/mock-repo/commit/8be045de87e3c0d6cc25d6a865fa9aa543ac9b64))
        - **pkg2:** correct module logic ([8f013a7](https://github.com/mock-owner/mock-repo/commit/8f013a7983c41e5d461d62dec15944f707a076c8))",
        ]
      `)
      expect(await showLastCommit(remote)).toMatchInlineSnapshot(`
        "chore: release v0.0.2, @scope/pkg1@1.1.1, @scope/pkg2@2.1.1

        Version Updates:
        - .: 0.0.1 → 0.0.2
        - @scope/pkg1: 1.1.0 → 1.1.1
        - @scope/pkg2: 2.1.0 → 2.1.1

        Notable Changes:
        - fix(pkg1): update entry exports
        - fix(pkg2): correct module logic

        Release-Agent: ReelOut/0.0.0"
      `)
      expect(await getGitCommitSubjects(remote)).toMatchInlineSnapshot(`
        [
          "chore: add empty package.json",
          "chore: link internal packages",
          "feat(pkg1): add index file",
          "feat(pkg2): add entry script",
          "feat(pkg3): omit package name",
          "feat(pkg4): omit name and version",
          "feat(pkg5): use invalid manifest json",
          "chore: release v0.0.1, @scope/pkg1@1.1.0, @scope/pkg2@2.1.0",
          "fix(pkg1): update entry exports",
          "fix(pkg2): correct module logic",
          "chore: release v0.0.2, @scope/pkg1@1.1.1, @scope/pkg2@2.1.1",
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
            "Status: [32mSUCCESS[39m",
          ],
          [
            "Release complete: [1m[32m3 released[39m[22m [90m(4)[39m

        [42m 0.0.2 ← 0.0.1 [49m[90m patch [39m

        [36m## [0.0.2](https://github.com/mock-owner/mock-repo/compare/v0.0.1...v0.0.2) (2026-01-01)[39m

        [36m### Bug Fixes[39m

        - **pkg1:** update entry exports ([8be045d](https://github.com/mock-owner/mock-repo/commit/8be045de87e3c0d6cc25d6a865fa9aa543ac9b64))
        - **pkg2:** correct module logic ([8f013a7](https://github.com/mock-owner/mock-repo/commit/8f013a7983c41e5d461d62dec15944f707a076c8))

        [44m @scope/pkg1 [49m[42m 1.1.1 ← 1.1.0 [49m[90m patch [39m

        [36m## [1.1.1](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.1.0...%40scope%2Fpkg1%401.1.1) (2026-01-01)[39m

        [36m### Bug Fixes[39m

        - **pkg1:** update entry exports ([8be045d](https://github.com/mock-owner/mock-repo/commit/8be045de87e3c0d6cc25d6a865fa9aa543ac9b64))
        - **pkg2:** correct module logic ([8f013a7](https://github.com/mock-owner/mock-repo/commit/8f013a7983c41e5d461d62dec15944f707a076c8))

        [44m @scope/pkg2 [49m[42m 2.1.1 ← 2.1.0 [49m[90m patch [39m

        [36m## [2.1.1](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg2%402.1.0...%40scope%2Fpkg2%402.1.1) (2026-01-01)[39m

        [36m### Bug Fixes[39m

        - **pkg2:** correct module logic ([8f013a7](https://github.com/mock-owner/mock-repo/commit/8f013a7983c41e5d461d62dec15944f707a076c8))
        ",
          ],
        ]
      `)
    })

    // Task 5: Add an isolated fix to pkg1
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const pkgDir1 = path.join(cwd, 'packages/pkg1')

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const pkg1 = 4;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'fix(pkg1): change target value to 4',
      ])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    // Task 6: Add a consecutive overlapping fix to pkg1 prior to running the workflow
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const pkgDir1 = path.join(cwd, 'packages/pkg1')

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const pkg1 = 5;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'fix(pkg1): update target value to 5',
      ])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    // Task 7: Execute verification workflow evaluating consecutive, multi-commit updates on pkg1
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

      expect(await getGitTags(remote)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.1.0 ## Features

        - **pkg1:** add index file ([6eb7792](https://github.com/mock-owner/mock-repo/commit/6eb7792b3d85bafb5b0bd7f6210c9cd6ed3d5d73))
        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))",
          "@scope/pkg1@1.1.1 ## Bug Fixes

        - **pkg1:** update entry exports ([8be045d](https://github.com/mock-owner/mock-repo/commit/8be045de87e3c0d6cc25d6a865fa9aa543ac9b64))
        - **pkg2:** correct module logic ([8f013a7](https://github.com/mock-owner/mock-repo/commit/8f013a7983c41e5d461d62dec15944f707a076c8))",
          "@scope/pkg1@1.1.2 ## Bug Fixes

        - **pkg1:** change target value to 4 ([7ce1a15](https://github.com/mock-owner/mock-repo/commit/7ce1a15b75be65d9265e3b033c87062aeca09a92))
        - **pkg1:** update target value to 5 ([9eae461](https://github.com/mock-owner/mock-repo/commit/9eae46109fbc5d8a3ddee934534abb4154680d53))",
          "@scope/pkg2@2.1.0 ## Features

        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))",
          "@scope/pkg2@2.1.1 ## Bug Fixes

        - **pkg2:** correct module logic ([8f013a7](https://github.com/mock-owner/mock-repo/commit/8f013a7983c41e5d461d62dec15944f707a076c8))",
          "v0.0.1 ## Features

        - **pkg1:** add index file ([6eb7792](https://github.com/mock-owner/mock-repo/commit/6eb7792b3d85bafb5b0bd7f6210c9cd6ed3d5d73))
        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))",
          "v0.0.2 ## Bug Fixes

        - **pkg1:** update entry exports ([8be045d](https://github.com/mock-owner/mock-repo/commit/8be045de87e3c0d6cc25d6a865fa9aa543ac9b64))
        - **pkg2:** correct module logic ([8f013a7](https://github.com/mock-owner/mock-repo/commit/8f013a7983c41e5d461d62dec15944f707a076c8))",
          "v0.0.3 ## Bug Fixes

        - **pkg1:** change target value to 4 ([7ce1a15](https://github.com/mock-owner/mock-repo/commit/7ce1a15b75be65d9265e3b033c87062aeca09a92))
        - **pkg1:** update target value to 5 ([9eae461](https://github.com/mock-owner/mock-repo/commit/9eae46109fbc5d8a3ddee934534abb4154680d53))",
        ]
      `)
      expect(await showLastCommit(remote)).toMatchInlineSnapshot(`
        "chore: release v0.0.3, @scope/pkg1@1.1.2

        Version Updates:
        - .: 0.0.2 → 0.0.3
        - @scope/pkg1: 1.1.1 → 1.1.2

        Notable Changes:
        - fix(pkg1): change target value to 4
        - fix(pkg1): update target value to 5

        Release-Agent: ReelOut/0.0.0"
      `)
      expect(await getGitCommitSubjects(remote)).toMatchInlineSnapshot(`
        [
          "chore: add empty package.json",
          "chore: link internal packages",
          "feat(pkg1): add index file",
          "feat(pkg2): add entry script",
          "feat(pkg3): omit package name",
          "feat(pkg4): omit name and version",
          "feat(pkg5): use invalid manifest json",
          "chore: release v0.0.1, @scope/pkg1@1.1.0, @scope/pkg2@2.1.0",
          "fix(pkg1): update entry exports",
          "fix(pkg2): correct module logic",
          "chore: release v0.0.2, @scope/pkg1@1.1.1, @scope/pkg2@2.1.1",
          "fix(pkg1): change target value to 4",
          "fix(pkg1): update target value to 5",
          "chore: release v0.0.3, @scope/pkg1@1.1.2",
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
            "Status: [32mSUCCESS[39m",
          ],
          [
            "Release complete: [1m[32m2 released[39m[22m [90m(4)[39m

        [42m 0.0.3 ← 0.0.2 [49m[90m patch [39m

        [36m## [0.0.3](https://github.com/mock-owner/mock-repo/compare/v0.0.2...v0.0.3) (2026-01-01)[39m

        [36m### Bug Fixes[39m

        - **pkg1:** change target value to 4 ([7ce1a15](https://github.com/mock-owner/mock-repo/commit/7ce1a15b75be65d9265e3b033c87062aeca09a92))
        - **pkg1:** update target value to 5 ([9eae461](https://github.com/mock-owner/mock-repo/commit/9eae46109fbc5d8a3ddee934534abb4154680d53))

        [44m @scope/pkg1 [49m[42m 1.1.2 ← 1.1.1 [49m[90m patch [39m

        [36m## [1.1.2](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.1.1...%40scope%2Fpkg1%401.1.2) (2026-01-01)[39m

        [36m### Bug Fixes[39m

        - **pkg1:** change target value to 4 ([7ce1a15](https://github.com/mock-owner/mock-repo/commit/7ce1a15b75be65d9265e3b033c87062aeca09a92))
        - **pkg1:** update target value to 5 ([9eae461](https://github.com/mock-owner/mock-repo/commit/9eae46109fbc5d8a3ddee934534abb4154680d53))
        ",
          ],
        ]
      `)
    })

    // Task 8: Generate sequential, compounding fixes inside a different target block (pkg2)
    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const pkgDir2 = path.join(cwd, 'packages/pkg2')

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const pkg2 = 6;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'fix(pkg2): increment local buffer to 6',
      ])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const pkg2 = 7;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'fix(pkg2): adjust local buffer to 7',
      ])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    // Task 9: Perform final verification of the cumulative release lifecycle state
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

      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "chore: release v0.0.2, @scope/pkg1@1.1.1, @scope/pkg2@2.1.1",
          "fix(pkg1): change target value to 4",
          "fix(pkg1): update target value to 5",
          "chore: release v0.0.3, @scope/pkg1@1.1.2",
          "fix(pkg2): increment local buffer to 6",
          "fix(pkg2): adjust local buffer to 7",
          "chore: release v0.0.4, @scope/pkg1@1.1.3, @scope/pkg2@2.1.2",
        ]
      `)
      expect(await getGitTags(remote)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.1.0 ## Features

        - **pkg1:** add index file ([6eb7792](https://github.com/mock-owner/mock-repo/commit/6eb7792b3d85bafb5b0bd7f6210c9cd6ed3d5d73))
        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))",
          "@scope/pkg1@1.1.1 ## Bug Fixes

        - **pkg1:** update entry exports ([8be045d](https://github.com/mock-owner/mock-repo/commit/8be045de87e3c0d6cc25d6a865fa9aa543ac9b64))
        - **pkg2:** correct module logic ([8f013a7](https://github.com/mock-owner/mock-repo/commit/8f013a7983c41e5d461d62dec15944f707a076c8))",
          "@scope/pkg1@1.1.2 ## Bug Fixes

        - **pkg1:** change target value to 4 ([7ce1a15](https://github.com/mock-owner/mock-repo/commit/7ce1a15b75be65d9265e3b033c87062aeca09a92))
        - **pkg1:** update target value to 5 ([9eae461](https://github.com/mock-owner/mock-repo/commit/9eae46109fbc5d8a3ddee934534abb4154680d53))",
          "@scope/pkg1@1.1.3 ## Bug Fixes

        - **pkg2:** adjust local buffer to 7 ([4645196](https://github.com/mock-owner/mock-repo/commit/4645196b336419ea337bf938b4379ab89587bf72))
        - **pkg2:** increment local buffer to 6 ([15370c0](https://github.com/mock-owner/mock-repo/commit/15370c00253ac607636fa5691fbc60e59d27f694))",
          "@scope/pkg2@2.1.0 ## Features

        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))",
          "@scope/pkg2@2.1.1 ## Bug Fixes

        - **pkg2:** correct module logic ([8f013a7](https://github.com/mock-owner/mock-repo/commit/8f013a7983c41e5d461d62dec15944f707a076c8))",
          "@scope/pkg2@2.1.2 ## Bug Fixes

        - **pkg2:** adjust local buffer to 7 ([4645196](https://github.com/mock-owner/mock-repo/commit/4645196b336419ea337bf938b4379ab89587bf72))
        - **pkg2:** increment local buffer to 6 ([15370c0](https://github.com/mock-owner/mock-repo/commit/15370c00253ac607636fa5691fbc60e59d27f694))",
          "v0.0.1 ## Features

        - **pkg1:** add index file ([6eb7792](https://github.com/mock-owner/mock-repo/commit/6eb7792b3d85bafb5b0bd7f6210c9cd6ed3d5d73))
        - **pkg2:** add entry script ([cf09344](https://github.com/mock-owner/mock-repo/commit/cf09344e5a9d33ffe070d526db3e12a9405e6b35))",
          "v0.0.2 ## Bug Fixes

        - **pkg1:** update entry exports ([8be045d](https://github.com/mock-owner/mock-repo/commit/8be045de87e3c0d6cc25d6a865fa9aa543ac9b64))
        - **pkg2:** correct module logic ([8f013a7](https://github.com/mock-owner/mock-repo/commit/8f013a7983c41e5d461d62dec15944f707a076c8))",
          "v0.0.3 ## Bug Fixes

        - **pkg1:** change target value to 4 ([7ce1a15](https://github.com/mock-owner/mock-repo/commit/7ce1a15b75be65d9265e3b033c87062aeca09a92))
        - **pkg1:** update target value to 5 ([9eae461](https://github.com/mock-owner/mock-repo/commit/9eae46109fbc5d8a3ddee934534abb4154680d53))",
          "v0.0.4 ## Bug Fixes

        - **pkg2:** adjust local buffer to 7 ([4645196](https://github.com/mock-owner/mock-repo/commit/4645196b336419ea337bf938b4379ab89587bf72))
        - **pkg2:** increment local buffer to 6 ([15370c0](https://github.com/mock-owner/mock-repo/commit/15370c00253ac607636fa5691fbc60e59d27f694))",
        ]
      `)
      expect(await showLastCommit(remote)).toMatchInlineSnapshot(`
        "chore: release v0.0.4, @scope/pkg1@1.1.3, @scope/pkg2@2.1.2

        Version Updates:
        - .: 0.0.3 → 0.0.4
        - @scope/pkg1: 1.1.2 → 1.1.3
        - @scope/pkg2: 2.1.1 → 2.1.2

        Notable Changes:
        - fix(pkg2): increment local buffer to 6
        - fix(pkg2): adjust local buffer to 7

        Release-Agent: ReelOut/0.0.0"
      `)
      expect(await getGitCommitSubjects(remote)).toMatchInlineSnapshot(`
        [
          "chore: add empty package.json",
          "chore: link internal packages",
          "feat(pkg1): add index file",
          "feat(pkg2): add entry script",
          "feat(pkg3): omit package name",
          "feat(pkg4): omit name and version",
          "feat(pkg5): use invalid manifest json",
          "chore: release v0.0.1, @scope/pkg1@1.1.0, @scope/pkg2@2.1.0",
          "fix(pkg1): update entry exports",
          "fix(pkg2): correct module logic",
          "chore: release v0.0.2, @scope/pkg1@1.1.1, @scope/pkg2@2.1.1",
          "fix(pkg1): change target value to 4",
          "fix(pkg1): update target value to 5",
          "chore: release v0.0.3, @scope/pkg1@1.1.2",
          "fix(pkg2): increment local buffer to 6",
          "fix(pkg2): adjust local buffer to 7",
          "chore: release v0.0.4, @scope/pkg1@1.1.3, @scope/pkg2@2.1.2",
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
            "Status: [32mSUCCESS[39m",
          ],
          [
            "Release complete: [1m[32m3 released[39m[22m [90m(4)[39m

        [42m 0.0.4 ← 0.0.3 [49m[90m patch [39m

        [36m## [0.0.4](https://github.com/mock-owner/mock-repo/compare/v0.0.3...v0.0.4) (2026-01-01)[39m

        [36m### Bug Fixes[39m

        - **pkg2:** adjust local buffer to 7 ([4645196](https://github.com/mock-owner/mock-repo/commit/4645196b336419ea337bf938b4379ab89587bf72))
        - **pkg2:** increment local buffer to 6 ([15370c0](https://github.com/mock-owner/mock-repo/commit/15370c00253ac607636fa5691fbc60e59d27f694))

        [44m @scope/pkg1 [49m[42m 1.1.3 ← 1.1.2 [49m[90m patch [39m

        [36m## [1.1.3](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg1%401.1.2...%40scope%2Fpkg1%401.1.3) (2026-01-01)[39m

        [36m### Bug Fixes[39m

        - **pkg2:** adjust local buffer to 7 ([4645196](https://github.com/mock-owner/mock-repo/commit/4645196b336419ea337bf938b4379ab89587bf72))
        - **pkg2:** increment local buffer to 6 ([15370c0](https://github.com/mock-owner/mock-repo/commit/15370c00253ac607636fa5691fbc60e59d27f694))

        [44m @scope/pkg2 [49m[42m 2.1.2 ← 2.1.1 [49m[90m patch [39m

        [36m## [2.1.2](https://github.com/mock-owner/mock-repo/compare/%40scope%2Fpkg2%402.1.1...%40scope%2Fpkg2%402.1.2) (2026-01-01)[39m

        [36m### Bug Fixes[39m

        - **pkg2:** adjust local buffer to 7 ([4645196](https://github.com/mock-owner/mock-repo/commit/4645196b336419ea337bf938b4379ab89587bf72))
        - **pkg2:** increment local buffer to 6 ([15370c0](https://github.com/mock-owner/mock-repo/commit/15370c00253ac607636fa5691fbc60e59d27f694))
        ",
          ],
        ]
      `)
    })
  })
}, 60_000)
