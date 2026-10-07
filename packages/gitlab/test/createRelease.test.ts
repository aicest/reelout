// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { buildReleaseNotes, type ReleasePlan } from '@reelout/core'
import { createRelease } from '@reelout/gitlab'
import { beforeEach, expect, test, vi } from 'vitest'
import { context, createMockRepository } from '../../../test/mock/context'
import { createMockCommit } from '../../../test/mock/git'

const createReleaseMock = vi.hoisted(() => vi.fn())

const Gitlab = vi.hoisted(() =>
  vi.fn(function () {
    return { ProjectReleases: { create: createReleaseMock } }
  })
)

vi.mock('@gitbeaker/rest', () => ({ Gitlab }))

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
    createMockRepository('gitlab')
  )

  await createRelease(
    context,
    {
      package: { location: '.' },
      release: { tag: { name: 'v1.2.3' } },
    } as ReleasePlan,
    'token',
    createMockRepository('gitlab')
  )

  expect(Gitlab).not.toHaveBeenCalled()
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
    createMockRepository('gitlab')
  )

  expect(Gitlab).toHaveBeenCalledTimes(1)
  expect(Gitlab).toHaveBeenCalledWith(
    expect.objectContaining({ token: 'mock-token' })
  )
  expect(createReleaseMock).toHaveBeenCalledTimes(1)
  expect(createReleaseMock).toHaveBeenCalledWith(
    encodeURIComponent('mock-owner/mock-repo'),
    {
      name: 'v1.2.3',
      tag_name: 'v1.2.3',
      description: '## Bug Fixes\n\n- resolve an issue abc123\n',
      ref: 'abc123',
    }
  )
})
