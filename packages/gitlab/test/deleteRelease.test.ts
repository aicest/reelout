// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleasePlan } from '@reelout/core'
import { deleteRelease } from '@reelout/gitlab'
import { beforeEach, expect, test, vi } from 'vitest'
import { createMockRepository } from '../../../test/mock/context'

const removeReleaseMock = vi.hoisted(() => vi.fn())

const Gitlab = vi.hoisted(() =>
  vi.fn(function () {
    return { ProjectReleases: { remove: removeReleaseMock } }
  })
)

vi.mock('@gitbeaker/rest', () => ({ Gitlab }))

beforeEach(() => {
  vi.clearAllMocks()
})

test('does not delete release without a tag name', async () => {
  await deleteRelease(
    { release: null } as ReleasePlan,
    'token',
    createMockRepository('gitlab')
  )

  await deleteRelease(
    { release: { tag: {} } } as ReleasePlan,
    'token',
    createMockRepository('gitlab')
  )

  expect(Gitlab).not.toHaveBeenCalled()
})

test('deletes release when a valid tag name is present', async () => {
  removeReleaseMock.mockResolvedValueOnce(undefined)

  await deleteRelease(
    { release: { tag: { name: 'v1.2.3' } } } as ReleasePlan,
    'mock-token',
    createMockRepository('gitlab')
  )

  expect(Gitlab).toHaveBeenCalledTimes(1)
  expect(Gitlab).toHaveBeenCalledWith(
    expect.objectContaining({ token: 'mock-token' })
  )

  expect(removeReleaseMock).toHaveBeenCalledTimes(1)
  expect(removeReleaseMock).toHaveBeenCalledWith(
    encodeURIComponent('mock-owner/mock-repo'),
    'v1.2.3'
  )
})

test('resolves gracefully when gitlab returns a 404 status', async () => {
  removeReleaseMock.mockRejectedValueOnce({
    cause: { response: { status: 404 } },
  })

  await expect(
    deleteRelease(
      { release: { tag: { name: 'v1.2.3' } } } as ReleasePlan,
      'token',
      createMockRepository('gitlab')
    )
  ).resolves.not.toThrow()
})

test('rethrows non-404 network errors', async () => {
  const mockError = new Error('Internal Server Error', {
    cause: { response: { status: 500 } },
  })

  removeReleaseMock.mockRejectedValueOnce(mockError)

  await expect(
    deleteRelease(
      { release: { tag: { name: 'v1.2.3' } } } as ReleasePlan,
      'token',
      createMockRepository('gitlab')
    )
  ).rejects.toThrow('Internal Server Error')
})
