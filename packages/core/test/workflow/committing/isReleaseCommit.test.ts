// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  execGit,
  getParsedGitCommit,
  isReleaseCommit,
  type GitCommit,
  type GitCommitTrailer,
} from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { initializeGitRepository } from '../../../../../test/mock/git'

async function createCommit(
  cwd: string,
  message: string,
  options?: { tag?: string }
) {
  await execGit(cwd, ['commit', '--allow-empty', '-m', message])

  if (options?.tag) {
    await execGit(cwd, ['tag', options.tag])
  }
}

test('returns false when commit is null or undefined', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    expect(await isReleaseCommit(cwd, null)).toBe(false)

    expect(await isReleaseCommit(cwd, undefined)).toBe(false)
  })
})

test('returns false when commit reference is missing or object is malformed', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    expect(await isReleaseCommit(cwd, 'non-existent-ref')).toBe(false)

    expect(
      await isReleaseCommit(cwd, {
        hash: 'invalid',
        trailers: [] as GitCommitTrailer[],
      } as GitCommit)
    ).toBe(false)
  })
})

test('returns true when commit trailers contain default release marker', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await createCommit(cwd, 'feat: add feature\n\nRelease-Agent: Bot/1.0.0')

    expect(await isReleaseCommit(cwd, 'HEAD')).toBe(true)
  })
})

test('returns true when commit trailers match custom string marker', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await createCommit(cwd, 'fix: bug fix\n\nRelease Verified: True')

    expect(await isReleaseCommit(cwd, 'HEAD', 'Release Verified')).toBe(true)
  })
})

test('returns true when commit trailers satisfy custom predicate function', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await createCommit(cwd, 'chore: release prep\n\nRelease-Type: major')

    const predicate = (trailer: GitCommitTrailer) =>
      trailer.key === 'Release-Type' && trailer.value === 'major'

    expect(await isReleaseCommit(cwd, 'HEAD', predicate)).toBe(true)
  })
})

test('returns true when commit has exact matching git tag', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await createCommit(cwd, 'chore: tagged commit', { tag: 'v2.0.0' })

    expect(await isReleaseCommit(cwd, 'HEAD')).toBe(true)
  })
})

test('returns true when commit reference string contains release marker', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await createCommit(cwd, 'feat: string ref\n\nRelease-Agent: Bot/1.1.0')

    expect(await isReleaseCommit(cwd, 'HEAD')).toBe(true)
  })
})

test('returns true when pre-parsed commit object contains release marker', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await createCommit(cwd, 'feat: object ref\n\nRelease-Agent: Bot/1.2.0')

    const commit = await getParsedGitCommit(cwd, 'HEAD')

    expect(await isReleaseCommit(cwd, commit)).toBe(true)
  })
})
