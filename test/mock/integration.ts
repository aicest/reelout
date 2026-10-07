// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../mock/env'
import '../mock/git'
import '../mock/util'

import { beforeAll, beforeEach, vi } from 'vitest'

vi.mock(import('@reelout/npm/publishPackage'), async () => ({
  publishPackage: vi.fn(),
}))

vi.mock(import('@reelout/github/createRelease'), async () => ({
  createRelease: vi.fn(),
}))

vi.mock(import('@reelout/github/isRepositoryPublic'), async () => ({
  isRepositoryPublic: vi.fn(async () => true),
}))

beforeAll(() => {
  vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
})

beforeEach(() => {
  vi.resetAllMocks()
  vi.unstubAllEnvs()
  vi.stubEnv('GITHUB_TOKEN', 'mock-github-token')
  vi.stubEnv('NPM_TOKEN', 'mock-npm-token')
})
