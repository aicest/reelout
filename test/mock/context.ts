// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitRepository, ReleaseContext, Workspace } from '@reelout/core'
import { beforeEach } from 'vitest'

const createMockContext = (): ReleaseContext => ({
  cwd: '/repo',
  env: {},
  today: '2026-01-01',
  repository: null,
  dryRun: false,
})

export const createMockRepository = (
  host: GitRepository['host'] = 'github'
): GitRepository => ({
  host,
  owner: 'mock-owner',
  repo: 'mock-repo',
  url: `https://${host}.com/mock-owner/mock-repo`,
})

export const repository: GitRepository = createMockRepository()

export const context = createMockContext()

export const workspace: Workspace = { entry: '.', members: null }

beforeEach(() => {
  Object.assign(repository, createMockRepository())
  Object.assign(context, createMockContext())
  Object.assign(workspace, { entry: '.', members: null } satisfies Workspace)
})
