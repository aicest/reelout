// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/fs'

import { updatePackageJson } from '@reelout/npm'
import { vol } from 'memfs'
import { expect, test } from 'vitest'

test('does not modify package.json when no release', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({
      name: 'pkg',
      version: '0.1.0',
    }),
  })

  await updatePackageJson('/repo', {})

  expect(vol.toJSON()).toMatchInlineSnapshot(`
    {
      "/repo/package.json": "{
      "name": "pkg",
      "version": "0.1.0"
    }
    ",
    }
  `)
})

test('updates version when release present', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({
      name: 'pkg',
      version: '0.1.0',
    }),
  })

  await updatePackageJson('/repo', {
    version: '0.2.0',
  })

  expect(vol.toJSON()).toMatchInlineSnapshot(`
    {
      "/repo/package.json": "{
      "name": "pkg",
      "version": "0.2.0"
    }
    ",
    }
  `)
})

test('deletes properties set to undefined while preserving empty string values', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({
      name: 'pkg',
      version: '0.1.0',
    }),
  })

  await updatePackageJson('/repo', {
    name: '',
    version: undefined,
  })

  expect(vol.toJSON()).toMatchInlineSnapshot(`
    {
      "/repo/package.json": "{
      "name": ""
    }
    ",
    }
  `)
})

test('merges and sorts dependencies while preserving existing properties', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({
      name: 'pkg',
      version: '0.1.0',
      dependencies: {
        foo: '^0.0.0',
      },
    }),
  })

  await updatePackageJson('/repo', {
    dependencies: {
      foo: '^1.0.0',
      bar: '^2.0.0',
    },
  })

  expect(vol.toJSON()).toMatchInlineSnapshot(`
    {
      "/repo/package.json": "{
      "name": "pkg",
      "version": "0.1.0",
      "dependencies": {
        "bar": "^2.0.0",
        "foo": "^1.0.0"
      }
    }
    ",
    }
  `)
})
