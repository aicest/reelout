// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { createGitTag, execGit, readGitFile } from '@reelout/core'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { initializeGitRepository } from '../../../../../test/mock/git'

test('returns file contents at a git ref or null if missing', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    expect(await readGitFile(cwd, 'HEAD', 'package.json')).toBeNull()

    await initializeGitRepository(cwd)

    await writeFile(path.join(cwd, 'version.txt'), '1.0.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Add version.txt'])
    await createGitTag(cwd, 'v1.0.0')

    await writeFile(path.join(cwd, 'version.txt'), '1.1.0\n\n')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Update version.txt'])
    await createGitTag(cwd, 'v1.1.0')

    expect(await readGitFile(cwd, 'v1.0.0', 'version.txt')).toBe('1.0.0')

    expect(await readGitFile(cwd, 'v1.1.0', 'version.txt')).toBe('1.1.0\n\n')

    expect(await readGitFile(cwd, 'v2.0.0', 'version.txt')).toBeNull()

    expect(await readGitFile(cwd, 'HEAD', 'version.txt')).toBe('1.1.0\n\n')

    expect(await readGitFile(cwd, 'HEAD', 'README.md')).toBeNull()
  })
})
