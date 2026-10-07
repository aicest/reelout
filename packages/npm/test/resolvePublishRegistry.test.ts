// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { Package } from '@reelout/core'
import {
  resolvePublishRegistry,
  writePackageJson,
  type PackageManagerInfo,
} from '@reelout/npm'
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
const NPMMIRROR = 'https://registry.npmmirror.com/'

test('returns default npmjs registry when no configuration exists', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    expect(await resolvePublishRegistry(context, pkg1, {})).toBe(NPMJS)
  })
})

test('returns registry defined in package.json publishConfig', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    await writePackageJson(cwd, { publishConfig: { registry: GITHUB } })

    expect(await resolvePublishRegistry(context, pkg1, {})).toBe(GITHUB)
  })
})

test('falls back to default npmjs registry when package.json publishConfig registry is empty or invalid', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    await writePackageJson(cwd, {})

    expect(await resolvePublishRegistry(context, pkg1, {})).toBe(NPMJS)

    await writePackageJson(cwd, { publishConfig: { registry: 'invalid' } })

    expect(await resolvePublishRegistry(context, pkg1, {})).toBe(NPMJS)
  })
})

test('returns registry defined in local project .npmrc', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(npmrc, `registry=${GITHUB}`)

    expect(await resolvePublishRegistry(context, pkg1, {})).toBe(GITHUB)
  })
})

test('returns registry defined in user home .npmrc when local .npmrc is absent', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(HOME_DIR, '.npmrc')

    await writeFile(npmrc, `registry=${GITHUB}`)

    expect(await resolvePublishRegistry(context, pkg1, {})).toBe(GITHUB)
  })
})

test('falls back to default npmjs registry when .npmrc registry value is empty or invalid', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(npmrc, 'registry=')

    expect(await resolvePublishRegistry(context, pkg1, {})).toBe(NPMJS)

    await writeFile(npmrc, 'registry=invalid')

    expect(await resolvePublishRegistry(context, pkg1, {})).toBe(NPMJS)
  })
})

test('returns scope-specific registry from .npmrc when package includes a scope', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(npmrc, `registry=${GITHUB}\n@scope:registry=${NPMMIRROR}`)

    expect(await resolvePublishRegistry(context, pkg2, {})).toBe(NPMMIRROR)
  })
})

test('falls back to global .npmrc registry when package scope lacks explicit configuration', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(npmrc, `registry=${GITHUB}`)

    expect(await resolvePublishRegistry(context, pkg2, {})).toBe(GITHUB)
  })
})

test('falls back to global .npmrc registry when scope-specific registry is empty or invalid', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(npmrc, `registry=${GITHUB}\n@scope:registry=`)

    expect(await resolvePublishRegistry(context, pkg2, {})).toBe(GITHUB)

    await writeFile(npmrc, `registry=${GITHUB}\n@scope:registry=invalid`)

    expect(await resolvePublishRegistry(context, pkg2, {})).toBe(GITHUB)
  })
})

test('returns default yarn registry under Yarn Berry mode when no custom yarn config is provided', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    expect(await resolvePublishRegistry(context, pkg1, yarn2)).toBe(YARNPKG)
    expect(await resolvePublishRegistry(context, pkg2, yarn2)).toBe(YARNPKG)
  })
})

test('returns npmRegistryServer from .yarnrc.yml under Yarn Berry mode', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(yarnrc, stringify({ npmRegistryServer: GITHUB }))

    expect(await resolvePublishRegistry(context, pkg1, yarn2)).toBe(GITHUB)
  })
})

test('prioritizes npmPublishRegistry over npmRegistryServer under Yarn Berry mode', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({ npmRegistryServer: GITHUB, npmPublishRegistry: NPMMIRROR })
    )

    expect(await resolvePublishRegistry(context, pkg1, yarn2)).toBe(NPMMIRROR)
  })
})

