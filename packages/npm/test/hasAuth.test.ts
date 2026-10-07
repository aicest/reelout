// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { Package } from '@reelout/core'
import { hasAuth, type PackageManagerInfo } from '@reelout/npm'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { stringify } from 'yaml'
import { context } from '../../../test/mock/context'
import { HOME_DIR } from '../../../test/mock/env'

const pkg1 = { location: '.' } as Package
const pkg2 = { location: '.', name: '@scope/name' } as Package
const yarn2 = { isYarnBerry: true } as PackageManagerInfo
const NPMJS = 'https://registry.npmjs.org/'
const YARNPKG = 'https://registry.yarnpkg.com/'
const GITHUB = 'https://npm.pkg.github.com/'

test('returns true when NPM_ID_TOKEN environment variable is defined', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.env = { NPM_ID_TOKEN: 'mock-token-value' }

    context.cwd = cwd

    expect(await hasAuth(context, pkg1, {})).toBe(true)
  })
})

test('returns true when GitHub Actions ID token request URL and token environment variables are provided', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.env = {
      ACTIONS_ID_TOKEN_REQUEST_URL: 'https://mock.url',
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'mock-request-token',
    }

    context.cwd = cwd

    expect(await hasAuth(context, pkg1, {})).toBe(true)
  })
})

test('returns false when local .npmrc configuration file is empty for unscoped package', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(npmrc, '')

    expect(await hasAuth(context, pkg1, {})).toBe(false)
  })
})

test('returns true when local .npmrc defines an authentication token for the registry', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(npmrc, '//registry.npmjs.org/:_authToken=${NPM_TOKEN}')

    expect(await hasAuth(context, pkg1, {})).toBe(true)
  })
})

test('returns true when global user .npmrc defines an authentication token for the registry', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(HOME_DIR, '.npmrc')

    await writeFile(npmrc, '//registry.npmjs.org/:_authToken=${NPM_TOKEN}')

    expect(await hasAuth(context, pkg1, {})).toBe(true)
  })
})

test('returns true when local .npmrc contains legacy base64 encoded _auth credentials', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(
      npmrc,
      '//registry.npmjs.org/:_auth=dXNlcm5hbWU6cGFzc3dvcmQ='
    )

    expect(await hasAuth(context, pkg1, {})).toBe(true)
  })
})

test('returns true when global user .npmrc contains legacy base64 encoded _auth credentials', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(HOME_DIR, '.npmrc')

    await writeFile(
      npmrc,
      '//registry.npmjs.org/:_auth=dXNlcm5hbWU6cGFzc3dvcmQ='
    )

    expect(await hasAuth(context, pkg1, {})).toBe(true)
  })
})

test('returns false when local .npmrc defines a registry URL without credentials', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(npmrc, 'registry=https://npm.pkg.github.com/')

    expect(await hasAuth(context, pkg1, {})).toBe(false)
  })
})

test('returns true when local .npmrc defines both a registry URL and its corresponding auth token', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(
      npmrc,
      [
        'registry=https://npm.pkg.github.com/',
        '//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}',
      ].join('\n')
    )

    expect(await hasAuth(context, pkg1, {})).toBe(true)
  })
})

test('returns false when local .npmrc configuration file is empty for scoped package', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(npmrc, '')

    expect(await hasAuth(context, pkg2, {})).toBe(false)
  })
})

test('returns true when evaluating a scoped package against local .npmrc with a default registry auth token', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(npmrc, '//registry.npmjs.org/:_authToken=${NPM_TOKEN}')

    expect(await hasAuth(context, pkg2, {})).toBe(true)
  })
})

test('returns false when evaluating a scoped package against local .npmrc registry URL missing credentials', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(npmrc, 'registry=https://npm.pkg.github.com/')

    expect(await hasAuth(context, pkg2, {})).toBe(false)
  })
})

test('returns true when evaluating a scoped package against local .npmrc registry URL with a matching auth token', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(
      npmrc,
      [
        'registry=https://npm.pkg.github.com/',
        '//npm.pkg.github.com/:_authToken=${NPM_TOKEN}',
      ].join('\n')
    )

    expect(await hasAuth(context, pkg2, {})).toBe(true)
  })
})

test('returns false when scoped package encounters a scope-specific registry mapping lacking an auth token', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(npmrc, '@scope:registry=https://npm.pkg.github.com/')

    expect(await hasAuth(context, pkg2, {})).toBe(false)
  })
})

test('returns true when scoped package scope mapping matches a registry with a valid auth token', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(
      npmrc,
      [
        '@scope:registry=https://npm.pkg.github.com/',
        '//npm.pkg.github.com/:_authToken=${NPM_TOKEN}',
      ].join('\n')
    )

    expect(await hasAuth(context, pkg2, {})).toBe(true)
  })
})

test('returns false when Yarn Berry configuration file is empty for unscoped package', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(yarnrc, '')

    expect(await hasAuth(context, pkg1, yarn2)).toBe(false)
  })
})

