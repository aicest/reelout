// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { buildReleaseNotes, type ReleasePlan } from '@reelout/core'
import { createRelease } from '@reelout/github'
import { beforeEach, expect, test, vi } from 'vitest'
import { context, repository } from '../../../test/mock/context'
import { createMockCommit } from '../../../test/mock/git'

const createReleaseMock = vi.hoisted(() => vi.fn())

const Octokit = vi.hoisted(() =>
  vi.fn(function () {
    return { rest: { repos: { createRelease: createReleaseMock } } }
  })
)

vi.mock('@octokit/rest', () => ({ Octokit }))

beforeEach(() => {
  vi.clearAllMocks()
})

test('does not create release without message', async () => {
  await createRelease(
    context,
    {
      package: { location: '.' },
      release: null,
    } as ReleasePlan,
    'token',
    repository
  )

  await createRelease(
    context,
    {
      package: { location: '.' },
      release: { tag: { name: 'v1.2.3' } },
    } as ReleasePlan,
    'token',
    repository
  )

  expect(Octokit).not.toHaveBeenCalled()
  expect(createReleaseMock).not.toHaveBeenCalled()
})

test('creates release when tag has message', async () => {
  await createRelease(
    context,
    {
      package: { location: '.' },
      release: {
        tag: {
          name: 'v1.2.3',
          message: await buildReleaseNotes(context, [
            await createMockCommit('abc123', 'fix: resolve an issue'),
          ]),
        },
      },
    } as ReleasePlan,
    'mock-token',
    repository
  )

  expect(Octokit).toHaveBeenCalledTimes(1)
  expect(Octokit).toHaveBeenCalledWith(
    expect.objectContaining({ auth: 'mock-token' })
  )
  expect(createReleaseMock).toHaveBeenCalledTimes(1)
  expect(createReleaseMock).toHaveBeenCalledWith({
    owner: 'mock-owner',
    repo: 'mock-repo',
    tag_name: 'v1.2.3',
    target_commitish: 'abc123',
    name: 'v1.2.3',
    body: '## Bug Fixes\n\n- resolve an issue abc123\n',
    draft: false,
    prerelease: false,
  })
})