test('falls back to default yarn registry under Yarn Berry mode when npmRegistryServer is empty or invalid', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(yarnrc, stringify({ npmRegistryServer: '' }))

    expect(await resolvePublishRegistry(context, pkg1, yarn2)).toBe(YARNPKG)

    await writeFile(yarnrc, stringify({ npmRegistryServer: 'invalid' }))

    expect(await resolvePublishRegistry(context, pkg1, yarn2)).toBe(YARNPKG)
  })
})

test('falls back to npmRegistryServer under Yarn Berry mode when npmPublishRegistry is empty or invalid', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({ npmRegistryServer: GITHUB, npmPublishRegistry: '' })
    )

    expect(await resolvePublishRegistry(context, pkg1, yarn2)).toBe(GITHUB)

    await writeFile(
      yarnrc,
      stringify({ npmRegistryServer: GITHUB, npmPublishRegistry: 'invalid' })
    )

    expect(await resolvePublishRegistry(context, pkg1, yarn2)).toBe(GITHUB)
  })
})

test('returns global npmRegistryServer under Yarn Berry mode for scoped package when scope is unconfigured', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(yarnrc, stringify({ npmRegistryServer: GITHUB }))

    expect(await resolvePublishRegistry(context, pkg2, yarn2)).toBe(GITHUB)
  })
})

test('returns scoped npmRegistryServer from .yarnrc.yml under Yarn Berry mode when scope is defined', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({ npmScopes: { scope: { npmRegistryServer: GITHUB } } })
    )

    expect(await resolvePublishRegistry(context, pkg2, yarn2)).toBe(GITHUB)
  })
})

test('prioritizes scoped npmRegistryServer over global npmRegistryServer under Yarn Berry mode', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({
        npmRegistryServer: NPMMIRROR,
        npmScopes: { scope: { npmRegistryServer: GITHUB } },
      })
    )

    expect(await resolvePublishRegistry(context, pkg2, yarn2)).toBe(GITHUB)
  })
})

test('prioritizes scoped npmRegistryServer over global npmPublishRegistry under Yarn Berry mode', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({
        npmPublishRegistry: NPMMIRROR,
        npmScopes: { scope: { npmRegistryServer: GITHUB } },
      })
    )

    expect(await resolvePublishRegistry(context, pkg2, yarn2)).toBe(GITHUB)
  })
})

test('prioritizes scoped npmPublishRegistry over scoped npmRegistryServer under Yarn Berry mode', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({
        npmScopes: {
          scope: { npmRegistryServer: GITHUB, npmPublishRegistry: NPMMIRROR },
        },
      })
    )

    expect(await resolvePublishRegistry(context, pkg2, yarn2)).toBe(NPMMIRROR)
  })
})

test('falls back to scoped npmRegistryServer under Yarn Berry mode when scoped npmPublishRegistry is empty or invalid', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({
        npmScopes: {
          scope: { npmRegistryServer: GITHUB, npmPublishRegistry: '' },
        },
      })
    )

    expect(await resolvePublishRegistry(context, pkg2, yarn2)).toBe(GITHUB)

    await writeFile(
      yarnrc,
      stringify({
        npmScopes: {
          scope: { npmRegistryServer: GITHUB, npmPublishRegistry: 'invalid' },
        },
      })
    )

    expect(await resolvePublishRegistry(context, pkg2, yarn2)).toBe(GITHUB)
  })
})

test('falls back to global npmRegistryServer under Yarn Berry mode when scoped npmRegistryServer is empty or invalid', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    const yarnrc = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc,
      stringify({
        npmRegistryServer: GITHUB,
        npmScopes: { scope: { npmRegistryServer: '' } },
      })
    )

    expect(await resolvePublishRegistry(context, pkg2, yarn2)).toBe(GITHUB)

    await writeFile(
      yarnrc,
      stringify({
        npmRegistryServer: GITHUB,
        npmScopes: { scope: { npmRegistryServer: 'invalid' } },
      })
    )

    expect(await resolvePublishRegistry(context, pkg2, yarn2)).toBe(GITHUB)
  })
})
