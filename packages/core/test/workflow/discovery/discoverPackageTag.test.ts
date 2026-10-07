// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  discoverPackageTag,
  execGit,
  prependChangelog,
  pushGitChanges,
} from '@reelout/core'
import { buildPackage, updatePackageJson, writePackageJson } from '@reelout/npm'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { beforeEach, expect, test } from 'vitest'
import { workspace } from '../../../../../test/mock/context'
import {
  cloneGitRepository,
  initializeGitRepository,
} from '../../../../../test/mock/git'

async function writeChangelog(dir: string, version: string, changes?: string) {
  await prependChangelog(
    path.join(dir, 'CHANGELOG.md'),
    [`## ${version}`, changes || 'Add some changes'].join('\n')
  )
}

beforeEach(() => {
  workspace.entry = '.'
  workspace.members = ['packages/*']
})

test('prefers explicit tag over generated', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await writeChangelog(cwd, '1.0.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: release v1'])
    await execGit(cwd, ['tag', 'v1.0.0'])

    const pkg = await buildPackage(cwd, '.', workspace)
    const tag = { name: 'v1' }

    expect(await discoverPackageTag(cwd, { ...pkg, tag })).toEqual({
      name: 'v1',
    })

    expect(await discoverPackageTag(cwd, { ...pkg, tag: null })).toEqual({
      name: 'v1.0.0',
    })
  })
})

test('returns null when changelog file is missing', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'chore(release): add initial release configuration — seed-7f3a',
    ])
    await execGit(cwd, ['tag', 'v1.0.0'])

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await discoverPackageTag(cwd, pkg)).toBe(null)
  })
})

test('returns null when changelog version is malformed', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await writeChangelog(cwd, 'invalid')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'chore(changelog): add malformed changelog entry — malformed-2d9b',
    ])
    await execGit(cwd, ['tag', 'v1.0.0'])

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await discoverPackageTag(cwd, pkg)).toBe(null)
  })
})

test('returns null when tag cannot be generated for package', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    const pkgDir1 = path.join(cwd, 'packages/pkg1')
    const pkgDir2 = path.join(cwd, 'packages/pkg2')

    await writePackageJson(pkgDir1, { name: 'pkg1', version: '1.0.0' })
    await writeChangelog(pkgDir1, '1.0.0')
    await writePackageJson(pkgDir2, { name: undefined, version: '1.0.0' })
    await writeChangelog(pkgDir2, '1.0.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'chore(monorepo): configure package layout — layout-8c1e',
    ])
    await execGit(cwd, ['tag', 'pkg1@1.0.0'])
    await execGit(cwd, ['tag', 'pkg2@1.0.0'])

    const pkg1 = await buildPackage(cwd, 'packages/pkg1', workspace)
    const pkg2 = await buildPackage(cwd, 'packages/pkg2', workspace)

    expect(await discoverPackageTag(cwd, pkg1)).toEqual({ name: 'pkg1@1.0.0' })
    expect(await discoverPackageTag(cwd, pkg2)).toBe(null)
  })
})

test('returns null when expected release tag is absent from history', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await writeChangelog(cwd, '1.0.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'chore(release): register changelog entry — reg-4b6d',
    ])

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await discoverPackageTag(cwd, pkg)).toBe(null)
  })
})

test('returns null when historical changelog file at tag commit is empty', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writeFile(path.join(cwd, 'CHANGELOG.md'), '')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'chore(changelog): create empty changelog snapshot — changelog-empty-0a2f',
    ])

    await writePackageJson(cwd, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'chore(release): record package version — pkgver-1b7c',
    ])
    await execGit(cwd, ['tag', 'v1.0.0'])

    await writeChangelog(cwd, '1.0.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'docs(changelog): append release entry after tag — changelog-append-5e7c',
    ])

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await discoverPackageTag(cwd, pkg)).toBe(null)
  })
})

test('returns null when historical changelog file at tag commit contains an older version', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writeChangelog(cwd, '0.0.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'docs(changelog): add initial entry — changelog-rc-0a2f',
    ])

    await writePackageJson(cwd, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'chore(release): record package version — pkgver-9d2f',
    ])
    await execGit(cwd, ['tag', 'v1.0.0'])

    await writeChangelog(cwd, '1.0.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'docs(changelog): append release entry after tag — changelog-append-5e7c',
    ])

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await discoverPackageTag(cwd, pkg)).toBe(null)
  })
})

test('resolves changelog tag after tags are pushed sequentially', async () => {
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
      await writeChangelog(cwd, '1.1.0-dev.1')
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

      expect(await discoverPackageTag(cwd, pkg)).toMatchInlineSnapshot(`
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
      await writeChangelog(cwd, '1.1.0')
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

      expect(await discoverPackageTag(cwd, pkg)).toEqual({
        name: 'v1.1.0',
        message: 'Release stable v1.1.0',
      })
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

      expect(await discoverPackageTag(cwd, pkg)).toMatchInlineSnapshot(`
        {
          "message": "Release stable v1.1.0",
          "name": "v1.1.0",
        }
      `)
    })
  })
})

test('prefers changelog version when package and branch versions diverge', async () => {
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
      await writeChangelog(cwd, '1.1.0-dev.1')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'chore(release): finalize pre-release pipeline — pipeline-7d2a',
      ])
      await execGit(cwd, ['tag', 'v1.1.0-dev.1'])

      await execGit(cwd, ['checkout', '-b', 'release/v1.1.x'])

      await updatePackageJson(cwd, { version: '1.1.0' })
      await writeChangelog(cwd, '1.1.0')
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

      expect(await discoverPackageTag(cwd, pkg)).toMatchInlineSnapshot(`
        {
          "message": undefined,
          "name": "v1.1.0-dev.1",
        }
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'release/v1.1.x')

      const pkg = await buildPackage(cwd, '.', workspace)

      expect(await discoverPackageTag(cwd, pkg)).toMatchInlineSnapshot(`
        {
          "message": "Release stable v1.1.0",
          "name": "v1.1.0",
        }
      `)
    })
  })
})

test('returns null when matching tag is unreachable from the current branch', async () => {
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
      await writeChangelog(cwd, '1.1.0-dev.1')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'chore(release): prepare staging snapshot — staging-3c9f',
      ])
      await execGit(cwd, ['tag', 'v1.1.0-dev.1'])

      await execGit(cwd, ['checkout', '-b', 'release/v1.1.x'])

      await updatePackageJson(cwd, { version: '1.1.0' })
      await writeChangelog(cwd, '1.1.0')
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

      expect(await discoverPackageTag(cwd, pkg)).toBe(null)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'release/v1.1.x')

      const pkg = await buildPackage(cwd, '.', workspace)

      expect(await discoverPackageTag(cwd, pkg)).toMatchInlineSnapshot(`
        {
          "message": "Release stable v1.1.0",
          "name": "v1.1.0",
        }
      `)
    })
  })
})
