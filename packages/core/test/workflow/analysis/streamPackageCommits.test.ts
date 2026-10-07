// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  execGit,
  streamPackageCommits,
  type Package,
  type ShowGitHistoryOptions,
} from '@reelout/core'
import { buildPackage, writePackageJson } from '@reelout/npm'
import { fromAsync } from 'from-async'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { beforeEach, expect, test } from 'vitest'
import { workspace } from '../../../../../test/mock/context'
import { initializeGitRepository } from '../../../../../test/mock/git'

async function showCommits(
  cwd: string,
  plan: Package,
  options?: ShowGitHistoryOptions
) {
  return (await fromAsync(streamPackageCommits(cwd, plan, options)))
    .toReversed()
    .map((commit) => commit.header)
}

beforeEach(() => {
  workspace.entry = '.'
  workspace.members = ['*']
})

test('yields all commits when targeting the root directory', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: initial package.json setup'])

    await writeFile(path.join(cwd, 'index.js'), 'export const main = () => {};')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat: add index file'])

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await showCommits(cwd, pkg)).toMatchInlineSnapshot(`
      [
        "chore: initial package.json setup",
        "feat: add index file",
      ]
    `)
  })
})

test('isolates commits belonging to specific subpackages', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    const pkgDir1 = path.join(cwd, 'pkg1')
    const pkgDir2 = path.join(cwd, 'pkg2')

    await writePackageJson(pkgDir1, { name: 'pkg1', version: '1.0.0' })
    await writePackageJson(pkgDir2, { name: 'pkg2', version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: initialize packages'])

    await writeFile(path.join(pkgDir1, 'index.js'), 'console.log("pkg1");')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat(pkg1): add index module'])

    await writeFile(path.join(pkgDir2, 'index.js'), 'console.log("pkg2");')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat(pkg2): add index module'])

    const pkg1 = await buildPackage(cwd, 'pkg1', workspace)
    const pkg2 = await buildPackage(cwd, 'pkg2', workspace)

    expect(await showCommits(cwd, pkg1)).toMatchInlineSnapshot(`
      [
        "chore: initialize packages",
        "feat(pkg1): add index module",
      ]
    `)
    expect(await showCommits(cwd, pkg2)).toMatchInlineSnapshot(`
      [
        "chore: initialize packages",
        "feat(pkg2): add index module",
      ]
    `)
  })
})

test('filters commits matching package file glob patterns', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: initial package setup'])

    await writeFile(path.join(cwd, 'index.js'), 'export const a = 1;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat: create index entrypoint'])

    await writeFile(path.join(cwd, 'index.js'), 'export const a = 2;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'refactor: update index entrypoint'])

    const pkg = { location: '.', files: '!package.json' } as Package

    expect(await showCommits(cwd, pkg)).toMatchInlineSnapshot(`
      [
        "feat: create index entrypoint",
        "refactor: update index entrypoint",
      ]
    `)
  })
})

test('filters commits by custom file path', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: add package.json'])

    await writeFile(path.join(cwd, 'index.js'), 'const a = 1;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat: create index.js'])

    await writeFile(path.join(cwd, 'index.js'), 'const a = 2;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'refactor: update index.js'])

    const pkg = await buildPackage(cwd, '.', workspace)

    expect(await showCommits(cwd, pkg, { filePath: 'index.js' }))
      .toMatchInlineSnapshot(`
      [
        "feat: create index.js",
        "refactor: update index.js",
      ]
    `)
  })
})

test('stops yielding commits at specified revision tag', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    const pkgDir1 = path.join(cwd, 'pkg1')
    const pkgDir2 = path.join(cwd, 'pkg2')

    await writePackageJson(pkgDir1, { name: 'pkg1', version: '1.0.0' })
    await writePackageJson(pkgDir2, { name: 'pkg2', version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: initialize packages'])

    await writeFile(path.join(pkgDir1, 'index.js'), 'export const v1 = 1;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat(pkg1): release v1.0.0'])
    await execGit(cwd, ['tag', 'pkg1@1.0.0'])

    await writeFile(path.join(pkgDir2, 'index.js'), 'export const v2 = 1;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat(pkg2): release v1.0.0'])
    await execGit(cwd, ['tag', 'pkg2@1.0.0'])

    await writeFile(path.join(pkgDir1, 'index.js'), 'export const v1 = 2;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'fix(pkg1): patch v1.0.1 update'])

    await writeFile(path.join(pkgDir2, 'index.js'), 'export const v2 = 2;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'fix(pkg2): patch v1.0.1 update'])

    const pkg1 = await buildPackage(cwd, 'pkg1', workspace)
    const pkg2 = await buildPackage(cwd, 'pkg2', workspace)

    expect(await showCommits(cwd, pkg1, { until: 'pkg1@1.0.0' }))
      .toMatchInlineSnapshot(`
      [
        "fix(pkg1): patch v1.0.1 update",
      ]
    `)
    expect(await showCommits(cwd, pkg2, { until: 'pkg2@1.0.0' }))
      .toMatchInlineSnapshot(`
      [
        "fix(pkg2): patch v1.0.1 update",
      ]
    `)
    expect(await showCommits(cwd, pkg1)).toMatchInlineSnapshot(`
      [
        "chore: initialize packages",
        "feat(pkg1): release v1.0.0",
        "fix(pkg1): patch v1.0.1 update",
      ]
    `)
    expect(await showCommits(cwd, pkg2)).toMatchInlineSnapshot(`
      [
        "chore: initialize packages",
        "feat(pkg2): release v1.0.0",
        "fix(pkg2): patch v1.0.1 update",
      ]
    `)
  })
})

test('returns an empty array when package directory does not exist', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: initial commit'])

    const pkg = { location: 'non-existent-pkg', files: '**/*' } as Package

    expect(await showCommits(cwd, pkg)).toEqual([])
  })
})
