// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/* istanbul ignore file */
import type { GitCommit } from '@reelout/core'
import { parseGitCommit } from '@reelout/core/git/commit/parseGitCommit'
import { execGit } from '@reelout/core/util/execGit'
import { fromAsync } from 'from-async'
import { glob, rm } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { rootTemporaryDirectory } from 'tempy'
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

export async function getGitTags(cwd: string): Promise<string[]> {
  return Promise.all(
    (await execGit(cwd, ['tag', '--list']))
      .trim()
      .split('\n')
      .filter(Boolean)
      .sort()
      .map(async (tag) => {
        const RE = /\nDate:\s+.+\n\n([\w\W]*)\n\ncommit\s[a-f0-9]{40}\n/

        const stdout = await execGit(cwd, ['show', '-s', tag])

        const message = RE.exec(stdout)?.at(1)

        if (message) {
          return `${tag} ${message}`
        }

        return tag
      })
  )
}

export async function getGitCommitHashes(
  cwd: string,
  ref?: string
): Promise<string[]> {
  return (
    await execGit(cwd, ['log', '--pretty=format:%H', ...(ref ? [ref] : [])])
  )
    .trim()
    .split('\n')
    .reverse()
}

export async function getGitCommitSubjects(
  cwd: string,
  ref?: string
): Promise<string[]> {
  return (
    await execGit(cwd, ['log', '--pretty=format:%s', ...(ref ? [ref] : [])])
  )
    .trim()
    .split('\n')
    .reverse()
}

/* istanbul ignore next */
export async function clearWorkspace(cwd: string): Promise<void> {
  await Promise.all(
    ['.git', ...(await fromAsync(glob('*', { cwd })))].map(async (entry) => {
      await rm(path.join(cwd, entry), { recursive: true, force: true })
    })
  )
}

export async function cloneGitRepository(
  cwd: string,
  remote: string,
  ref?: string
): Promise<void> {
  await execGit(cwd, [
    'clone',
    '--depth=1',
    ...(ref ? ['--branch', ref] : []),
    pathToFileURL(remote).href,
    '.',
  ])

  await execGit(cwd, ['config', 'user.name', 'Test User'])

  await execGit(cwd, ['config', 'user.email', 'test@example.com'])
}

export async function initializeGitRepository(
  cwd: string,
  remote?: string,
  branch = 'main',
  user = true
): Promise<void> {
  await execGit(cwd, ['init', `--initial-branch=${branch}`])

  if (remote) {
    if (remote.startsWith(rootTemporaryDirectory)) {
      await execGit(remote, ['init', '--bare', `--initial-branch=${branch}`])
    }

    await execGit(cwd, ['remote', 'add', 'origin', pathToFileURL(remote).href])
  }

  if (user) {
    await execGit(cwd, ['config', 'user.name', 'Test User'])
    await execGit(cwd, ['config', 'user.email', 'test@example.com'])
  }
}

beforeEach(() => {
  now = Date.parse('2026-01-01T00:00:00Z')
})
