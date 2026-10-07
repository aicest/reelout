// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/fs'

import type { Workspace } from '@reelout/core'
import { loadPackages } from '@reelout/npm'
import { vol } from 'memfs'
import { beforeEach, expect, test } from 'vitest'

let workspace: Workspace

beforeEach(() => {
  workspace = { entry: '.', members: null }
})

test('rejects missing root package.json', async () => {
  vol.fromJSON({})

  expect(await loadPackages('/repo', workspace)).toMatchInlineSnapshot(`
    [
      {
        "reason": [Error: JSON file at "[1m/repo/package.json[22m" could not be read.],
        "status": "rejected",
      },
    ]
  `)
})

test('returns only the root package when no workspaces are defined', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({ version: '0.0.0' }),
  })

  expect(await loadPackages('/repo', workspace)).toMatchInlineSnapshot(`
    [
      {
        "status": "fulfilled",
        "value": {
          "dependencies": [],
          "entry": true,
          "files": "**/*",
          "location": ".",
          "name": undefined,
          "private": undefined,
          "root": true,
          "version": "0.0.0",
        },
      },
    ]
  `)
})

test('returns root package followed by workspace packages sorted by directory', async () => {
  workspace.entry = '.'
  workspace.members = ['packages/*']

  vol.fromJSON({
    '/repo/packages/pkg3/package.json': JSON.stringify({
      name: 'pkg3',
      version: '3.0.0',
    }),
    '/repo/packages/pkg1/package.json': JSON.stringify({
      name: 'pkg1',
      version: '1.0.0',
    }),
    '/repo/package.json': JSON.stringify({
      version: '0.0.0',
      workspaces: ['packages/*'],
    }),
    '/repo/packages/pkg2/package.json': JSON.stringify({
      name: 'pkg2',
      version: '2.0.0',
    }),
  })

  expect(await loadPackages('/repo', workspace)).toMatchInlineSnapshot(`
    [
      {
        "status": "fulfilled",
        "value": {
          "dependencies": [],
          "entry": true,
          "files": "!{package-lock.json,npm-shrinkwrap.json,pnpm-lock.yaml,yarn.lock,packages/*/**/*}",
          "location": ".",
          "name": undefined,
          "private": undefined,
          "root": true,
          "version": "0.0.0",
        },
      },
      {
        "status": "fulfilled",
        "value": {
          "dependencies": [],
          "entry": false,
          "files": "packages/pkg1/**/*",
          "location": "packages/pkg1",
          "name": "pkg1",
          "private": undefined,
          "root": false,
          "version": "1.0.0",
        },
      },
      {
        "status": "fulfilled",
        "value": {
          "dependencies": [],
          "entry": false,
          "files": "packages/pkg2/**/*",
          "location": "packages/pkg2",
          "name": "pkg2",
          "private": undefined,
          "root": false,
          "version": "2.0.0",
        },
      },
      {
        "status": "fulfilled",
        "value": {
          "dependencies": [],
          "entry": false,
          "files": "packages/pkg3/**/*",
          "location": "packages/pkg3",
          "name": "pkg3",
          "private": undefined,
          "root": false,
          "version": "3.0.0",
        },
      },
    ]
  `)
})

test('skips invalid workspace packages', async () => {
  workspace.entry = '.'
  workspace.members = ['packages/*']

  vol.fromJSON({
    '/repo/package.json': JSON.stringify({ workspaces: ['packages/*'] }),
    '/repo/packages/pkg1/package.json': JSON.stringify({ version: '1.0.0' }),
    '/repo/packages/pkg2/package.json': JSON.stringify({}),
    '/repo/packages/pkg3/package.json': JSON.stringify(null),
  })

  expect(await loadPackages('/repo', workspace)).toMatchInlineSnapshot(`
    [
      {
        "reason": [Error: Package version "undefined" in "." is not a valid semantic version.],
        "status": "rejected",
      },
      {
        "status": "fulfilled",
        "value": {
          "dependencies": [],
          "entry": false,
          "files": "packages/pkg1/**/*",
          "location": "packages/pkg1",
          "name": undefined,
          "private": undefined,
          "root": false,
          "version": "1.0.0",
        },
      },
      {
        "reason": [Error: Package version "undefined" in "packages/pkg2" is not a valid semantic version.],
        "status": "rejected",
      },
      {
        "reason": [Error: JSON file at "[1m/repo/packages/pkg3/package.json[22m" does not contain a valid object.],
        "status": "rejected",
      },
    ]
  `)
})
