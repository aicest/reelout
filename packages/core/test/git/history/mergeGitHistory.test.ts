// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  compact,
  execGit,
  getParsedGitCommit,
  mergeGitHistory,
} from '@reelout/core'
import { writePackageJson } from '@reelout/npm'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { initializeGitRepository } from '../../../../../test/mock/git'

async function showCommits(cwd: string, range: string) {
  return compact(
    await Promise.all(
      (await execGit(cwd, ['log', '--format=%H', range]))
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((hash) => getParsedGitCommit(cwd, hash))
    )
  )
}

async function mergeCommits(cwd: string, range1: string, range2: string) {
  return (
    await mergeGitHistory(
      cwd,
      await showCommits(cwd, range1),
      await showCommits(cwd, range2)
    )
  ).map((commit) => commit.header)
}

test('deduplicates and merges commit histories into newest-first order', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.1.0-dev.1' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'root-1'])
    await execGit(cwd, ['tag', 'v1.1.0-dev.1'])

    await writePackageJson(cwd, { version: '1.1.0-dev.2' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'root-2'])
    await execGit(cwd, ['tag', 'v1.1.0-dev.2'])

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'root-3'])
    await execGit(cwd, ['commit', '--allow-empty', '-m', 'root-4'])

    await execGit(cwd, ['checkout', '-b', 'release'])
    await writePackageJson(cwd, { version: '1.1.0-rc.1' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'rc-1'])
    await execGit(cwd, ['tag', 'v1.1.0-rc.1'])

    await writePackageJson(cwd, { version: '1.1.0-rc.2' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'rc-2'])
    await execGit(cwd, ['tag', 'v1.1.0-rc.2'])

    await execGit(cwd, ['checkout', 'main'])
    await writePackageJson(cwd, { version: '1.2.0-dev.1' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'dev-1'])
    await execGit(cwd, ['tag', 'v1.2.0-dev.1'])

    await writePackageJson(cwd, { version: '1.2.0-dev.2' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'dev-2'])
    await execGit(cwd, ['tag', 'v1.2.0-dev.2'])

    await execGit(cwd, ['checkout', 'release'])
    await writePackageJson(cwd, { version: '1.1.0-rc.3' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'rc-3'])
    await execGit(cwd, ['tag', 'v1.1.0-rc.3'])

    expect(
      await mergeCommits(
        cwd,
        'v1.1.0-dev.1..v1.1.0-rc.1',
        'v1.1.0-dev.2..v1.1.0-rc.2'
      )
    ).toMatchInlineSnapshot(`
      [
        "rc-2",
        "rc-1",
        "root-4",
        "root-3",
        "root-2",
      ]
    `)

    expect(
      await mergeCommits(
        cwd,
        'v1.1.0-dev.2..v1.1.0-rc.2',
        'v1.1.0-dev.1..v1.1.0-rc.1'
      )
    ).toMatchInlineSnapshot(`
      [
        "rc-2",
        "rc-1",
        "root-4",
        "root-3",
        "root-2",
      ]
    `)

    expect(await mergeCommits(cwd, 'main', 'release')).toMatchInlineSnapshot(`
      [
        "rc-3",
        "dev-2",
        "dev-1",
        "rc-2",
        "rc-1",
        "root-4",
        "root-3",
        "root-2",
        "root-1",
      ]
    `)

    expect(await mergeCommits(cwd, 'release', 'main')).toMatchInlineSnapshot(`
      [
        "rc-3",
        "dev-2",
        "dev-1",
        "rc-2",
        "rc-1",
        "root-4",
        "root-3",
        "root-2",
        "root-1",
      ]
    `)
  })
})
