// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleasePlan } from '@reelout/core'
import { deleteRelease } from '@reelout/github'
import { beforeEach, expect, test, vi } from 'vitest'
import { repository } from '../../../test/mock/context'

const getReleaseByTagMock = vi.hoisted(() => vi.fn())

const deleteReleaseMock = vi.hoisted(() => vi.fn())

const Octokit = vi.hoisted(() =>
  vi.fn(function () {
    return {
      rest: {
        repos: {
          getReleaseByTag: getReleaseByTagMock,
          deleteRelease: deleteReleaseMock,
        },
      },
    }
  })
)

vi.mock('@octokit/rest', () => ({ Octokit }))

beforeEach(() => {
  vi.clearAllMocks()
})

test('does not delete release without a tag name', async () => {
  await deleteRelease({ release: null } as ReleasePlan, 'token', repository)

  await deleteRelease(
    { release: { tag: {} } } as ReleasePlan,
    'token',
    repository
  )

  expect(Octokit).not.toHaveBeenCalled()
})

test('deletes release when a valid tag name is present', async () => {
  getReleaseByTagMock.mockResolvedValueOnce({ data: { id: 42 } })
  deleteReleaseMock.mockResolvedValueOnce(undefined)

  await deleteRelease(
    { release: { tag: { name: 'v1.2.3' } } } as ReleasePlan,
    'mock-token',
    repository
  )

  expect(Octokit).toHaveBeenCalledTimes(1)
  expect(Octokit).toHaveBeenCalledWith(
    expect.objectContaining({ auth: 'mock-token' })
  )

  expect(getReleaseByTagMock).toHaveBeenCalledTimes(1)
  expect(getReleaseByTagMock).toHaveBeenCalledWith({
    owner: 'mock-owner',
    repo: 'mock-repo',
    tag: 'v1.2.3',
  })

  expect(deleteReleaseMock).toHaveBeenCalledTimes(1)
  expect(deleteReleaseMock).toHaveBeenCalledWith({
    owner: 'mock-owner',
    repo: 'mock-repo',
    release_id: 42,
  })
})

test('resolves gracefully when github returns a 404 status', async () => {
  getReleaseByTagMock.mockRejectedValueOnce({ status: 404 })

  await expect(
    deleteRelease(
      { release: { tag: { name: 'v1.2.3' } } } as ReleasePlan,
      'token',
      repository
    )
  ).resolves.not.toThrow()

  expect(deleteReleaseMock).not.toHaveBeenCalled()
})

test('rethrows non-404 network errors', async () => {
  getReleaseByTagMock.mockRejectedValueOnce({
    status: 500,
    message: 'Internal Server Error',
  })

  await expect(
    deleteRelease(
      { release: { tag: { name: 'v1.2.3' } } } as ReleasePlan,
      'token',
      repository
    )
  ).rejects.toThrow('Internal Server Error')
})
