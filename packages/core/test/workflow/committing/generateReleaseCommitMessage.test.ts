// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitCommit, ReleasePlan } from '@reelout/core'
import {
  execGit,
  generateReleaseCommitMessage,
  getParsedGitCommit,
} from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { initializeGitRepository } from '../../../../../test/mock/git'

test('returns null when no release plans contain release tags', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    const plans = [
      {
        package: { entry: true, location: '.', version: '0.0.0' },
        history: [] as GitCommit[],
        release: null,
      },
      {
        package: { entry: false, location: 'foo', version: '0.0.0' },
        history: [] as GitCommit[],
        release: null,
      },
    ] as ReleasePlan[]

    const result = await generateReleaseCommitMessage(cwd, plans)

    expect(result).toBeNull()
  })
})

test('formats commit message with version and changes for a single release plan', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'fix: resolve issue'])

    const plans = [
      {
        package: { entry: true, location: '.', version: '1.0.0' },
        history: [await getParsedGitCommit(cwd, 'HEAD')],
        release: { version: '1.0.1', tag: { name: 'v1.0.1' } },
      },
    ] as ReleasePlan[]

    const result = await generateReleaseCommitMessage(cwd, plans)

    expect(result).toMatchInlineSnapshot(`
      "chore: release 1.0.1

      Notable Changes:
      - fix: resolve issue

      Release-Agent: ReelOut/0.0.0"
    `)
  })
})

test('uses tag name in subject for a single non-entry package release plan', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    const plans = [
      {
        package: {
          entry: false,
          location: 'foo',
          name: 'foo',
          version: '1.0.0',
        },
        history: [] as GitCommit[],
        release: { version: '1.0.1', tag: { name: 'foo@1.0.1' } },
      },
      {
        package: {
          entry: false,
          location: 'bar',
          name: 'bar',
          version: '2.0.0',
        },
        history: [] as GitCommit[],
        release: null,
      },
    ] as ReleasePlan[]

    const result = await generateReleaseCommitMessage(cwd, plans)

    expect(result).toMatchInlineSnapshot(`
      "chore: release foo@1.0.1

      Release-Agent: ReelOut/0.0.0"
    `)
  })
})

test('deduplicates shared commits across packages and sorts changes chronologically', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'feat: feature alpha'])
    await execGit(cwd, ['commit', '--allow-empty', '-m', 'fix: bug beta'])
    await execGit(cwd, [
      'commit',
      '--allow-empty',
      '-m',
      'docs: update docs gamma',
    ])

    const commit1 = await getParsedGitCommit(cwd, 'HEAD~2')
    const commit2 = await getParsedGitCommit(cwd, 'HEAD~1')
    const commit3 = await getParsedGitCommit(cwd, 'HEAD~0')

    const plans = [
      {
        package: {
          entry: false,
          location: 'pkg-a',
          name: 'pkg-a',
          version: '1.0.0',
        },
        history: [{ ...commit3 }, { ...commit1 }],
        release: { version: '1.0.1', tag: { name: 'pkg-a@1.0.1' } },
      },
      {
        package: {
          entry: false,
          location: 'pkg-b',
          name: 'pkg-b',
          version: '1.0.0',
        },
        history: [{ ...commit2 }, { ...commit1 }],
        release: { version: '1.0.1', tag: { name: 'pkg-b@1.0.1' } },
      },
    ] as ReleasePlan[]

    const result = await generateReleaseCommitMessage(cwd, plans)

    expect(result).toMatchInlineSnapshot(`
      "chore: release pkg-a@1.0.1, pkg-b@1.0.1

      Version Updates:
      - pkg-a: 1.0.0 → 1.0.1
      - pkg-b: 1.0.0 → 1.0.1

      Notable Changes:
      - feat: feature alpha
      - fix: bug beta

      Release-Agent: ReelOut/0.0.0"
    `)
  })
})

test('prioritizes entry packages first when sorting 2 to 3 release plans', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await execGit(cwd, [
      'commit',
      '--allow-empty',
      '-m',
      'feat: add foo feature',
    ])
    await execGit(cwd, ['commit', '--allow-empty', '-m', 'chore: update root'])

    const commit1 = await getParsedGitCommit(cwd, 'HEAD~1')
    const commit2 = await getParsedGitCommit(cwd, 'HEAD~0')

    const plans = [
      {
        package: {
          entry: false,
          location: 'foo',
          name: 'foo',
          version: '1.2.2',
        },
        history: [commit1],
        release: { version: '1.2.3', tag: { name: 'foo@1.2.3' } },
      },
      {
        package: { entry: true, location: '.', name: 'root', version: '2.0.0' },
        history: [commit2],
        release: { version: '2.0.1', tag: { name: 'v2.0.1' } },
      },
    ] as ReleasePlan[]

    const result = await generateReleaseCommitMessage(cwd, plans)

    expect(result).toMatchInlineSnapshot(`
      "chore: release v2.0.1, foo@1.2.3

      Version Updates:
      - root: 2.0.0 → 2.0.1
      - foo: 1.2.2 → 1.2.3

      Notable Changes:
      - feat: add foo feature

      Release-Agent: ReelOut/0.0.0"
    `)
  })
})

test('summarizes subject with package count and overflow when releasing more than 3 packages', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    const plans = [
      {
        package: { entry: true, location: '.', name: 'root', version: '1.0.0' },
        history: [] as GitCommit[],
        release: { version: '1.0.1', tag: { name: 'v1.0.1' } },
      },
      {
        package: { entry: false, location: 'p1', name: 'p1', version: '1.1.0' },
        history: [] as GitCommit[],
        release: { version: '1.1.1', tag: { name: 'p1@1.1.1' } },
      },
      {
        package: { entry: false, location: 'p2', name: 'p2', version: '1.2.0' },
        history: [] as GitCommit[],
        release: { version: '1.2.1', tag: { name: 'p2@1.2.1' } },
      },
      {
        package: { entry: false, location: 'p3', name: 'p3', version: '1.3.0' },
        history: [] as GitCommit[],
        release: { version: '1.3.1', tag: { name: 'p3@1.3.1' } },
      },
    ] as ReleasePlan[]

    const result = await generateReleaseCommitMessage(cwd, plans)

    expect(result).toMatchInlineSnapshot(`
      "chore: release 4 packages (v1.0.1, p1@1.1.1, +2 more)

      Version Updates:
      - root: 1.0.0 → 1.0.1
      - p1: 1.1.0 → 1.1.1
      - p2: 1.2.0 → 1.2.1
      - p3: 1.3.0 → 1.3.1

      Release-Agent: ReelOut/0.0.0"
    `)
  })
})

test('appends custom trailers while filtering out null or undefined values', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    const plans = [
      {
        package: { entry: true, location: '.', version: '0.0.0' },
        history: [] as GitCommit[],
        release: { version: '0.1.0', tag: { name: 'v0.1.0' } },
      },
    ] as ReleasePlan[]

    const customTrailers = {
      'Signed-off-by': 'Developer <dev@example.com>',
      'X-Custom': 123,
      'Empty-Field': null,
      'Undefined-Field': undefined,
    }

    const result = await generateReleaseCommitMessage(
      cwd,
      plans,
      customTrailers
    )

    expect(result).toMatchInlineSnapshot(`
      "chore: release 0.1.0

      Release-Agent: ReelOut/0.0.0
      Signed-off-by: Developer <dev@example.com>
      X-Custom: 123"
    `)
  })
})
