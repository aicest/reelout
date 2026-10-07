// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { countGitHistory, execGit, pushGitChanges } from '@reelout/core'
import { updatePackageJson, writePackageJson } from '@reelout/npm'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import {
  cloneGitRepository,
  getGitCommitHashes,
  getGitCommitSubjects,
  getGitTags,
  initializeGitRepository,
} from '../../../../../test/mock/git'

test('counts commits on mainline history using first-parent lineage', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, [
        'commit',
        '--allow-empty',
        '--allow-empty-message',
        '-m',
        '',
      ])

      const pkgDir1 = path.join(cwd, 'packages/pkg1')
      const pkgDir2 = path.join(cwd, 'packages/pkg2')

      await mkdir(pkgDir1, { recursive: true })
      await mkdir(pkgDir2, { recursive: true })

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

      await writePackageJson(cwd, { version: '0.0.0' })
      await writePackageJson(pkgDir1, { version: '0.0.0' })
      await writePackageJson(pkgDir2, { version: '0.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: set up project'])
      await execGit(cwd, ['tag', 'v0.0.0'])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const a = 1;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg1): add index.js'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 2;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg2): add index.js'])

      await updatePackageJson(cwd, { version: '0.1.0' })
      await updatePackageJson(pkgDir1, { version: '0.1.0' })
      await updatePackageJson(pkgDir2, { version: '0.1.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: release v0.1.0'])
      await execGit(cwd, ['tag', 'v0.1.0'])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const a = 3;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'fix(pkg1): update a to 3\n\nBREAKING CHANGE: a is now 3',
      ])

      await updatePackageJson(pkgDir1, { version: '0.2.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg1): release v0.2.0'])
      await execGit(cwd, ['tag', 'pkg1@0.2.0'])

      await writeFile(path.join(cwd, 'README.md'), '# README')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'docs: add README file'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 4;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'fix(pkg2): update b to 4'])

      await updatePackageJson(pkgDir2, { version: '0.2.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg2): release v0.2.0'])
      await execGit(cwd, ['tag', 'pkg2@0.2.0'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 5;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'fix(pkg2): update b to 5'])

      await updatePackageJson(pkgDir2, { version: '0.3.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg2): release v0.3.0'])
      await execGit(cwd, ['tag', 'pkg2@0.3.0'])

      await execGit(cwd, [
        'commit',
        '--allow-empty',
        '--allow-empty-message',
        '-m',
        '',
      ])

      await pushGitChanges(cwd, 'main', '--tags')

      expect(await getGitTags(remote)).toMatchInlineSnapshot(`
        [
          "pkg1@0.2.0",
          "pkg2@0.2.0",
          "pkg2@0.3.0",
          "v0.0.0",
          "v0.1.0",
        ]
      `)
      expect(await getGitCommitSubjects(remote)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "chore: set up project",
          "feat(pkg1): add index.js",
          "feat(pkg2): add index.js",
          "chore: release v0.1.0",
          "fix(pkg1): update a to 3",
          "chore(pkg1): release v0.2.0",
          "docs: add README file",
          "fix(pkg2): update b to 4",
          "chore(pkg2): release v0.2.0",
          "fix(pkg2): update b to 5",
          "chore(pkg2): release v0.3.0",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await countGitHistory(cwd)).toBe(1)

      await execGit(cwd, ['fetch', '--deepen=1'])

      expect(await countGitHistory(cwd)).toBe(2)

      await execGit(cwd, ['fetch', '--deepen=3'])

      expect(await countGitHistory(cwd)).toBe(5)

      const entries = await getGitCommitHashes(cwd)

      expect(await countGitHistory(cwd, 'HEAD')).toBe(5)
      expect(await countGitHistory(cwd, 'HEAD^')).toBe(4)
      expect(await countGitHistory(cwd, 'HEAD~2')).toBe(3)
      expect(await countGitHistory(cwd, 'HEAD~3')).toBe(2)
      expect(await countGitHistory(cwd, 'HEAD~4')).toBe(1)
      await expect(countGitHistory(cwd, 'HEAD~5')).rejects.toThrow()
      await expect(countGitHistory(cwd, 'HEAD~6')).rejects.toThrow()
      expect(await countGitHistory(cwd, entries[4])).toBe(5)
      expect(await countGitHistory(cwd, entries[3])).toBe(4)
      expect(await countGitHistory(cwd, entries[2])).toBe(3)
      expect(await countGitHistory(cwd, entries[1])).toBe(2)
      expect(await countGitHistory(cwd, entries[0])).toBe(1)
      await expect(countGitHistory(cwd, entries[0] + '^')).rejects.toThrow()
      await expect(countGitHistory(cwd, entries[0] + '~2')).rejects.toThrow()
      await expect(countGitHistory(cwd, entries[0] + '~3')).rejects.toThrow()
      expect(await countGitHistory(cwd, 'pkg2@0.2.0')).toBe(2)
      expect(await countGitHistory(cwd, 'pkg2@0.3.0')).toBe(4)
      await expect(countGitHistory(cwd, 'v0.0.0')).rejects.toThrow()
      await expect(countGitHistory(cwd, 'v0.1.0')).rejects.toThrow()
      expect(await countGitHistory(cwd, 'refs/tags/pkg2@0.2.0')).toBe(2)
      expect(await countGitHistory(cwd, 'refs/tags/pkg2@0.3.0')).toBe(4)
      await expect(countGitHistory(cwd, 'refs/tags/v0.0.0')).rejects.toThrow()
      await expect(countGitHistory(cwd, 'refs/tags/v0.1.0')).rejects.toThrow()
    })
  })
})
