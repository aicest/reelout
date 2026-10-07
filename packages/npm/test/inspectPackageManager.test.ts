// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/corepack'

import { execCommand, type ExecCommandOptions } from '@reelout/core'
import { inspectPackageManager, writePackageJson } from '@reelout/npm'
import { temporaryDirectoryTask } from 'tempy'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

let options: ExecCommandOptions

beforeEach(() => {
  options = {
    cwd: '/repo',
    env: undefined,
  }
})

afterEach(() => {
  vi.unstubAllEnvs()
})

test('inspects npm package manager', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await writePackageJson(cwd, {})

    await execCommand('corepack', ['use', 'npm@11.10.1'], options)

    expect(await inspectPackageManager(cwd)).toMatchInlineSnapshot(`
      {
        "isNpm": true,
        "isPnpm": false,
        "isYarn": false,
        "isYarnBerry": false,
        "isYarnClassic": false,
        "name": "npm",
      }
    `)
  })
}, 60_000)

test('inspects pnpm package manager', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await writePackageJson(cwd, {})

    await execCommand('corepack', ['use', 'pnpm@10.30.1'], options)

    expect(await inspectPackageManager(cwd)).toMatchInlineSnapshot(`
      {
        "isNpm": false,
        "isPnpm": true,
        "isYarn": false,
        "isYarnBerry": false,
        "isYarnClassic": false,
        "name": "pnpm",
      }
    `)
  })
}, 60_000)

test('inspects yarn classic package manager', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await writePackageJson(cwd, {})

    await execCommand('corepack', ['use', 'yarn@1.22.22'], options)

    expect(await inspectPackageManager(cwd)).toMatchInlineSnapshot(`
      {
        "isNpm": false,
        "isPnpm": false,
        "isYarn": true,
        "isYarnBerry": false,
        "isYarnClassic": true,
        "name": "yarn",
      }
    `)
  })
}, 60_000)

test('inspects yarn berry package manager', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    options.env = { YARN_ENABLE_IMMUTABLE_INSTALLS: 'false' }

    await writePackageJson(cwd, {})

    await execCommand('corepack', ['use', 'yarn@4.12.0'], options)

    expect(await inspectPackageManager(cwd)).toMatchInlineSnapshot(`
      {
        "isNpm": false,
        "isPnpm": false,
        "isYarn": true,
        "isYarnBerry": true,
        "isYarnClassic": false,
        "name": "yarn",
      }
    `)
  })
}, 60_000)
