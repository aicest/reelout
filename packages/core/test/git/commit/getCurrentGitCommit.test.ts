// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, getCurrentGitCommit } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { initializeGitRepository } from '../../../../../test/mock/git'

test('returns commit details for HEAD when repository is on a branch', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)
    await execGit(cwd, [
      'commit',
      '--allow-empty',
      '-m',
      'feat: initial commit',
    ])

    expect(await getCurrentGitCommit(cwd)).toMatchInlineSnapshot(`
      {
        "authorDate": "2026-01-01T00:00:00.000Z",
        "body": null,
        "committerDate": "2026-01-01T00:00:00.000Z",
        "files": [],
        "footer": null,
        "hash": "375a9a9fc8bb4b0bf6b07520dc35569ef45e4b54",
        "header": "feat: initial commit",
        "mentions": [],
        "merge": null,
        "notes": [],
        "parent": [],
        "references": [],
        "revert": null,
        "scope": null,
        "subject": "initial commit",
        "trailers": [],
        "type": "feat",
      }
    `)
  })
})

test('returns commit details for HEAD when repository is in detached HEAD state', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)
    await execGit(cwd, ['commit', '--allow-empty', '-m', 'feat: first commit'])
    await execGit(cwd, ['commit', '--allow-empty', '-m', 'feat: second commit'])
    await execGit(cwd, ['checkout', 'HEAD~1'])

    expect(await getCurrentGitCommit(cwd)).toMatchInlineSnapshot(`
      {
        "authorDate": "2026-01-01T00:00:01.000Z",
        "body": null,
        "committerDate": "2026-01-01T00:00:01.000Z",
        "files": [],
        "footer": null,
        "hash": "2f9d5145714c80a136df94a7ec7c2e7005223137",
        "header": "feat: first commit",
        "mentions": [],
        "merge": null,
        "notes": [],
        "parent": [],
        "references": [],
        "revert": null,
        "scope": null,
        "subject": "first commit",
        "trailers": [],
        "type": "feat",
      }
    `)
  })
})

test('returns commit details for HEAD when repository is checked out at a lightweight tag', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)
    await execGit(cwd, [
      'commit',
      '--allow-empty',
      '-m',
      'feat: initial commit',
    ])
    await execGit(cwd, ['tag', 'v1.0.0'])
    await execGit(cwd, ['checkout', 'v1.0.0'])

    expect(await getCurrentGitCommit(cwd)).toMatchInlineSnapshot(`
      {
        "authorDate": "2026-01-01T00:00:03.000Z",
        "body": null,
        "committerDate": "2026-01-01T00:00:03.000Z",
        "files": [],
        "footer": null,
        "hash": "53ddb1e7252b681cef8597c0db177e3aafd0f326",
        "header": "feat: initial commit",
        "mentions": [],
        "merge": null,
        "notes": [],
        "parent": [],
        "references": [],
        "revert": null,
        "scope": null,
        "subject": "initial commit",
        "trailers": [],
        "type": "feat",
      }
    `)
  })
})

test('returns commit details for HEAD when repository is checked out at an annotated tag', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)
    await execGit(cwd, [
      'commit',
      '--allow-empty',
      '-m',
      'feat: release v1.0.0',
    ])
    await execGit(cwd, ['tag', '-a', 'v1.0.0', '-m', 'Release 1.0.0'])
    await execGit(cwd, ['checkout', 'v1.0.0'])

    expect(await getCurrentGitCommit(cwd)).toMatchInlineSnapshot(`
      {
        "authorDate": "2026-01-01T00:00:05.000Z",
        "body": null,
        "committerDate": "2026-01-01T00:00:05.000Z",
        "files": [],
        "footer": null,
        "hash": "74cbb58edc6d38cc67b19a01890ff20ce18a7ca1",
        "header": "feat: release v1.0.0",
        "mentions": [],
        "merge": null,
        "notes": [],
        "parent": [],
        "references": [],
        "revert": null,
        "scope": null,
        "subject": "release v1.0.0",
        "trailers": [],
        "type": "feat",
      }
    `)
  })
})

test('parses commit trailers when custom trailer markers are provided', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)
    await execGit(cwd, [
      'commit',
      '--allow-empty',
      '-m',
      'feat: add feature\n\nSigned-off-by: Developer <dev@example.com>',
    ])

    expect(await getCurrentGitCommit(cwd, ['Signed-off-by']))
      .toMatchInlineSnapshot(`
      {
        "authorDate": "2026-01-01T00:00:07.000Z",
        "body": "",
        "committerDate": "2026-01-01T00:00:07.000Z",
        "files": [],
        "footer": "Signed-off-by: Developer <dev@example.com>",
        "hash": "4a5fd7730e323dea85a608bb7c2399a996d76771",
        "header": "feat: add feature",
        "mentions": [],
        "merge": null,
        "notes": [],
        "parent": [],
        "references": [],
        "revert": null,
        "scope": null,
        "subject": "add feature",
        "trailers": [
          {
            "key": "Signed-off-by",
            "value": "Developer <dev@example.com>",
          },
        ],
        "type": "feat",
      }
    `)
  })
})
