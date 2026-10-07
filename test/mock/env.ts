// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { rm } from 'node:fs/promises'
import { temporaryDirectory } from 'tempy'
import { afterEach, beforeEach, vi } from 'vitest'

export let HOME_DIR: string

beforeEach(() => {
  vi.stubEnv('CI', undefined)
  vi.stubEnv('HOME', (HOME_DIR = temporaryDirectory()))
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await rm(HOME_DIR, { recursive: true, force: true })
})
