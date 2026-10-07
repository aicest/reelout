// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  execGit,
  prependChangelog,
  resolvePackageStableTag,
  type Package,
} from '@reelout/core'
import { buildPackage, writePackageJson } from '@reelout/npm'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { workspace } from '../../../../../test/mock/context'
import { initializeGitRepository } from '../../../../../test/mock/git'

async function commitAndTag(
  cwd: string,
  version: string,
  options: { release?: boolean; changelogFile?: string } = {}
): Promise<void> {
  const { release = true, changelogFile = 'CHANGELOG.md' } = options

  const changelogPath = path.join(cwd, changelogFile)

  await writePackageJson(cwd, { version })

  if (release) {
    await prependChangelog(changelogPath, `## ${version}\n- Release ${version}`)
  }

  await execGit(cwd, ['add', '.'])

  await execGit(cwd, [
    'commit',
    '-m',
    release ? `chore: release ${version}` : `chore: bump version to ${version}`,
  ])

  if (release) {
    await execGit(cwd, ['tag', `v${version}`, '-a', '-m', `Release ${version}`])
  }
}

test('returns top tag when the latest changelog entry is a stable release', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await commitAndTag(cwd, '1.4.0')
    await commitAndTag(cwd, '1.5.0')
    await commitAndTag(cwd, '1.6.0-dev.1')
    await commitAndTag(cwd, '1.6.0-dev.2')
    await commitAndTag(cwd, '1.6.0-dev.3')
    await commitAndTag(cwd, '1.6.0')

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await resolvePackageStableTag(cwd, pkg)).toEqual({
      name: 'v1.6.0',
      message: 'Release 1.6.0',
    })
  })
})

test('skips leading prerelease versions to find the most recent stable tag', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await commitAndTag(cwd, '1.4.0')
    await commitAndTag(cwd, '1.5.0')
    await commitAndTag(cwd, '1.6.0-dev.1')
    await commitAndTag(cwd, '1.6.0-dev.2')
    await commitAndTag(cwd, '1.6.0-dev.3')

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await resolvePackageStableTag(cwd, pkg)).toEqual({
      name: 'v1.5.0',
      message: 'Release 1.5.0',
    })
  })
})

test('skips patch-level prereleases to find the most recent stable tag', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await commitAndTag(cwd, '0.4.0')
    await commitAndTag(cwd, '0.5.0')
    await commitAndTag(cwd, '0.6.0')
    await commitAndTag(cwd, '0.7.0-dev.1')
    await commitAndTag(cwd, '0.7.0-dev.2')

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await resolvePackageStableTag(cwd, pkg)).toEqual({
      name: 'v0.6.0',
      message: 'Release 0.6.0',
    })
  })
})

test('skips prereleases across major or minor boundaries to find the most recent stable tag', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await commitAndTag(cwd, '0.5.0')
    await commitAndTag(cwd, '0.6.0')
    await commitAndTag(cwd, '0.7.0')
    await commitAndTag(cwd, '1.0.0-dev.1')
    await commitAndTag(cwd, '1.0.0-dev.2')
    await commitAndTag(cwd, '1.0.0-dev.3')

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await resolvePackageStableTag(cwd, pkg)).toEqual({
      name: 'v0.7.0',
      message: 'Release 0.7.0',
    })
  })
})

test('ignores commits and version bumps not documented in the changelog', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await commitAndTag(cwd, '1.4.0')
    await commitAndTag(cwd, '1.5.0')
    await commitAndTag(cwd, '1.6.0-dev.1')
    await commitAndTag(cwd, '1.6.0-dev.2')
    await commitAndTag(cwd, '1.6.0-dev.3')
    await commitAndTag(cwd, '1.6.0')
    await commitAndTag(cwd, '1.7.0-0', { release: false })

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await resolvePackageStableTag(cwd, pkg)).toEqual({
      name: 'v1.6.0',
      message: 'Release 1.6.0',
    })
  })
})

test('resolves tag using custom changelog path specified in package config', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await commitAndTag(cwd, '1.0.0', { changelogFile: 'HISTORY.md' })

    const pkg: Package = {
      ...(await buildPackage(cwd, '.', workspace)),
      changelogFile: 'HISTORY.md',
    }

    expect(await resolvePackageStableTag(cwd, pkg)).toEqual({
      name: 'v1.0.0',
      message: 'Release 1.0.0',
    })
  })
})

test('returns null when changelog file does not exist', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Initial commit'])

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await resolvePackageStableTag(cwd, pkg)).toBeNull()
  })
})

test('returns null when changelog file contains no content', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await writeFile(path.join(cwd, 'CHANGELOG.md'), '')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Initial commit'])

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await resolvePackageStableTag(cwd, pkg)).toBeNull()
  })
})

test('returns null when changelog contains only prerelease versions', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await commitAndTag(cwd, '1.0.0-dev.1')
    await commitAndTag(cwd, '1.0.0-dev.2')
    await commitAndTag(cwd, '1.0.0-dev.3')

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await resolvePackageStableTag(cwd, pkg)).toBeNull()
  })
})

test('returns null for 0.x.x stable releases when preceding version lacks a prerelease tag', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await commitAndTag(cwd, '0.5.0')
    await commitAndTag(cwd, '0.6.0')
    await commitAndTag(cwd, '0.7.0')

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await resolvePackageStableTag(cwd, pkg)).toBeNull()
  })
})

test('throws an error when changelog versions are out of descending semver order', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await commitAndTag(cwd, '1.0.0-beta.0')
    await commitAndTag(cwd, '1.0.0-alpha.0')

    const pkg = await buildPackage(cwd, '.', workspace)

    await expect(
      resolvePackageStableTag(cwd, pkg)
    ).rejects.toMatchInlineSnapshot(
      `[Error: Version "1.0.0-beta.0" must be strictly lower than preceding version "1.0.0-alpha.0".]`
    )
  })
})

test('throws an error when the resolved stable tag does not exist in Git', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await writeFile(path.join(cwd, 'CHANGELOG.md'), '## 1.0.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Add un-tagged release'])

    const pkg = await buildPackage(cwd, '.', workspace)

    await expect(
      resolvePackageStableTag(cwd, pkg)
    ).rejects.toMatchInlineSnapshot(
      `[Error: Git tag "v1.0.0" is not associated with package "" in directory ".".]`
    )
  })
})

test('includes package name in error message when Git tag verification fails', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { name: 'foo', version: '1.0.0' })
    await writeFile(path.join(cwd, 'CHANGELOG.md'), '## 1.0.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Add un-tagged release'])

    const pkg = await buildPackage(cwd, '.', workspace)

    await expect(
      resolvePackageStableTag(cwd, pkg)
    ).rejects.toMatchInlineSnapshot(
      `[Error: Git tag "v1.0.0" is not associated with package "foo" in directory ".".]`
    )
  })
})
