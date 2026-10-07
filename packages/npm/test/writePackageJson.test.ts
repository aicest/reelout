// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/fs'

import { writePackageJson } from '@reelout/npm'
import { vol } from 'memfs'
import { expect, test } from 'vitest'

test('writes package.json with sorted keys', async () => {
  await writePackageJson('/repo', {
    version: '1.0.0',
    name: 'foo',
    scripts: { b: 'b', a: 'a' },
    devDependencies: { b: '^1.0.0', a: '^2.0.0' },
  })

  expect(vol.toJSON()).toEqual({
    '/repo/package.json': `${JSON.stringify(
      {
        name: 'foo',
        version: '1.0.0',
        scripts: { a: 'a', b: 'b' },
        devDependencies: { a: '^2.0.0', b: '^1.0.0' },
      },
      null,
      2
    )}\n`,
  })
})
