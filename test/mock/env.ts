// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { rm } from 'node:fs/promises'
import { temporaryDirectory } from 'tempy'
import { afterEach, beforeEach, vi } from 'vitest'

export let HOME_DIR: string

beforeEach(() => {
  vi.stubEnv('ACTIONS_ID_TOKEN_REQUEST_TOKEN', undefined)
  vi.stubEnv('ACTIONS_ID_TOKEN_REQUEST_URL', undefined)
  vi.stubEnv('CI', undefined)
  vi.stubEnv('HOME', (HOME_DIR = temporaryDirectory()))
  vi.stubEnv('NPM_ID_TOKEN', undefined)
  vi.stubEnv('NPM_TOKEN', undefined)
  vi.stubEnv('npm_config_local_prefix', undefined)
  vi.stubEnv('npm_config_registry', undefined)
  vi.stubEnv('npm_config_userconfig', undefined)
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await rm(HOME_DIR, { recursive: true, force: true })
})