test('returns true when Yarn Berry configuration provides a base64 encoded npmAuthIdent', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({ npmAuthIdent: 'dXNlcm5hbWU6cGFzc3dvcmQ=' })
    )

    expect(await hasAuth(context, pkg1, yarn2)).toBe(true)
  })
})

test('returns true when Yarn Berry configuration provides a top-level npmAuthToken', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(yarnrc, stringify({ npmAuthToken: 'mock-npm-token' }))

    expect(await hasAuth(context, pkg1, yarn2)).toBe(true)
  })
})

test('returns true when Yarn Berry configuration provides a registry-specific auth token under npmRegistries', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({
        npmRegistries: { [YARNPKG]: { npmAuthToken: 'mock-npm-token' } },
      })
    )

    expect(await hasAuth(context, pkg1, yarn2)).toBe(true)
  })
})

test('returns false when Yarn Berry configuration defines an npmRegistryServer without an auth token', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(yarnrc, stringify({ npmRegistryServer: GITHUB }))

    expect(await hasAuth(context, pkg1, yarn2)).toBe(false)
  })
})

test('returns true when Yarn Berry configuration defines both an npmRegistryServer and a top-level npmAuthToken', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({ npmRegistryServer: GITHUB, npmAuthToken: 'mock-npm-token' })
    )

    expect(await hasAuth(context, pkg1, yarn2)).toBe(true)
  })
})

test('returns true when Yarn Berry configuration defines an npmRegistryServer with a matching registry-specific token', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({
        npmRegistryServer: GITHUB,
        npmRegistries: { [GITHUB]: { npmAuthToken: 'mock-npm-token' } },
      })
    )

    expect(await hasAuth(context, pkg1, yarn2)).toBe(true)
  })
})

test('returns false when evaluating a scoped package against an empty Yarn Berry configuration file', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(yarnrc, '')

    expect(await hasAuth(context, pkg2, yarn2)).toBe(false)
  })
})

test('returns true when evaluating a scoped package against a Yarn Berry configuration with a global npmAuthIdent', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({ npmAuthIdent: 'dXNlcm5hbWU6cGFzc3dvcmQ=' })
    )

    expect(await hasAuth(context, pkg2, yarn2)).toBe(true)
  })
})

test('returns true when evaluating a scoped package against a Yarn Berry configuration with a top-level npmAuthToken', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(yarnrc, stringify({ npmAuthToken: 'mock-npm-token' }))

    expect(await hasAuth(context, pkg2, yarn2)).toBe(true)
  })
})

test('returns true when evaluating a scoped package against a Yarn Berry configuration with a registry-specific token', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({
        npmRegistries: { [YARNPKG]: { npmAuthToken: 'mock-npm-token' } },
      })
    )

    expect(await hasAuth(context, pkg2, yarn2)).toBe(true)
  })
})

test('returns false when evaluating a scoped package against a scope configuration lacking an auth token', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({
        npmScopes: { scope: { npmRegistryServer: GITHUB } },
      })
    )

    expect(await hasAuth(context, pkg2, yarn2)).toBe(false)
  })
})

test('returns true when evaluating a scoped package against a scope configuration containing both a registry server and an auth token', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({
        npmScopes: {
          scope: {
            npmRegistryServer: GITHUB,
            npmAuthToken: 'mock-npm-token',
          },
        },
      })
    )

    expect(await hasAuth(context, pkg2, yarn2)).toBe(true)
  })
})

test('returns true when a scoped package matches a scope registry server that has a corresponding registry-specific auth token', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({
        npmScopes: { scope: { npmRegistryServer: GITHUB } },
        npmRegistries: { [GITHUB]: { npmAuthToken: 'mock-npm-token' } },
      })
    )

    expect(await hasAuth(context, pkg2, yarn2)).toBe(true)
  })
})

test('returns false when a default registry token is present but the scoped package targets a custom scope registry server', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({
        npmRegistryServer: NPMJS,
        npmAuthToken: 'mock-npm-token',
        npmScopes: { scope: { npmRegistryServer: GITHUB } },
      })
    )

    expect(await hasAuth(context, pkg2, yarn2)).toBe(false)
  })
})

test('returns false when a global top-level token is present but the scoped package resolves to a distinct custom registry server', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({
        npmAuthToken: 'mock-npm-token',
        npmScopes: { scope: { npmRegistryServer: GITHUB } },
      })
    )

    expect(await hasAuth(context, pkg2, yarn2)).toBe(false)
  })
})

test('returns true when a scoped package successfully matches both the custom scope registry server and its top-level auth token', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({
        npmRegistryServer: GITHUB,
        npmAuthToken: 'mock-npm-token',
        npmScopes: { scope: { npmRegistryServer: GITHUB } },
      })
    )

    expect(await hasAuth(context, pkg2, yarn2)).toBe(true)
  })
})
