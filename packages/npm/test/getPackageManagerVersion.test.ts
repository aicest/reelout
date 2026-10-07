// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/corepack'

import { execCommand, type ExecCommandOptions } from '@reelout/core'
import {
  getPackageManagerVersion,
  readPackageJson,
  writePackageJson,
} from '@reelout/npm'
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

test('retrieves npm major version', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await writePackageJson(cwd, {})

    await execCommand('corepack', ['use', 'npm@11.10.1'], options)

    const packageJson = await readPackageJson<{ packageManager?: string }>(cwd)

    expect(packageJson.packageManager).toBe(
      'npm@11.10.1+sha512.c286afb98d8e803150d4afed07d407b14b96f7cf6729fbec29337f879a86c92fb7f8186f5cdfc30364cdcf1e7af496857d3aab113e5b110347c1584593e53582'
    )

    expect(await getPackageManagerVersion(cwd, 'npm')).toBeGreaterThanOrEqual(
      11
    )
  })
}, 60_000)

test('retrieves pnpm major version', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await writePackageJson(cwd, {})

    await execCommand('corepack', ['use', 'pnpm@10.30.1'], options)

    const packageJson = await readPackageJson<{ packageManager?: string }>(cwd)

    expect(packageJson.packageManager).toBe(
      'pnpm@10.30.1+sha512.3590e550d5384caa39bd5c7c739f72270234b2f6059e13018f975c313b1eb9fefcc09714048765d4d9efe961382c312e624572c0420762bdc5d5940cdf9be73a'
    )

    expect(await getPackageManagerVersion(cwd, 'pnpm')).toBe(10)
  })
}, 60_000)

test('retrieves yarn major version', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await writePackageJson(cwd, {})

    await execCommand('corepack', ['use', 'yarn@1.22.22'], options)

    const packageJson = await readPackageJson<{ packageManager?: string }>(cwd)

    expect(packageJson.packageManager).toBe(
      'yarn@1.22.22+sha512.a6b2f7906b721bba3d67d4aff083df04dad64c399707841b7acf00f6b133b7ac24255f2652fa22ae3534329dc6180534e98d17432037ff6fd140556e2bb3137e'
    )

    expect(await getPackageManagerVersion(cwd, 'yarn')).toBe(1)
  })
}, 60_000)

test('retrieves yarn berry major version', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    options.env = { YARN_ENABLE_IMMUTABLE_INSTALLS: 'false' }

    await writePackageJson(cwd, {})

    await execCommand('corepack', ['use', 'yarn@4.12.0'], options)

    const packageJson = await readPackageJson<{ packageManager?: string }>(cwd)

    expect(packageJson.packageManager).toBe(
      'yarn@4.12.0+sha512.f45ab632439a67f8bc759bf32ead036a1f413287b9042726b7cc4818b7b49e14e9423ba49b18f9e06ea4941c1ad062385b1d8760a8d5091a1a31e5f6219afca8'
    )

    expect(await getPackageManagerVersion(cwd, 'yarn')).toBe(4)
  })
}, 60_000)

test('returns undefined for disallowed manager', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await writePackageJson(cwd, {})

    await execCommand('corepack', ['use', 'npm@11.10.1'], options)

    const packageJson = await readPackageJson<{ packageManager?: string }>(cwd)

    expect(packageJson.packageManager).toBe(
      'npm@11.10.1+sha512.c286afb98d8e803150d4afed07d407b14b96f7cf6729fbec29337f879a86c92fb7f8186f5cdfc30364cdcf1e7af496857d3aab113e5b110347c1584593e53582'
    )

    expect(await getPackageManagerVersion(cwd, 'pnpm')).toBe(undefined)

    expect(await getPackageManagerVersion(cwd, 'yarn')).toBe(undefined)
  })
}, 60_000)
