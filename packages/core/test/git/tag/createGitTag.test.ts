// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { createGitTag, execGit } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { beforeEach, expect, test, vi } from 'vitest'
import {
  getGitTags,
  initializeGitRepository,
} from '../../../../../test/mock/git'

vi.mock(import('@reelout/core/util/execGit'), async (importOriginal) => ({
  execGit: vi.fn((await importOriginal()).execGit),
}))

beforeEach(() => {
  vi.resetAllMocks()
})

test('creates tags based on message presence', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
    await createGitTag(cwd, 'v1.0.0')
    await createGitTag(
      cwd,
      'v1.0.1',
      ['Release version 1.0.1', 'More details'].join('\n')
    )
    await createGitTag(
      cwd,
      'v1.1.0',
      [
        'Release v1.1.0',
        '',
        '## Features',
        '',
        '- Added dark mode support',
        '- Improved performance',
      ].join('\n')
    )

    expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
      [
        "v1.0.0",
        "v1.0.1 Release version 1.0.1
      More details",
        "v1.1.0 Release v1.1.0

      ## Features

      - Added dark mode support
      - Improved performance",
      ]
    `)

    const calls = vi
      .mocked(execGit)
      .mock.calls.map(([, args]) => args)
      .filter((args) => args[0] === 'tag')

    expect(calls).toMatchInlineSnapshot(`
      [
        [
          "tag",
          "v1.0.0",
        ],
        [
          "tag",
          "-a",
          "v1.0.1",
          "-m",
          "Release version 1.0.1
      More details",
          "--cleanup=whitespace",
        ],
        [
          "tag",
          "-a",
          "v1.1.0",
          "-m",
          "Release v1.1.0

      ## Features

      - Added dark mode support
      - Improved performance",
          "--cleanup=whitespace",
        ],
      ]
    `)
  })
})
