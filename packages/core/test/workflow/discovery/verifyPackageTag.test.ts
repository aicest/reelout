// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, pushGitChanges, verifyPackageTag } from '@reelout/core'
import { buildPackage, writePackageJson } from '@reelout/npm'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { beforeEach, expect, test } from 'vitest'
import { workspace } from '../../../../../test/mock/context'
import {
  cloneGitRepository,
  initializeGitRepository,
} from '../../../../../test/mock/git'

beforeEach(() => {
  workspace.entry = '.'
  workspace.members = ['packages/*']
})

test('returns true when tag exists and is connected to repository history', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { name: 'root-pkg', version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: release v1.0.0'])
    await execGit(cwd, ['tag', 'v1.0.0'])

    await writePackageJson(cwd, { name: 'root-pkg', version: '2.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: release v2.0.0'])
    await execGit(cwd, ['tag', 'v2.0.0'])

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await verifyPackageTag(cwd, pkg, 'v1.0.0')).toBe(true)
    expect(await verifyPackageTag(cwd, pkg, 'v2.0.0')).toBe(true)
  })
})

test('returns false when tag does not exist in repository', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { name: 'root-pkg', version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: add v1 base'])

    await writePackageJson(cwd, { name: 'root-pkg', version: '2.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: add v2 base'])

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await verifyPackageTag(cwd, pkg, 'v1.0.0')).toBe(false)
    expect(await verifyPackageTag(cwd, pkg, 'v2.0.0')).toBe(false)
  })
})

test('returns false when tag targets a different package', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    const pkgDir1 = path.join(cwd, 'packages/pkg1')
    const pkgDir2 = path.join(cwd, 'packages/pkg2')

    await writePackageJson(pkgDir1, { name: 'pkg1', version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore(pkg1): release v1'])
    await execGit(cwd, ['tag', 'pkg1@1.0.0'])

    await writePackageJson(pkgDir2, { name: 'pkg2', version: '2.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore(pkg2): release v2'])
    await execGit(cwd, ['tag', 'pkg2@2.0.0'])

    const pkg1 = await buildPackage(cwd, 'packages/pkg1', workspace)
    const pkg2 = await buildPackage(cwd, 'packages/pkg2', workspace)

    expect(await verifyPackageTag(cwd, pkg1, 'pkg1@1.0.0')).toBe(true)
    expect(await verifyPackageTag(cwd, pkg2, 'pkg1@1.0.0')).toBe(false)
    expect(await verifyPackageTag(cwd, pkg1, 'pkg2@2.0.0')).toBe(false)
    expect(await verifyPackageTag(cwd, pkg2, 'pkg2@2.0.0')).toBe(true)
  })
})

test('returns false when tag is disconnected from current repository history', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await writePackageJson(cwd, { name: 'app', version: '1.1.0-dev.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: development initialization'])
      await execGit(cwd, ['tag', 'v1.1.0-dev.0'])

      await execGit(cwd, ['checkout', '-b', 'feature/isolated-release'])
      await writePackageJson(cwd, { name: 'app', version: '1.1.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: isolated feature release'])
      await execGit(cwd, ['tag', 'v1.1.0'])

      await execGit(cwd, ['checkout', 'main'])
      await writePackageJson(cwd, { name: 'app', version: '1.2.0-dev.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: jump to minor iteration'])
      await execGit(cwd, ['tag', 'v1.2.0-dev.0'])

      await pushGitChanges(cwd, 'main', '--tags')
      await pushGitChanges(cwd, 'feature/isolated-release', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const pkg = await buildPackage(cwd, '.', workspace)

      expect(await verifyPackageTag(cwd, pkg, 'v1.1.0')).toBe(false)
      expect(await verifyPackageTag(cwd, pkg, 'v1.2.0-dev.0')).toBe(true)
    })
  })
})
