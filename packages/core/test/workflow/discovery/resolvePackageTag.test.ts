// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, pushGitChanges, resolvePackageTag } from '@reelout/core'
import { buildPackage, updatePackageJson, writePackageJson } from '@reelout/npm'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { beforeEach, expect, test, vi } from 'vitest'
import { workspace } from '../../../../../test/mock/context'
import {
  cloneGitRepository,
  initializeGitRepository,
} from '../../../../../test/mock/git'

beforeEach(() => {
  vi.resetAllMocks()
  workspace.entry = '.'
  workspace.members = ['packages/*']
})

test('prefers explicit tag over generated', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: release v1'])
    await execGit(cwd, ['tag', 'v1.0.0'])

    const pkg = await buildPackage(cwd, '.', workspace)
    const tag = { name: 'v1' }

    expect(await resolvePackageTag(cwd, { ...pkg, tag })).toEqual({
      name: 'v1',
    })

    expect(await resolvePackageTag(cwd, { ...pkg, tag: null })).toEqual({
      name: 'v1.0.0',
    })
  })
})

test('returns null when package name or version is missing', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    const pkgDir1 = path.join(cwd, 'packages/pkg1')
    const pkgDir2 = path.join(cwd, 'packages/pkg2')
    const pkgDir3 = path.join(cwd, 'packages/pkg3')

    await writePackageJson(cwd, { name: undefined, version: '1.0.0' })
    await writePackageJson(pkgDir1, { name: undefined, version: '1.0.0' })
    await writePackageJson(pkgDir2, { name: 'pkg2', version: '1.0.0' })
    await writePackageJson(pkgDir3, { name: 'pkg3', version: undefined })

    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: release v1'])
    await execGit(cwd, ['tag', 'v1.0.0'])
    await execGit(cwd, ['tag', 'pkg1@1.0.0', '-a', '-m', 'pkg1 v1'])
    await execGit(cwd, ['tag', 'pkg2@1.0.0', '-a', '-m', 'pkg2 v1'])
    await execGit(cwd, ['tag', 'pkg3@1.0.0', '-a', '-m', 'pkg3 v1'])

    const pkg0 = await buildPackage(cwd, '.', workspace)
    const pkg1 = await buildPackage(cwd, 'packages/pkg1', workspace)
    const pkg2 = await buildPackage(cwd, 'packages/pkg2', workspace)

    await expect(
      buildPackage(cwd, 'packages/pkg3', workspace)
    ).rejects.toMatchInlineSnapshot(
      `[Error: Package version "undefined" in "packages/pkg3" is not a valid semantic version.]`
    )

    expect(
      await Promise.all([
        resolvePackageTag(cwd, pkg0),
        resolvePackageTag(cwd, pkg1),
        resolvePackageTag(cwd, pkg2),
      ])
    ).toMatchInlineSnapshot(`
      [
        {
          "message": undefined,
          "name": "v1.0.0",
        },
        null,
        {
          "message": "pkg2 v1",
          "name": "pkg2@1.0.0",
        },
      ]
    `)
  })
})

test('returns null when no tag exists', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.6.0-rc.1' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: release v1.6.0-rc.1'])
    await execGit(cwd, ['tag', 'v1.6.0-rc.1'])

    let pkg = await buildPackage(cwd, '.', workspace)

    expect(await resolvePackageTag(cwd, pkg)).toEqual({ name: 'v1.6.0-rc.1' })

    await updatePackageJson(cwd, { version: '1.7.0-0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: bump version to 1.7.0-0'])

    pkg = await buildPackage(cwd, '.', workspace)

    expect(await resolvePackageTag(cwd, pkg)).toBe(null)
  })
})

