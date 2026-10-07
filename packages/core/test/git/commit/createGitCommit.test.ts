// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { createGitCommit, execGit } from '@reelout/core'
import { writePackageJson } from '@reelout/npm'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { beforeEach, expect, test, vi } from 'vitest'
import { initializeGitRepository } from '../../../../../test/mock/git'

beforeEach(() => {
  vi.resetAllMocks()
})

test('does not create a commit when the commit message is null or undefined', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await createGitCommit(cwd, null)
    await createGitCommit(cwd, undefined)

    await expect(execGit(cwd, ['log', '-1', 'HEAD'])).rejects
      .toMatchInlineSnapshot(`
      [Error: Command 'git log -1 HEAD' failed (exit code 128)
      fatal: ambiguous argument 'HEAD': unknown revision or path not in the working tree.
      Use '--' to separate paths from revisions, like this:
      'git <command> [<revision>...] -- [<file>...]']
    `)
  })
})

test('does not create a commit when there are no changes to stage in the working directory', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await createGitCommit(cwd, 'chore: init')

    await expect(execGit(cwd, ['log', '-1', 'HEAD'])).rejects
      .toMatchInlineSnapshot(`
      [Error: Command 'git log -1 HEAD' failed (exit code 128)
      fatal: ambiguous argument 'HEAD': unknown revision or path not in the working tree.
      Use '--' to separate paths from revisions, like this:
      'git <command> [<revision>...] -- [<file>...]']
    `)
  })
})

test('creates a commit with staged changes when the working directory contains modified files', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, {})
    await writeFile(path.join(cwd, 'LICENSE'), '')
    await createGitCommit(cwd, 'chore: init')

    expect(await execGit(cwd, ['log', '-1', 'HEAD'])).toMatchInlineSnapshot(`
      "commit d1ace8de44e09155a8d7ccc8dd2a0d6d64e25a08
      Author: Test User <test@example.com>
      Date:   Thu Jan 1 00:00:00 2026 +0000

          chore: init
      "
    `)
  })
})

test('creates a commit with a multiline body and descriptive conventional commit message', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, {})
    await writeFile(path.join(cwd, 'LICENSE'), '')
    await createGitCommit(
      cwd,
      [
        'chore: release v1.0.0',
        '## Features',
        '- add initial support for core utilities',
        '## Bug Fixes',
        '- handle edge cases in configuration parsing',
      ].join('\n')
    )

    expect(await execGit(cwd, ['log', '-1', 'HEAD'])).toMatchInlineSnapshot(`
      "commit 38491394293a7c32960aadfb69396576cabb50ee
      Author: Test User <test@example.com>
      Date:   Thu Jan 1 00:00:01 2026 +0000

          chore: release v1.0.0
          ## Features
          - add initial support for core utilities
          ## Bug Fixes
          - handle edge cases in configuration parsing
      "
    `)
  })
})
