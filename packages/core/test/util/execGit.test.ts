// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execCommand, execGit } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test, vi } from 'vitest'

vi.mock(import('@reelout/core/util/execCommand'), async (importActual) => ({
  execCommand: vi.fn((await importActual()).execCommand),
}))

test('executes a git command with the specified working directory', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await execGit(cwd, ['init', '--initial-branch=main'])

    expect(await execGit(cwd, ['status'])).toMatchInlineSnapshot(`
      "On branch main

      No commits yet

      nothing to commit (create/copy files and use "git add" to track)
      "
    `)

    expect(vi.mocked(execCommand).mock.calls).toMatchInlineSnapshot(`
      [
        [
          "git",
          [
            "init",
            "--initial-branch=main",
          ],
          {
            "cwd": "${cwd}",
          },
        ],
        [
          "git",
          [
            "status",
          ],
          {
            "cwd": "${cwd}",
          },
        ],
      ]
    `)
  })
})
