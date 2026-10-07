// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  createGitTag,
  execGit,
  expandGitHistory,
  isGitAncestor,
  pushGitChanges,
} from '@reelout/core'
import { updatePackageJson, writePackageJson } from '@reelout/npm'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import {
  cloneGitRepository,
  getGitCommitSubjects,
  getGitTags,
  initializeGitRepository,
} from '../../../../../test/mock/git'

test('correctly offsets page size by subtracting existing local depth during incremental deepening', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2.0.0', '-a', '-m', 'v2'])
      await execGit(cwd, ['tag', 'v2.1.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
      await execGit(cwd, ['tag', 'v3.0.0'])
      await execGit(cwd, ['tag', 'v3.1.0', '-a', '-m', 'v3'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])
      await execGit(cwd, ['tag', 'v4.0.0', '-a', '-m', 'v4'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fifth commit'])
      await execGit(cwd, ['tag', 'v5.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')

      expect(await getGitCommitSubjects(remote)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)
      expect(await getGitTags(remote)).toMatchInlineSnapshot(`
        [
          "v1.0.0",
          "v2.0.0 v2",
          "v2.1.0",
          "v3.0.0",
          "v3.1.0 v3",
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await expandGitHistory(cwd, { pageSize: -1 })).toBe(false)
      expect(await expandGitHistory(cwd, { pageSize: 0 })).toBe(true)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Fifth commit",
        ]
      `)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v5.0.0",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 1 })).toBe(true)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Fourth commit",
          "Fifth commit",
        ]
      `)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 1 })).toBe(true)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v3.0.0",
          "v3.1.0 v3",
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 1 })).toBe(true)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v2.0.0 v2",
          "v2.1.0",
          "v3.0.0",
          "v3.1.0 v3",
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 1 })).toBe(true)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v1.0.0",
          "v2.0.0 v2",
          "v2.1.0",
          "v3.0.0",
          "v3.1.0 v3",
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 1 })).toBe(true)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 1 })).toBe(false)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const from = 'HEAD'

      expect(await expandGitHistory(cwd, { pageSize: 0, from })).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 1, from })).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 1, from })).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 2, from })).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v3.0.0",
          "v3.1.0 v3",
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 1, from })).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v3.0.0",
          "v3.1.0 v3",
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 2, from })).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v3.0.0",
          "v3.1.0 v3",
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 3, from })).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v2.0.0 v2",
          "v2.1.0",
          "v3.0.0",
          "v3.1.0 v3",
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await expect(
        expandGitHistory(cwd, { pageSize: 1, from: 'HEAD~99' })
      ).rejects.toThrow()

      await expect(
        expandGitHistory(cwd, { pageSize: 1, from: 'HEAD~99' })
      ).rejects.toThrow()

      await expect(
        expandGitHistory(cwd, { pageSize: 2, from: 'HEAD~99' })
      ).rejects.toThrow()
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await expect(
        expandGitHistory(cwd, { pageSize: 0, from: 'HEAD^' })
      ).rejects.toThrow()

      await expect(
        expandGitHistory(cwd, { pageSize: 1, from: 'HEAD^' })
      ).rejects.toThrow()

      await expect(
        expandGitHistory(cwd, { pageSize: 1, from: 'HEAD^' })
      ).rejects.toThrow()

      await expect(
        expandGitHistory(cwd, { pageSize: 2, from: 'HEAD^' })
      ).rejects.toThrow()

      expect(await expandGitHistory(cwd, { pageSize: 1, from: 'HEAD' })).toBe(
        true
      )
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 0, from: 'HEAD^' })).toBe(
        true
      )
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 1, from: 'HEAD^' })).toBe(
        true
      )
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 1, from: 'HEAD^' })).toBe(
        true
      )
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 2, from: 'HEAD^' })).toBe(
        true
      )
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await expandGitHistory(cwd, { pageSize: 3 })).toBe(true)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 3 })).toBe(true)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 3 })).toBe(false)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await expandGitHistory(cwd, { pageSize: 4 })).toBe(true)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 4 })).toBe(true)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 4 })).toBe(false)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await expandGitHistory(cwd, { pageSize: 99 })).toBe(true)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 99 })).toBe(false)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await expandGitHistory(cwd, { pageSize: undefined })).toBe(true)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: undefined })).toBe(false)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await expandGitHistory(cwd)).toBe(true)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd)).toBe(false)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)
    })
  })
}, 15_000)

test('spans the commit gap to merge disconnected shallow tags into HEAD history during incremental deepening', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      for (const { message, tags } of [
        { 'message': 'chore: add package.json', 'tags': [] },
        { 'message': 'chore: setup workspace', 'tags': [] },
        { 'message': 'feat(pkg1): add index', 'tags': [] },
        { 'message': 'feat(pkg2): add index', 'tags': [] },
        { 'message': 'feat(pkg3): add index', 'tags': [] },
        { 'message': 'feat(pkg4): add index', 'tags': [] },
        { 'message': 'feat(pkg5): add index', 'tags': [] },
        {
          'message': 'chore: release v0.0.1',
          'tags': ['@scope/pkg1@1.1.0', '@scope/pkg2@2.1.0', 'v0.0.1'],
        },
        { 'message': 'fix(pkg1): fix index entry', 'tags': [] },
        { 'message': 'fix(pkg2): fix index entry', 'tags': [] },
        {
          'message': 'chore: release v0.0.2',
          'tags': ['@scope/pkg1@1.1.1', '@scope/pkg2@2.1.1', 'v0.0.2'],
        },
        { 'message': 'fix(pkg1): fix cache leak', 'tags': [] },
        { 'message': 'fix(pkg1): add missing types', 'tags': [] },
        {
          'message': 'chore: release v0.0.3',
          'tags': ['@scope/pkg1@1.1.2', 'v0.0.3'],
        },
        { 'message': 'fix(pkg2): fix empty input', 'tags': [] },
        { 'message': 'fix(pkg2): fix stream crash', 'tags': [] },
      ]) {
        await writePackageJson(cwd, { description: message })
        await execGit(cwd, ['add', '.'])
        await execGit(cwd, ['commit', '-m', message])

        for (const tag of tags) {
          await createGitTag(cwd, tag, message)
        }
      }

      await pushGitChanges(cwd, 'main', '--tags')

      expect(await getGitTags(remote)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.1.0 chore: release v0.0.1",
          "@scope/pkg1@1.1.1 chore: release v0.0.2",
          "@scope/pkg1@1.1.2 chore: release v0.0.3",
          "@scope/pkg2@2.1.0 chore: release v0.0.1",
          "@scope/pkg2@2.1.1 chore: release v0.0.2",
          "v0.0.1 chore: release v0.0.1",
          "v0.0.2 chore: release v0.0.2",
          "v0.0.3 chore: release v0.0.3",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await getGitTags(cwd)).toEqual([])
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "fix(pkg2): fix stream crash",
        ]
      `)

      for (const tag of ['@scope/pkg1@1.1.2', '@scope/pkg2@2.1.1', 'v0.0.3']) {
        await execGit(cwd, [
          'fetch',
          'origin',
          `refs/tags/${tag}:refs/tags/${tag}`,
          '--depth=2',
          '--update-shallow',
        ])
      }

      expect(await isGitAncestor(cwd, 'v0.0.3', 'HEAD')).toBe(false)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.1.1 chore: release v0.0.2",
          "@scope/pkg1@1.1.2 chore: release v0.0.3",
          "@scope/pkg2@2.1.1 chore: release v0.0.2",
          "v0.0.2 chore: release v0.0.2",
          "v0.0.3 chore: release v0.0.3",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "fix(pkg2): fix stream crash",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 1 })).toBe(true)

      expect(await isGitAncestor(cwd, 'v0.0.3', 'HEAD')).toBe(false)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.1.1 chore: release v0.0.2",
          "@scope/pkg1@1.1.2 chore: release v0.0.3",
          "@scope/pkg2@2.1.1 chore: release v0.0.2",
          "v0.0.2 chore: release v0.0.2",
          "v0.0.3 chore: release v0.0.3",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "fix(pkg2): fix empty input",
          "fix(pkg2): fix stream crash",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 1 })).toBe(true)

      expect(await isGitAncestor(cwd, 'v0.0.3', 'HEAD')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.1.1 chore: release v0.0.2",
          "@scope/pkg1@1.1.2 chore: release v0.0.3",
          "@scope/pkg2@2.1.1 chore: release v0.0.2",
          "v0.0.2 chore: release v0.0.2",
          "v0.0.3 chore: release v0.0.3",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "chore: release v0.0.3",
          "fix(pkg2): fix empty input",
          "fix(pkg2): fix stream crash",
        ]
      `)
    })
  })
})

test('successfully deepens the history of a disconnected target reference to resolve its ancestor commits', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      for (const { message, tags } of [
        { 'message': 'chore: add package.json', 'tags': [] },
        { 'message': 'chore: setup workspace', 'tags': [] },
        { 'message': 'feat(pkg1): add index', 'tags': [] },
        { 'message': 'feat(pkg2): add index', 'tags': [] },
        { 'message': 'feat(pkg3): add index', 'tags': [] },
        { 'message': 'feat(pkg4): add index', 'tags': [] },
        { 'message': 'feat(pkg5): add index', 'tags': [] },
        {
          'message': 'chore: release v0.0.1',
          'tags': ['@scope/pkg1@1.1.0', '@scope/pkg2@2.1.0', 'v0.0.1'],
        },
        { 'message': 'fix(pkg1): fix index entry', 'tags': [] },
        { 'message': 'fix(pkg2): fix index entry', 'tags': [] },
        {
          'message': 'chore: release v0.0.2',
          'tags': ['@scope/pkg1@1.1.1', '@scope/pkg2@2.1.1', 'v0.0.2'],
        },
        { 'message': 'fix(pkg1): fix cache leak', 'tags': [] },
        { 'message': 'fix(pkg1): add missing types', 'tags': [] },
        {
          'message': 'chore: release v0.0.3',
          'tags': ['@scope/pkg1@1.1.2', 'v0.0.3'],
        },
        { 'message': 'fix(pkg2): fix empty input', 'tags': [] },
        { 'message': 'fix(pkg2): fix stream crash', 'tags': [] },
      ]) {
        await writePackageJson(cwd, { description: message })
        await execGit(cwd, ['add', '.'])
        await execGit(cwd, ['commit', '-m', message])

        for (const tag of tags) {
          await createGitTag(cwd, tag, message)
        }
      }

      await pushGitChanges(cwd, 'main', '--tags')

      expect(await getGitTags(remote)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.1.0 chore: release v0.0.1",
          "@scope/pkg1@1.1.1 chore: release v0.0.2",
          "@scope/pkg1@1.1.2 chore: release v0.0.3",
          "@scope/pkg2@2.1.0 chore: release v0.0.1",
          "@scope/pkg2@2.1.1 chore: release v0.0.2",
          "v0.0.1 chore: release v0.0.1",
          "v0.0.2 chore: release v0.0.2",
          "v0.0.3 chore: release v0.0.3",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const from = 'v0.0.2'

      await execGit(cwd, [
        'fetch',
        'origin',
        `refs/tags/${from}:refs/tags/${from}`,
        '--depth=1',
        '--update-shallow',
      ])

      expect(await expandGitHistory(cwd, { pageSize: 1, from })).toBe(true)

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.1.1 chore: release v0.0.2",
          "@scope/pkg2@2.1.1 chore: release v0.0.2",
          "v0.0.2 chore: release v0.0.2",
        ]
      `)
      expect(await getGitCommitSubjects(cwd, from)).toMatchInlineSnapshot(`
        [
          "fix(pkg2): fix index entry",
          "chore: release v0.0.2",
        ]
      `)

      expect(
        await expandGitHistory(cwd, { pageSize: 1, from: `${from}^` })
      ).toBe(true)

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.1.1 chore: release v0.0.2",
          "@scope/pkg2@2.1.1 chore: release v0.0.2",
          "v0.0.2 chore: release v0.0.2",
        ]
      `)
      expect(await getGitCommitSubjects(cwd, from)).toMatchInlineSnapshot(`
        [
          "fix(pkg1): fix index entry",
          "fix(pkg2): fix index entry",
          "chore: release v0.0.2",
        ]
      `)

      expect(
        await expandGitHistory(cwd, { pageSize: 2, from: `${from}~2` })
      ).toBe(true)

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.1.1 chore: release v0.0.2",
          "@scope/pkg2@2.1.1 chore: release v0.0.2",
          "v0.0.2 chore: release v0.0.2",
        ]
      `)
      expect(await getGitCommitSubjects(cwd, from)).toMatchInlineSnapshot(`
        [
          "feat(pkg5): add index",
          "chore: release v0.0.1",
          "fix(pkg1): fix index entry",
          "fix(pkg2): fix index entry",
          "chore: release v0.0.2",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "chore: release v0.0.3",
          "fix(pkg2): fix empty input",
          "fix(pkg2): fix stream crash",
        ]
      `)
    })
  })
})

