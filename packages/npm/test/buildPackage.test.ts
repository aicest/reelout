// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/fs'

import type { Workspace } from '@reelout/core'
import { buildPackage } from '@reelout/npm'
import { vol } from 'memfs'
import { beforeEach, expect, test, vi } from 'vitest'

let workspace: Workspace

beforeEach(() => {
  workspace = { entry: '.', members: null }
})

test('throws Error when package version is not valid semver', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({ version: 'invalid' }),
    '/repo/packages/foo/package.json': JSON.stringify({}),
  })

  await expect(buildPackage('/repo', '.', workspace)).rejects.toThrow(
    'Package version "invalid" in "." is not a valid semantic version.'
  )

  await expect(
    buildPackage('/repo', 'packages/foo', workspace)
  ).rejects.toThrow(
    'Package version "undefined" in "packages/foo" is not a valid semantic version.'
  )
})

test('returns package metadata when package.json contains valid version', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({ version: '1.0.0' }),
  })

  expect(await buildPackage('/repo', '.', workspace)).toMatchInlineSnapshot(`
    {
      "dependencies": [],
      "entry": true,
      "files": "**/*",
      "location": ".",
      "name": undefined,
      "private": undefined,
      "root": true,
      "version": "1.0.0",
    }
  `)
})

test('combines and sorts package dependencies when manifest includes dependency fields', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({
      name: 'foobar',
      version: '1.2.3',
      private: true,
      dependencies: { foo: '^1.0.0' },
      devDependencies: { bar: '^2.0.0' },
      peerDependencies: { baz: '^3.0.0' },
      optionalDependencies: { qux: '^4.0.0' },
    }),
  })

  expect(await buildPackage('/repo', '.', workspace)).toMatchInlineSnapshot(`
    {
      "dependencies": [
        "bar",
        "foo",
        "qux",
      ],
      "entry": true,
      "files": "**/*",
      "location": ".",
      "name": "foobar",
      "private": true,
      "root": true,
      "version": "1.2.3",
    }
  `)
})

test('marks package as entry when package directory matches workspace entry', async () => {
  using _entry = vi
    .spyOn(workspace, 'entry', 'get')
    .mockReturnValue('packages/foo')
  using _workspace = vi
    .spyOn(workspace, 'members', 'get')
    .mockReturnValue(['packages/*'])

  vol.fromJSON({
    '/repo/package.json': JSON.stringify({ version: '1.0.0' }),
    '/repo/packages/foo/package.json': JSON.stringify({ version: '1.0.0' }),
  })

  const cwd = '/repo'
  const pkgDir0 = '.'
  const pkgDir1 = 'packages/foo'

  expect(await buildPackage(cwd, pkgDir0, workspace)).toMatchInlineSnapshot(`
    {
      "dependencies": [],
      "entry": false,
      "files": "!{package-lock.json,npm-shrinkwrap.json,pnpm-lock.yaml,yarn.lock,packages/*/**/*}",
      "location": ".",
      "name": undefined,
      "private": undefined,
      "root": true,
      "version": "1.0.0",
    }
  `)

  expect(await buildPackage(cwd, pkgDir1, workspace)).toMatchInlineSnapshot(`
    {
      "dependencies": [],
      "entry": true,
      "files": "packages/foo/**/*",
      "location": "packages/foo",
      "name": undefined,
      "private": undefined,
      "root": false,
      "version": "1.0.0",
    }
  `)
})

test('computes file exclusion patterns when package is at workspace entry', async () => {
  using _workspace = vi
    .spyOn(workspace, 'members', 'get')
    .mockReturnValue(['packages/*'])

  vol.fromJSON({
    '/repo/package.json': JSON.stringify({ version: '1.0.0' }),
    '/repo/packages/foo/package.json': JSON.stringify({ version: '1.0.0' }),
  })

  const cwd = '/repo'
  const pkgDir0 = '.'
  const pkgDir1 = 'packages/foo'

  expect(await buildPackage(cwd, pkgDir0, workspace)).toMatchInlineSnapshot(`
    {
      "dependencies": [],
      "entry": true,
      "files": "!{package-lock.json,npm-shrinkwrap.json,pnpm-lock.yaml,yarn.lock,packages/*/**/*}",
      "location": ".",
      "name": undefined,
      "private": undefined,
      "root": true,
      "version": "1.0.0",
    }
  `)

  expect(await buildPackage(cwd, pkgDir1, workspace)).toMatchInlineSnapshot(`
    {
      "dependencies": [],
      "entry": false,
      "files": "packages/foo/**/*",
      "location": "packages/foo",
      "name": undefined,
      "private": undefined,
      "root": false,
      "version": "1.0.0",
    }
  `)
})
