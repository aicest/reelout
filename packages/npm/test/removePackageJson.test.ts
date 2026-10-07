// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/fs'

import { removePackageJson } from '@reelout/npm'
import { vol } from 'memfs'
import { expect, test } from 'vitest'

test('resolves without throwing when package.json or the directory does not exist', async () => {
  await expect(removePackageJson('/repo')).resolves.not.toThrow()
  await expect(removePackageJson('/repo/packages/foo')).resolves.not.toThrow()
})

test('deletes package.json when it exists in the specified directory', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({}),
    '/repo/packages/foo/package.json': JSON.stringify({}),
  })

  await removePackageJson('/repo')
  await removePackageJson('/repo/packages/foo')

  expect(vol.toJSON()).toMatchInlineSnapshot(`
    {
      "/repo/packages/foo": null,
    }
  `)
})
