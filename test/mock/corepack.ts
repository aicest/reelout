// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/* istanbul ignore file */
import { execCommand } from '@reelout/core'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectory } from 'tempy'
import { afterAll, afterEach, beforeEach, vi } from 'vitest'

export const SHIMS_DIR = temporaryDirectory()

// Host images may ship a global Yarn Classic that shadows the release pinned in
// `package.json`, so `npm`, `pnpm`, and `yarn` are resolved through Corepack
// shims prepended to `PATH` instead of whatever happens to be installed.
const shimsReady = execCommand(
  'corepack',
  ['enable', '--install-directory', SHIMS_DIR, 'npm', 'pnpm', 'yarn'],
  { cwd: SHIMS_DIR }
).catch(() => undefined)

const PATH_WITH_SHIMS = [SHIMS_DIR, process.env.PATH]
  .filter(Boolean)
  .join(path.delimiter)

beforeEach(async () => {
  await shimsReady

  vi.stubEnv('PATH', PATH_WITH_SHIMS)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

afterAll(async () => {
  await rm(SHIMS_DIR, { recursive: true, force: true })
})
