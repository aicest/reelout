// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, resolveGitRevision } from '@reelout/core'
import { writePackageJson } from '@reelout/npm'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { initializeGitRepository } from '../../../../../test/mock/git'

test('resolves branch, tag, short SHA, and commit-ish expressions to full hashes', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'First commit'])
    await execGit(cwd, ['tag', 'v1.0.0'])

    await writePackageJson(cwd, { version: '2.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Second commit'])
    await execGit(cwd, ['tag', '-a', 'v2.0.0', '-m', 'Release v2.0.0'])

    const firstCommitSha = (await execGit(cwd, ['rev-parse', 'HEAD^'])).trim()
    const secondCommitSha = (await execGit(cwd, ['rev-parse', 'HEAD'])).trim()
    const shortSha = secondCommitSha.slice(0, 7)

    const tagObjectSha = (
      await execGit(cwd, ['rev-parse', '--verify', 'v2.0.0'])
    ).trim()

    expect(tagObjectSha).not.toBe(secondCommitSha)

    expect([firstCommitSha, secondCommitSha, shortSha, tagObjectSha])
      .toMatchInlineSnapshot(`
      [
        "ff03acfa184cea0dbfd80dd09485bef7adcaffcd",
        "03be7820526cf215ca56ab308a4ee950b7b92589",
        "03be782",
        "39f6ddf4aead28eb1842eb9b5275d96d856f80fd",
      ]
    `)

    for (const [revision, expected] of [
      ['main', secondCommitSha],
      ['HEAD', secondCommitSha],
      ['v2.0.0', secondCommitSha],
      ['v1.0.0', firstCommitSha],
      [shortSha, secondCommitSha],
      ['HEAD~1', firstCommitSha],
      ['refs/tags/v1.0.0', firstCommitSha],
      ['refs/tags/v2.0.0', secondCommitSha],
    ] as const) {
      expect(await resolveGitRevision(cwd, revision)).toBe(expected)
    }
  })
})

test('throws when revision is invalid or missing', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'First commit'])

    await expect(resolveGitRevision(cwd, 'v9.9.9')).rejects
      .toMatchInlineSnapshot(`
      [Error: Command 'git rev-parse --verify v9.9.9^{commit}' failed (exit code 128)
      fatal: Needed a single revision]
    `)

    await expect(resolveGitRevision(cwd, 'non-existent-branch')).rejects
      .toMatchInlineSnapshot(`
      [Error: Command 'git rev-parse --verify non-existent-branch^{commit}' failed (exit code 128)
      fatal: Needed a single revision]
    `)
  })
})
