// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isRepositoryPublic } from '@reelout/gitlab'
import { beforeEach, expect, test, vi } from 'vitest'
import { createMockRepository } from '../../../test/mock/context'

const showRepoMock = vi.hoisted(() => vi.fn())

const Gitlab = vi.hoisted(() =>
  vi.fn(function () {
    return { Projects: { show: showRepoMock } }
  })
)

vi.mock('@gitbeaker/rest', () => ({ Gitlab }))

beforeEach(() => {
  vi.clearAllMocks()
})

test('checks repository visibility and returns true if public', async () => {
  showRepoMock.mockResolvedValueOnce({ visibility: 'public' })

  const isPublic = await isRepositoryPublic(
    'mock-token',
    createMockRepository('gitlab')
  )

  expect(isPublic).toBe(true)
  expect(Gitlab).toHaveBeenCalledTimes(1)
  expect(Gitlab).toHaveBeenCalledWith(
    expect.objectContaining({ token: 'mock-token' })
  )
  expect(showRepoMock).toHaveBeenCalledTimes(1)
  expect(showRepoMock).toHaveBeenCalledWith(
    encodeURIComponent('mock-owner/mock-repo')
  )
})

test('checks repository visibility and returns false if private', async () => {
  showRepoMock.mockResolvedValueOnce({ visibility: 'private' })

  const isPublic = await isRepositoryPublic(
    'mock-token',
    createMockRepository('gitlab')
  )

  expect(isPublic).toBe(false)
  expect(Gitlab).toHaveBeenCalledTimes(1)
  expect(Gitlab).toHaveBeenCalledWith(
    expect.objectContaining({ token: 'mock-token' })
  )
  expect(showRepoMock).toHaveBeenCalledTimes(1)
  expect(showRepoMock).toHaveBeenCalledWith(
    encodeURIComponent('mock-owner/mock-repo')
  )
})
