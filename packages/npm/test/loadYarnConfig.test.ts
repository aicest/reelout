// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { loadYarnConfig } from '@reelout/npm'
import { folderUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test, vi } from 'vitest'
import { stringify } from 'yaml'
import { HOME_DIR } from '../../../test/mock/env'

test('resolves merged Yarn config from project and user sources', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    using _ = vi
      .spyOn(folderUtils, 'getHomeFolder')
      .mockReturnValue(npath.toPortablePath(HOME_DIR))

    const yarnrc1 = path.join(HOME_DIR, '.yarnrc.yml')
    const yarnrc2 = path.join(cwd, '.yarnrc.yml')

    await writeFile(
      yarnrc1,
      stringify({ npmRegistryServer: 'https://registry.npmmirror.com/' })
    )

    await writeFile(
      yarnrc2,
      stringify({
        npmScopes: {
          'scope': { npmRegistryServer: 'https://npm.pkg.github.com/' },
        },
      })
    )

    const config = await loadYarnConfig(cwd)

    expect(config.get('npmRegistryServer')).toBe(
      'https://registry.npmmirror.com/'
    )
    expect(config.get('npmScopes').get('scope')?.get('npmRegistryServer')).toBe(
      'https://npm.pkg.github.com/'
    )
  })
})
