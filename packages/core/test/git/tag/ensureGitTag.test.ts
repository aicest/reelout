// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  createGitTag,
  deleteGitTag,
  ensureGitTag,
  execGit,
  isGitAncestor,
  pushGitChanges,
} from '@reelout/core'
import { writePackageJson } from '@reelout/npm'
import { temporaryDirectoryTask } from 'tempy'
import { beforeEach, expect, test, vi } from 'vitest'
import {
  cloneGitRepository,
  getGitCommitSubjects,
  getGitTags,
  initializeGitRepository,
} from '../../../../../test/mock/git'

vi.mock(import('@reelout/core/util/execGit'), async (importActual) => ({
  execGit: vi.fn((await importActual()).execGit),
}))

beforeEach(() => {
  vi.resetAllMocks()
})

test('fetches missing tags and restores commit context', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2', '-a', '-m', 'Annotated tag'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
      await execGit(cwd, ['tag', 'v3'])

      await execGit(cwd, ['checkout', '-b', 'release/20260101'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])
      await execGit(cwd, ['tag', 'v4'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fifth commit'])
      await execGit(cwd, ['tag', 'v5'])

      await pushGitChanges(cwd, 'main', 'release/20260101', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v3",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Third commit",
        ]
      `)

      expect(await ensureGitTag(cwd, 'v3')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v2 Annotated tag",
          "v3",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Second commit",
          "Third commit",
        ]
      `)
      expect(await getGitCommitSubjects(cwd, 'v3')).toMatchInlineSnapshot(`
        [
          "Second commit",
          "Third commit",
        ]
      `)

      expect(await ensureGitTag(cwd, 'v3')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v2 Annotated tag",
          "v3",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Second commit",
          "Third commit",
        ]
      `)
      expect(await getGitCommitSubjects(cwd, 'v3')).toMatchInlineSnapshot(`
        [
          "Second commit",
          "Third commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await ensureGitTag(cwd, 'v1')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v1",
          "v3",
        ]
      `)
      expect(await getGitCommitSubjects(cwd, 'v1')).toMatchInlineSnapshot(`
        [
          "Initial commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await ensureGitTag(cwd, 'v2')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v1",
          "v2 Annotated tag",
          "v3",
        ]
      `)
      expect(await getGitCommitSubjects(cwd, 'v2')).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await ensureGitTag(cwd, 'v3')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v2 Annotated tag",
          "v3",
        ]
      `)
      expect(await getGitCommitSubjects(cwd, 'v3')).toMatchInlineSnapshot(`
        [
          "Second commit",
          "Third commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await ensureGitTag(cwd, 'v4')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v3",
          "v4",
        ]
      `)
      expect(await getGitCommitSubjects(cwd, 'v4')).toMatchInlineSnapshot(`
        [
          "Third commit",
          "Fourth commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await ensureGitTag(cwd, 'v5')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v3",
          "v4",
          "v5",
        ]
      `)
      expect(await getGitCommitSubjects(cwd, 'v5')).toMatchInlineSnapshot(`
        [
          "Fourth commit",
          "Fifth commit",
        ]
      `)
    })
  })
})