test('maintains historical continuity across parallel streams when tracking cherry-picked commits', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      const pkgDir1 = path.join(cwd, 'packages/pkg1')

      await writePackageJson(cwd, {
        version: '0.0.0',
        private: true,
        workspaces: ['packages/*'],
      })
      await writePackageJson(pkgDir1, {
        name: '@scope/pkg1',
        version: '1.6.0-0',
      })
      await writeFile(
        path.join(cwd, '.prettierrc.json'),
        JSON.stringify({}, null, 2)
      )
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: init'])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const pkg1 = 1;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg1): add initial feature'])

      await updatePackageJson(pkgDir1, { version: '1.6.0-dev.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg1): release 1.6.0-dev.0'])
      await execGit(cwd, [
        'tag',
        '@scope/pkg1@1.6.0-dev.0',
        '-a',
        '-m',
        'chore(pkg1): release 1.6.0-dev.0',
      ])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const pkg1 = 2;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg1): update feature logic'])

      await updatePackageJson(pkgDir1, { version: '1.6.0-dev.1' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg1): release 1.6.0-dev.1'])
      await execGit(cwd, [
        'tag',
        '@scope/pkg1@1.6.0-dev.1',
        '-a',
        '-m',
        'chore(pkg1): release 1.6.0-dev.1',
      ])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)
      await execGit(cwd, ['checkout', '-b', 'release-1.6'])
      await pushGitChanges(cwd, 'release-1.6')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)
      await writeFile(
        path.join(cwd, 'packages/pkg1/index.js'),
        'export const pkg1 = 2; // hotfix'
      )
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'fix(pkg1): apply main hotfix'])
      await pushGitChanges(cwd, 'main')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'release-1.6')
      await execGit(cwd, ['fetch', 'origin', 'main:refs/remotes/origin/main'])
      await execGit(cwd, ['cherry-pick', 'origin/main'])
      await pushGitChanges(cwd, 'release-1.6')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'release-1.6')

      expect(await getGitTags(cwd)).toEqual([])
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "fix(pkg1): apply main hotfix",
        ]
      `)

      expect(await expandGitHistory(cwd, { pageSize: 1, from: 'HEAD' })).toBe(
        true
      )

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "@scope/pkg1@1.6.0-dev.1 chore(pkg1): release 1.6.0-dev.1",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "chore(pkg1): release 1.6.0-dev.1",
          "fix(pkg1): apply main hotfix",
        ]
      `)
    })
  })
})

