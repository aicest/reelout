// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/fs'

import { resolveGitRepositoryFromPackage } from '@reelout/npm'
import { vol } from 'memfs'
import { expect, test } from 'vitest'

test('returns null for missing or invalid package.json', async () => {
  expect(await resolveGitRepositoryFromPackage('/repo')).toBeNull()

  vol.fromJSON({
    '/repo/package.json': JSON.stringify({ repository: null }),
  })

  expect(await resolveGitRepositoryFromPackage('/repo')).toBeNull()

  vol.fromJSON({
    '/repo/package.json': JSON.stringify({ repository: {} }),
  })

  expect(await resolveGitRepositoryFromPackage('/repo')).toBeNull()

  vol.fromJSON({
    '/repo/package.json': JSON.stringify({
      repository: 'https://example.com/',
    }),
  })

  expect(await resolveGitRepositoryFromPackage('/repo')).toBeNull()
})

test('parses repository URL in HTTPS format', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({
      repository: { type: 'git', url: 'git+https://github.com/npm/cli.git' },
    }),
  })

  expect(await resolveGitRepositoryFromPackage('/repo')).toMatchInlineSnapshot(`
    {
      "host": "github",
      "owner": "npm",
      "repo": "cli",
      "url": "https://github.com/npm/cli",
    }
  `)
})

test('parses repository URL in SSH format', async () => {
  vol.fromJSON({
    '/repo/package.json': JSON.stringify({
      repository: 'git+ssh://git@github.com:npm/cli.git',
    }),
  })

  expect(await resolveGitRepositoryFromPackage('/repo')).toMatchInlineSnapshot(`
    {
      "host": "github",
      "owner": "npm",
      "repo": "cli",
      "url": "https://github.com/npm/cli",
    }
  `)
})

test('parses repository URL in shorthand format', async () => {
  for (const [repository, host] of [
    ['user/repo', 'github'],
    ['github:user/repo', 'github'],
    ['gitlab:user/repo', 'gitlab'],
    ['bitbucket:user/repo', 'bitbucket'],
  ] as const) {
    vol.fromJSON({
      '/repo/package.json': JSON.stringify({ repository }),
    })

    expect(await resolveGitRepositoryFromPackage('/repo')).toEqual({
      host,
      owner: 'user',
      repo: 'repo',
      url: `https://${host}.${host === 'bitbucket' ? 'org' : 'com'}/user/repo`,
    })
  }
})
