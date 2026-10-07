// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/* istanbul ignore file */
import type { GitCommit } from '@reelout/core'
import { parseGitCommit } from '@reelout/core/git/commit/parseGitCommit'
import { beforeEach } from 'vitest'

let now: number

export async function createMockCommit(
  hash: string,
  subject: string,
  body = '',
  files: string[] = [],
  markers?: readonly string[]
): Promise<GitCommit> {
  const authorDate = new Date(now).toISOString()
  now += 1000
  const committerDate = new Date(now).toISOString()
  now += 1000

  return parseGitCommit(
    {
      hash,
      parent: [],
      authorDate,
      committerDate,
      subject,
      body,
      files,
    },
    markers
  )
}

beforeEach(() => {
  now = Date.parse('2026-01-01T00:00:00Z')
})