test('resolves remote commit dates to fetch targeted boundaries via shallow-since in a single run', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
      await execGit(cwd, ['tag', 'v3.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])
      await execGit(cwd, ['tag', 'v4.0.0', '-a', '-m', 'v4'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fifth commit'])
      await execGit(cwd, ['tag', 'v5.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v4.0.0:refs/tags/v4.0.0',
        '--depth=1',
      ])

      expect(await isGitAncestor(cwd, 'v4.0.0', 'HEAD')).toBe(false)
      expect(await isGitAncestor(cwd, 'v5.0.0', 'HEAD')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Fifth commit",
        ]
      `)

      await expandGitHistory(cwd, { until: 'v4.0.0' })

      expect(await isGitAncestor(cwd, 'v4.0.0', 'HEAD')).toBe(true)
      expect(await isGitAncestor(cwd, 'v5.0.0', 'HEAD')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v2.0.0:refs/tags/v2.0.0',
        '--depth=1',
      ])

      expect(await isGitAncestor(cwd, 'v2.0.0', 'HEAD')).toBe(false)
      await expect(isGitAncestor(cwd, 'v3.0.0', 'HEAD')).rejects.toThrow()
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v2.0.0",
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      await expandGitHistory(cwd, { until: 'v2.0.0' })

      expect(await isGitAncestor(cwd, 'v2.0.0', 'HEAD')).toBe(true)
      expect(await isGitAncestor(cwd, 'v3.0.0', 'HEAD')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v2.0.0",
          "v3.0.0",
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v1.0.0:refs/tags/v1.0.0',
        '--depth=1',
      ])

      await expandGitHistory(cwd, { until: 'v1.0.0' })

      expect(await isGitAncestor(cwd, 'v1.0.0', 'HEAD')).toBe(true)
      expect(await isGitAncestor(cwd, 'v2.0.0', 'HEAD')).toBe(true)
      expect(await isGitAncestor(cwd, 'v3.0.0', 'HEAD')).toBe(true)
      expect(await isGitAncestor(cwd, 'v4.0.0', 'HEAD')).toBe(true)
      expect(await isGitAncestor(cwd, 'v5.0.0', 'HEAD')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v1.0.0",
          "v2.0.0",
          "v3.0.0",
          "v4.0.0 v4",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)
    })
  })
})

test('bypasses the remote fetch entirely when the target boundary reference is already locally reachable', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
      await execGit(cwd, ['tag', 'v3.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])
      await execGit(cwd, ['tag', 'v4.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fifth commit'])
      await execGit(cwd, ['tag', 'v5.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v3.0.0:refs/tags/v3.0.0',
        '--depth=1',
      ])

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v3.0.0",
          "v5.0.0",
        ]
      `)

      expect(await expandGitHistory(cwd, { until: 'v3.0.0' })).toBe(true)

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v3.0.0",
          "v4.0.0",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      await expect(isGitAncestor(cwd, 'v1.0.0', 'HEAD')).rejects.toThrow()
      await expect(isGitAncestor(cwd, 'v2.0.0', 'HEAD')).rejects.toThrow()
      expect(await isGitAncestor(cwd, 'v3.0.0', 'HEAD')).toBe(true)
      expect(await isGitAncestor(cwd, 'v4.0.0', 'HEAD')).toBe(true)
      expect(await isGitAncestor(cwd, 'v5.0.0', 'HEAD')).toBe(true)

      await expect(expandGitHistory(cwd, { until: 'v1.0.0' })).rejects.toThrow()
      await expect(expandGitHistory(cwd, { until: 'v2.0.0' })).rejects.toThrow()
      expect(await expandGitHistory(cwd, { until: 'v3.0.0' })).toBe(true)
      expect(await expandGitHistory(cwd, { until: 'v4.0.0' })).toBe(true)
      expect(await expandGitHistory(cwd, { until: 'v5.0.0' })).toBe(true)

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v3.0.0",
          "v4.0.0",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Third commit",
          "Fourth commit",
          "Fifth commit",
        ]
      `)
    })
  })
})

test('throws for unresolvable until refs and completes for resolvable until refs', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v2.0.0",
        ]
      `)

      expect(await expandGitHistory(cwd, { until: 'v2.0.0' })).toBe(true)
      expect(await expandGitHistory(cwd, { until: 'refs/tags/v2.0.0' })).toBe(
        true
      )

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v2.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Second commit",
        ]
      `)

      await expect(expandGitHistory(cwd, { until: 'HEAD^' })).rejects.toThrow()
      await expect(expandGitHistory(cwd, { until: 'HEAD~9' })).rejects.toThrow()
      await expect(expandGitHistory(cwd, { until: 'v9.9.9' })).rejects.toThrow()
      await expect(
        expandGitHistory(cwd, { until: 'refs/tags/v9.9.9' })
      ).rejects.toThrow()

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v2.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Second commit",
        ]
      `)
    })
  })
})

test('stops history expansion once shallow fetches reach the common merge base of diverged branches', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
      await execGit(cwd, ['tag', 'v3.0.0'])

      await execGit(cwd, ['reset', '--hard', 'v2.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])
      await execGit(cwd, ['tag', 'v4.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fifth commit'])
      await execGit(cwd, ['tag', 'v5.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v3.0.0:refs/tags/v3.0.0',
        '--depth=1',
      ])

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v3.0.0",
          "v5.0.0",
        ]
      `)

      expect(await expandGitHistory(cwd, { until: 'v3.0.0' })).toBe(true)

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v3.0.0",
          "v4.0.0",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Fourth commit",
          "Fifth commit",
        ]
      `)

      expect(await expandGitHistory(cwd, { until: 'v3.0.0' })).toBe(true)

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v3.0.0",
          "v4.0.0",
          "v5.0.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Fourth commit",
          "Fifth commit",
        ]
      `)
    })
  })
})
