// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/fs'

import { resolvePackageManager } from '@reelout/npm'
import { vol } from 'memfs'
import { expect, test } from 'vitest'

test('detects pnpm from package.json', async () => {
  await vol.fromJSON({
    '/repo/package.json': JSON.stringify({ packageManager: 'pnpm@10.0.0' }),
  })

  const manager = await resolvePackageManager('/repo')

  expect(manager).toBe('pnpm')
})

test('detects yarn from package.json', async () => {
  await vol.fromJSON({
    '/repo/package.json': JSON.stringify({ packageManager: 'yarn@4.0.0' }),
  })

  const manager = await resolvePackageManager('/repo')

  expect(manager).toBe('yarn')
})

test('detects npm from package.json', async () => {
  await vol.fromJSON({
    '/repo/package.json': JSON.stringify({ packageManager: 'npm@11.0.0' }),
  })

  const manager = await resolvePackageManager('/repo')

  expect(manager).toBe('npm')
})

test('detects unknown package manager from package.json', async () => {
  await vol.fromJSON({
    '/repo/package.json': JSON.stringify({ packageManager: 'unknown@1.0.0' }),
  })

  const manager = await resolvePackageManager('/repo')

  expect(manager).toBe('npm')
})

test('detects from lock files', async () => {
  await vol.fromJSON({
    '/repo/package.json': JSON.stringify({}),
    '/repo/pnpm-lock.yaml': '',
  })

  const manager = await resolvePackageManager('/repo')

  expect(manager).toBe('pnpm')
})

test('detects yarn from yarn.lock', async () => {
  await vol.fromJSON({
    '/repo/package.json': JSON.stringify({}),
    '/repo/yarn.lock': '',
  })

  const manager = await resolvePackageManager('/repo')

  expect(manager).toBe('yarn')
})

test('detects npm from package-lock.json', async () => {
  await vol.fromJSON({
    '/repo/package.json': JSON.stringify({}),
    '/repo/package-lock.json': '',
  })

  const manager = await resolvePackageManager('/repo')

  expect(manager).toBe('npm')
})

test('defaults to npm', async () => {
  await vol.fromJSON({
    '/repo/package.json': JSON.stringify({}),
  })

  const manager = await resolvePackageManager('/repo')

  expect(manager).toBe('npm')
})