test('returns null when tag is unrelated to package', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    const pkgDir1 = path.join(cwd, 'packages/pkg1')
    const pkgDir2 = path.join(cwd, 'packages/pkg2')

    await writePackageJson(pkgDir1, { name: 'pkg1', version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore(pkg1): release v1'])
    await execGit(cwd, ['tag', 'pkg2@1.0.0', '-a', '-m', 'v1'])

    await writePackageJson(pkgDir2, { name: 'pkg2', version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore(pkg2): release v1'])
    await execGit(cwd, ['tag', 'pkg1@1.0.0', '-a', '-m', 'v1'])

    const pkg1 = await buildPackage(cwd, 'packages/pkg1', workspace)
    const pkg2 = await buildPackage(cwd, 'packages/pkg2', workspace)

    expect(await resolvePackageTag(cwd, pkg1)).toBe(null)
    expect(await resolvePackageTag(cwd, pkg2)).toBe(null)
  })
})

test('resolves release tag after sequential pushes', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await writePackageJson(cwd, { version: '1.1.0-dev.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'chore(ci): add workflow matrix seed — wf-9c3d',
      ])

      await writeFile(path.join(cwd, 'index.js'), 'export const count = 1')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'feat(staging): add early staging assets — stage-1f2a',
      ])

      await updatePackageJson(cwd, { version: '1.1.0-dev.1' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'chore(release): prepare pre-release manifest — pre-3b8e',
      ])
      await execGit(cwd, ['tag', 'v1.1.0-dev.1'])

      await writeFile(path.join(cwd, 'index.js'), 'export const count = 2')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'feat: update workspace mappings — map-6d4b',
      ])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const pkg = await buildPackage(cwd, '.', workspace)

      expect(await resolvePackageTag(cwd, pkg)).toMatchInlineSnapshot(`
        {
          "message": undefined,
          "name": "v1.1.0-dev.1",
        }
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await writeFile(path.join(cwd, 'index.js'), 'export const count = 3')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'feat: consolidate configuration parameters — cfg-2a7f',
      ])

      await updatePackageJson(cwd, { version: '1.1.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'chore(release): promote stable production track — promote-8e1c',
      ])
      await execGit(cwd, ['tag', 'v1.1.0', '-a', '-m', 'Release stable v1.1.0'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const pkg = await buildPackage(cwd, '.', workspace)

      expect(await resolvePackageTag(cwd, pkg)).toMatchInlineSnapshot(`
        {
          "message": "Release stable v1.1.0",
          "name": "v1.1.0",
        }
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await updatePackageJson(cwd, { version: '1.2.0-dev.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'chore(release): start next minor cycle — next-4c2d',
      ])

      await writeFile(path.join(cwd, 'index.js'), 'export const count = 4')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'feat: integrate secondary layout components — layout-0b9a',
      ])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const pkg = await buildPackage(cwd, '.', workspace)

      expect(await resolvePackageTag(cwd, pkg)).toBe(null)
    })
  })
})

test('aborts tag discovery when no latest package present', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await writePackageJson(cwd, { version: '1.1.0-dev.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'chore: scaffold project architecture — arch-5f0b',
      ])

      await writeFile(path.join(cwd, 'index.js'), 'export const count = 1')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'feat: add structural validation — validate-3c6e',
      ])

      await updatePackageJson(cwd, { version: '1.1.0-dev.1' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'chore(release): finalize pre-release pipeline — pipeline-7d2a',
      ])
      await execGit(cwd, ['tag', 'v1.1.0-dev.1'])

      await execGit(cwd, ['checkout', '-b', 'release/v1.1.x'])

      await updatePackageJson(cwd, { version: '1.1.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'chore(release): promote branch to GA — promote-1e4f',
      ])
      await execGit(cwd, ['tag', 'v1.1.0', '-a', '-m', 'Release stable v1.1.0'])

      await execGit(cwd, ['checkout', 'main'])

      await writePackageJson(cwd, { version: '1.2.0-dev.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'chore(deps): bump dev deps for next patch — deps-6b8c',
      ])

      await writeFile(path.join(cwd, 'index.js'), 'export const count = 2')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'feat: expand telemetry metrics — telemetry-2f1d',
      ])

      await pushGitChanges(cwd, 'main', '--tags')
      await pushGitChanges(cwd, 'release/v1.1.x', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const pkg = await buildPackage(cwd, '.', workspace)

      expect(await resolvePackageTag(cwd, pkg)).toBe(null)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'release/v1.1.x')

      const pkg = await buildPackage(cwd, '.', workspace)

      expect(await resolvePackageTag(cwd, pkg)).toMatchInlineSnapshot(`
        {
          "message": "Release stable v1.1.0",
          "name": "v1.1.0",
        }
      `)
    })
  })
})

test('returns null when tag is unreachable', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await writePackageJson(cwd, { version: '1.1.0-dev.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'chore(env): add core environment variables — env-9a0c',
      ])

      await writeFile(path.join(cwd, 'index.js'), 'export const count = 1')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'feat: add runtime logging prototype — logging-4d7b',
      ])

      await updatePackageJson(cwd, { version: '1.1.0-dev.1' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'chore(release): prepare staging snapshot — staging-3c9f',
      ])
      await execGit(cwd, ['tag', 'v1.1.0-dev.1'])

      await execGit(cwd, ['checkout', '-b', 'release/v1.1.x'])

      await updatePackageJson(cwd, { version: '1.1.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'chore(build): compile stable environment — build-2b5e',
      ])
      await execGit(cwd, ['tag', 'v1.1.0', '-a', '-m', 'Release stable v1.1.0'])

      await execGit(cwd, ['checkout', 'main'])

      await execGit(cwd, ['cherry-pick', 'release/v1.1.x'])

      await writeFile(path.join(cwd, 'index.js'), 'export const count = 2')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'feat: add multi-tenant routing — routing-7e6a',
      ])

      await pushGitChanges(cwd, 'main', '--tags')
      await pushGitChanges(cwd, 'release/v1.1.x', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const pkg = await buildPackage(cwd, '.', workspace)

      expect(await resolvePackageTag(cwd, pkg)).toBe(null)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'release/v1.1.x')

      const pkg = await buildPackage(cwd, '.', workspace)

      expect(await resolvePackageTag(cwd, pkg)).toMatchInlineSnapshot(`
        {
          "message": "Release stable v1.1.0",
          "name": "v1.1.0",
        }
      `)
    })
  })
})
