// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitRepository, ReleaseContext, Workspace } from '@reelout/core'
import { normalizeCommitFilter } from '@reelout/core/config/normalizeCommitFilter'
import { createConsola, LogLevels } from 'consola/core'
import { Writable } from 'node:stream'
import { beforeEach, vi, type Mock } from 'vitest'

const createMockContext = (): ReleaseContext => ({
  cwd: '/repo',
  env: {},
  today: '2026-01-01',
  signal: undefined,
  stdout: new Writable(),
  stderr: new Writable(),
  logger: createMockLogger(),
  repository: null,
  classifier: normalizeCommitFilter({
    major: [],
    minor: ['feat'],
    patch: ['fix', 'perf', 'revert'],
  }),
  type: 'auto',
  allowEmpty: false,
  versionQualifier: undefined,
  dryRun: false,
  packages: [],
  plans: [],
  status: null,
  phase: null,
  error: null,
})

export const logger: Mock = vi.fn()

export const createMockLogger = (_logger = logger) => {
  return createConsola({
    mockFn: (type) => (LogLevels[type] > 3 ? () => {} : _logger),
  })
}

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
  logger.mockClear()
  Object.assign(repository, createMockRepository())
  Object.assign(context, createMockContext())
  Object.assign(workspace, { entry: '.', members: null } satisfies Workspace)
})