test('updates local tag when remote tag is force-pushed', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1', '-a', '-m', 'v1'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await ensureGitTag(cwd, 'v1')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v1 v1",
        ]
      `)
      expect(await getGitCommitSubjects(cwd, 'v1')).toMatchInlineSnapshot(`
        [
          "Initial commit",
        ]
      `)

      await temporaryDirectoryTask(async (cwd) => {
        await cloneGitRepository(cwd, remote)

        await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
        await deleteGitTag(cwd, 'v1')
        await createGitTag(cwd, 'v2')
        await createGitTag(cwd, 'v1', 'v1-override')

        await pushGitChanges(cwd, 'main', '--tags', '--force')
      })

      expect(await ensureGitTag(cwd, 'v1')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v1 v1-override",
          "v2",
        ]
      `)
      expect(await getGitCommitSubjects(cwd, 'v1')).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
        ]
      `)
    })
  })
})

test('removes local tag when the remote tag is deleted', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1', '-a', '-m', 'v1'])
      await execGit(cwd, ['tag', 'v2'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await ensureGitTag(cwd, 'v1')).toBe(true)
      expect(await ensureGitTag(cwd, 'v2')).toBe(true)
      expect(await ensureGitTag(cwd, 'v3')).toBe(false)
      expect(await ensureGitTag(cwd, ':invalid:')).toBe(false)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v1 v1",
          "v2",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
        ]
      `)

      await deleteGitTag(remote, 'v1')

      expect(await ensureGitTag(cwd, 'v1')).toBe(false)
      expect(await ensureGitTag(cwd, 'v2')).toBe(true)
      expect(await ensureGitTag(cwd, 'v3')).toBe(false)
      expect(await ensureGitTag(cwd, ':invalid:')).toBe(false)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v2",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
        ]
      `)
    })
  })
})

test('reflects local tag state without a remote', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
    await execGit(cwd, ['tag', 'v1', '-a', '-m', 'v1'])
    await execGit(cwd, ['tag', 'v2'])

    expect(await ensureGitTag(cwd, 'v1')).toBe(true)
    expect(await ensureGitTag(cwd, 'v2')).toBe(true)
    expect(await ensureGitTag(cwd, 'v3')).toBe(false)
    expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
      [
        "v1 v1",
        "v2",
      ]
    `)
    expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
      [
        "Initial commit",
      ]
    `)
  })
})

test('performs a single shallow fetch when ensuring multiple nearby tags', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2'])
      await execGit(cwd, ['tag', 'v2.5', '-a', '-m', 'Annotated tag'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
      await execGit(cwd, ['tag', 'v3'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])
      await execGit(cwd, ['tag', 'v4'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fifth commit'])
      await execGit(cwd, ['tag', 'v5'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v5",
        ]
      `)

      await Promise.all([ensureGitTag(cwd, 'v2'), ensureGitTag(cwd, 'v2.5')])

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v1",
          "v2",
          "v2.5 Annotated tag",
          "v5",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Fifth commit",
        ]
      `)

      const calls = vi
        .mocked(execGit)
        .mock.calls.filter((args) => args[1][0] === 'fetch')
        .map((args) => args[1].join(' '))

      expect(calls).toHaveLength(1)
      expect(calls).toEqual(
        expect.toBeOneOf([
          [
            'fetch origin refs/tags/v2:refs/tags/v2 --depth=2 --update-shallow --force',
          ],
          [
            'fetch origin refs/tags/v2.5:refs/tags/v2.5 --depth=2 --update-shallow --force',
          ],
        ])
      )
    })
  })
})

test('verifies fetch depth impact on commit ancestry and graph connectivity', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      for (let i = 1; i <= 9; i += 1) {
        await writePackageJson(cwd, { version: `${i}.0.0` })
        await execGit(cwd, ['add', '.'])
        await execGit(cwd, ['commit', '--allow-empty', '-m', `Release v${i}`])
        await execGit(cwd, ['tag', `v${i}`])
      }

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, ['fetch', 'origin', 'HEAD', '--depth=4'])

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v9",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Release v6",
          "Release v7",
          "Release v8",
          "Release v9",
        ]
      `)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v6:refs/tags/v6',
        '--depth=1',
        '--force',
      ])

      await expect(isGitAncestor(cwd, 'v4', 'HEAD')).rejects.toThrow()
      await expect(isGitAncestor(cwd, 'v5', 'HEAD')).rejects.toThrow()
      expect(await isGitAncestor(cwd, 'v6', 'HEAD')).toBe(false)
      expect(await isGitAncestor(cwd, 'v7', 'HEAD')).toBe(false)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v6",
          "v7",
          "v8",
          "v9",
        ]
      `)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v5:refs/tags/v5',
        '--depth=1',
        '--force',
      ])

      await expect(isGitAncestor(cwd, 'v3', 'HEAD')).rejects.toThrow()
      await expect(isGitAncestor(cwd, 'v4', 'HEAD')).rejects.toThrow()
      expect(await isGitAncestor(cwd, 'v5', 'HEAD')).toBe(false)
      expect(await isGitAncestor(cwd, 'v6', 'HEAD')).toBe(false)
      expect(await isGitAncestor(cwd, 'v7', 'HEAD')).toBe(false)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v5",
          "v6",
          "v7",
          "v8",
          "v9",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Release v8",
          "Release v9",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, ['fetch', 'origin', 'HEAD', '--depth=4'])

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v9",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Release v6",
          "Release v7",
          "Release v8",
          "Release v9",
        ]
      `)

      await ensureGitTag(cwd, 'v6')

      await expect(isGitAncestor(cwd, 'v4', 'HEAD')).rejects.toThrow()
      expect(await isGitAncestor(cwd, 'v5', 'HEAD')).toBe(true)
      expect(await isGitAncestor(cwd, 'v6', 'HEAD')).toBe(true)
      expect(await isGitAncestor(cwd, 'v7', 'HEAD')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v5",
          "v6",
          "v7",
          "v8",
          "v9",
        ]
      `)

      await ensureGitTag(cwd, 'v5')

      await expect(isGitAncestor(cwd, 'v3', 'HEAD')).rejects.toThrow()
      expect(await isGitAncestor(cwd, 'v4', 'HEAD')).toBe(true)
      expect(await isGitAncestor(cwd, 'v5', 'HEAD')).toBe(true)
      expect(await isGitAncestor(cwd, 'v6', 'HEAD')).toBe(true)
      expect(await isGitAncestor(cwd, 'v7', 'HEAD')).toBe(true)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v4",
          "v5",
          "v6",
          "v7",
          "v8",
          "v9",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Release v4",
          "Release v5",
          "Release v6",
          "Release v7",
          "Release v8",
          "Release v9",
        ]
      `)
    })
  })
})
