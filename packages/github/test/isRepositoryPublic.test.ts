// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isRepositoryPublic } from '@reelout/github'
import { beforeEach, expect, test, vi } from 'vitest'
import { repository } from '../../../test/mock/context'

const getRepoMock = vi.hoisted(() => vi.fn())

const Octokit = vi.hoisted(() =>
  vi.fn(function () {
    return { rest: { repos: { get: getRepoMock } } }
  })
)

vi.mock('@octokit/rest', () => ({ Octokit }))

beforeEach(() => {
  vi.clearAllMocks()
})

test('checks repository visibility and returns true if public', async () => {
  getRepoMock.mockResolvedValueOnce({ data: { visibility: 'public' } })

  const isPublic = await isRepositoryPublic('mock-token', repository)

  expect(isPublic).toBe(true)
  expect(Octokit).toHaveBeenCalledTimes(1)
  expect(Octokit).toHaveBeenCalledWith(
    expect.objectContaining({ auth: 'mock-token' })
  )
  expect(getRepoMock).toHaveBeenCalledTimes(1)
  expect(getRepoMock).toHaveBeenCalledWith({
    owner: 'mock-owner',
    repo: 'mock-repo',
  })
})

test('checks repository visibility and returns false if private', async () => {
  getRepoMock.mockResolvedValueOnce({ data: { visibility: 'private' } })

  const isPublic = await isRepositoryPublic('mock-token', repository)

  expect(isPublic).toBe(false)
  expect(Octokit).toHaveBeenCalledTimes(1)
  expect(Octokit).toHaveBeenCalledWith(
    expect.objectContaining({ auth: 'mock-token' })
  )
  expect(getRepoMock).toHaveBeenCalledTimes(1)
  expect(getRepoMock).toHaveBeenCalledWith({
    owner: 'mock-owner',
    repo: 'mock-repo',
  })
})
