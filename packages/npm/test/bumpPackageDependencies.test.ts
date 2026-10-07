// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/fs'

import type { ReleasePlan } from '@reelout/core'
import { buildPackage, bumpPackageDependencies } from '@reelout/npm'
import { vol } from 'memfs'
import { beforeEach, expect, test } from 'vitest'
import { workspace } from '../../../test/mock/context'

beforeEach(() => {
  workspace.entry = '.'
  workspace.members = ['packages/*']
})

test('does early exit and skips modifying package.json when version map is empty', async () => {
  const cwd = '/repo'

  vol.fromJSON({
    '/repo/packages/foo/package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0',
      dependencies: {
        'bar': '^2.0.0',
      },
    }),
  })

  const plans: ReleasePlan[] = [
    {
      package: await buildPackage(cwd, 'packages/foo', workspace),
      history: [],
      release: null,
    },
  ]

  await bumpPackageDependencies(cwd, plans)

  expect(vol.toJSON()).toMatchInlineSnapshot(`
    {
      "/repo/packages/foo/package.json": "{"name":"foo","version":"1.0.0","dependencies":{"bar":"^2.0.0"}}",
    }
  `)
})

test('bumps dependencies based on the version map and updates package.json accordingly', async () => {
  const cwd = '/repo'

  vol.fromJSON({
    '/repo/packages/foo/package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0',
      dependencies: {
        'bar': '^2.0.0',
      },
    }),
    '/repo/packages/bar/package.json': JSON.stringify({
      name: 'bar',
      version: '2.0.0',
      dependencies: {
        'baz': '*',
      },
    }),
  })

  const plans: ReleasePlan[] = [
    {
      package: await buildPackage(cwd, 'packages/foo', workspace),
      history: [],
      release: { type: 'patch', version: '1.0.1' },
    },
    {
      package: await buildPackage(cwd, 'packages/bar', workspace),
      history: [],
      release: null,
    },
  ]

  await bumpPackageDependencies(cwd, plans)

  expect(vol.toJSON()).toMatchInlineSnapshot(`
    {
      "/repo/packages/bar/package.json": "{"name":"bar","version":"2.0.0","dependencies":{"baz":"*"}}",
      "/repo/packages/foo/package.json": "{
      "name": "foo",
      "version": "1.0.1",
      "dependencies": {
        "bar": "^2.0.0"
      }
    }
    ",
    }
  `)
})

test('bumps dependencies and handles non-semver strings correctly', async () => {
  const cwd = '/repo'

  vol.fromJSON({
    '/repo/packages/foo/package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0',
      devDependencies: {
        'bar': '^2.0.0',
        'baz': '~3.0.0',
        'unknown': '^9.0.0',
      },
      peerDependencies: {
        'bar': '2.0.0',
        'baz': 'workspace:^3.0.0',
      },
    }),
    '/repo/packages/bar/package.json': JSON.stringify({
      name: 'bar',
      version: '2.0.0',
      dependencies: {
        'baz': '*',
      },
    }),
    '/repo/packages/baz/package.json': JSON.stringify({
      name: 'baz',
      version: '3.0.0',
    }),
    '/repo/packages/qux/package.json': JSON.stringify({
      name: 'qux',
      version: '4.0.0',
      dependencies: {
        'bar': '^2.0.0',
        'baz': '~3.0.0',
      },
    }),
  })

  const plans: ReleasePlan[] = [
    {
      package: await buildPackage(cwd, 'packages/foo', workspace),
      history: [],
      release: { type: 'patch', version: '1.0.1' },
    },
    {
      package: await buildPackage(cwd, 'packages/bar', workspace),
      history: [],
      release: { type: 'patch', version: '2.0.1' },
    },
    {
      package: await buildPackage(cwd, 'packages/baz', workspace),
      history: [],
      release: { type: 'minor', version: '3.1.0' },
    },
    {
      package: await buildPackage(cwd, 'packages/qux', workspace),
      history: [],
      release: null,
    },
  ]

  await bumpPackageDependencies(cwd, plans)

  expect(vol.toJSON()).toMatchInlineSnapshot(`
    {
      "/repo/packages/bar/package.json": "{
      "name": "bar",
      "version": "2.0.1",
      "dependencies": {
        "baz": "3.1.0"
      }
    }
    ",
      "/repo/packages/baz/package.json": "{
      "name": "baz",
      "version": "3.1.0"
    }
    ",
      "/repo/packages/foo/package.json": "{
      "name": "foo",
      "version": "1.0.1",
      "devDependencies": {
        "bar": "^2.0.1",
        "baz": "~3.1.0",
        "unknown": "^9.0.0"
      },
      "peerDependencies": {
        "bar": "2.0.1",
        "baz": "workspace:^3.0.0"
      }
    }
    ",
      "/repo/packages/qux/package.json": "{
      "name": "qux",
      "version": "4.0.0",
      "dependencies": {
        "bar": "^2.0.1",
        "baz": "~3.1.0"
      }
    }
    ",
    }
  `)
})
