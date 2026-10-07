// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/env'
import '../../../test/mock/fs'

import {
  executeReleaseWorkflow,
  type GitCommit,
  type Package,
  type ReleasePlan,
} from '@reelout/core'
import plugin, {
  buildPackage,
  loadPackages,
  PLUGIN_NAME,
  writePackageJson,
} from '@reelout/npm'
import type { Hosts } from 'hosted-git-info'
import { vol } from 'memfs'
import { beforeEach, expect, test, vi } from 'vitest'
import {
  context,
  createMockRepository,
  logger,
  repository,
  workspace,
} from '../../../test/mock/context'

const prepareAuth = vi.hoisted(() =>
  vi.fn(async (...args: unknown[]): Promise<undefined> => {})
)

const publishPackage = vi.hoisted(() =>
  vi.fn(async (cwd: string, ...args: unknown[]) => await prepareAuth({ cwd }))
)

const isGitHubRepositoryPublic = vi.hoisted(() => vi.fn())

const isGitLabRepositoryPublic = vi.hoisted(() => vi.fn())

vi.mock(import('@reelout/npm/prepareAuth'), () => ({
  prepareAuth,
}))

vi.mock(import('@reelout/npm/publishPackage'), () => ({
  publishPackage: (context, ...args) => publishPackage(context.cwd, ...args),
}))

vi.mock(import('@reelout/npm/loadPackages'), async (importActual) => ({
  loadPackages: vi.fn((await importActual()).loadPackages),
}))

vi.mock(import('@reelout/github/isRepositoryPublic'), () => ({
  isRepositoryPublic: isGitHubRepositoryPublic,
}))

vi.mock(import('@reelout/gitlab/isRepositoryPublic'), () => ({
  isRepositoryPublic: isGitLabRepositoryPublic,
}))

beforeEach(() => {
  vi.resetAllMocks()
})

test('preserves null repository context when omitted from package manifest and git remote', async () => {
  await writePackageJson(context.cwd, {})

  context.repository = null

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.repository).toBe(null)
})

test('overrides repository context with manifest configuration when package manifest defines repository', async () => {
  await writePackageJson(context.cwd, {
    repository: {
      type: 'git',
      url: 'https://github.com/user/repo2.git',
    },
  })

  context.repository = createMockRepository('gitlab')

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.repository).toEqual({
    host: 'github',
    owner: 'user',
    repo: 'repo2',
    url: 'https://github.com/user/repo2',
  })
})

test('resolves workspace members when defined in package.json or pnpm-workspace.yaml', async () => {
  const plugins = [plugin({ workspace })]

  vi.mocked(loadPackages).mockClear()

  await executeReleaseWorkflow(context, plugins)

  expect(vi.mocked(loadPackages).mock.calls).toMatchInlineSnapshot(`
    [
      [
        "/repo",
        {
          "entry": ".",
          "members": null,
        },
      ],
    ]
  `)

  vol.fromJSON({
    '/repo/package.json': JSON.stringify({ workspaces: ['packages/*'] }),
  })

  vi.mocked(loadPackages).mockClear()

  await executeReleaseWorkflow(context, plugins)

  expect(vi.mocked(loadPackages).mock.calls).toMatchInlineSnapshot(`
    [
      [
        "/repo",
        {
          "entry": ".",
          "members": [
            "packages/*",
          ],
        },
      ],
    ]
  `)

  vol.fromJSON({
    '/repo/pnpm-workspace.yaml': 'packages:\n  - "apps/*"\n  - "packages/*"',
  })

  vi.mocked(loadPackages).mockClear()

  await executeReleaseWorkflow(context, plugins)

  expect(vi.mocked(loadPackages).mock.calls).toMatchInlineSnapshot(`
    [
      [
        "/repo",
        {
          "entry": ".",
          "members": [
            "apps/*",
            "packages/*",
          ],
        },
      ],
    ]
  `)
})

test('preserves configured workspace members when workspace options are explicitly provided', async () => {
  workspace.entry = '.'
  workspace.members = ['apps/*']

  vol.fromJSON({
    '/repo/package.json': JSON.stringify({ workspaces: ['packages/*'] }),
  })

  await executeReleaseWorkflow(context, [plugin({ workspace })])

  expect(vi.mocked(loadPackages).mock.calls).toMatchInlineSnapshot(`
    [
      [
        "/repo",
        {
          "entry": ".",
          "members": [
            "apps/*",
          ],
        },
      ],
    ]
  `)
})

test('discovers valid packages and logs warnings when encountering invalid manifests', async () => {
  workspace.entry = '.'
  workspace.members = ['packages/*']

  vol.fromJSON({
    '/repo/packages/foo/package.json': JSON.stringify({
      name: 'foo',
      version: '1.0.0',
      dependencies: { 'bar': 'workspace:^' },
    }),
    '/repo/packages/bar/package.json': JSON.stringify({
      name: 'bar',
      version: '1.0.0',
      dependencies: {},
    }),
    '/repo/packages/baz/package.json': JSON.stringify({
      name: 'baz',
      version: null,
      dependencies: {},
    }),
    '/repo/packages/qux/package.json': 'not a valid package.json',
    '/repo/pnpm-workspace.yaml': 'packages:\n  - packages/*',
    '/repo/package.json': JSON.stringify({
      version: '0.0.0',
      dependencies: { 'foo': 'workspace:^' },
    }),
  })

  context.packages = [
    {
      provider: undefined,
      entry: false,
      location: 'docs',
      dependencies: [] as string[],
    },
  ] as Package[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.packages).toMatchInlineSnapshot(`
    [
      {
        "dependencies": [],
        "entry": false,
        "files": "packages/bar/**/*",
        "location": "packages/bar",
        "name": "bar",
        "private": undefined,
        "provider": "@reelout/npm",
        "root": false,
        "version": "1.0.0",
      },
      {
        "dependencies": [
          "bar",
        ],
        "entry": false,
        "files": "packages/foo/**/*",
        "location": "packages/foo",
        "name": "foo",
        "private": undefined,
        "provider": "@reelout/npm",
        "root": false,
        "version": "1.0.0",
      },
      {
        "dependencies": [
          "foo",
        ],
        "entry": true,
        "files": "!{package-lock.json,npm-shrinkwrap.json,pnpm-lock.yaml,yarn.lock,packages/*/**/*}",
        "location": ".",
        "name": undefined,
        "private": undefined,
        "provider": "@reelout/npm",
        "root": true,
        "version": "0.0.0",
      },
      {
        "dependencies": [],
        "entry": false,
        "location": "docs",
        "provider": undefined,
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[33mPackage could not be loaded: Package version "null" in "packages/baz" is not a valid semantic version.[39m",
      ],
      [
        "[33mPackage could not be loaded: JSON file at "[1m/repo/packages/qux/package.json[22m" could not be parsed.[39m",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [33mNo packages are scheduled for release.[39m",
      ],
    ]
  `)
})

test('updates dependency versions in package manifests when release plans are present', async () => {
  const cwd = '/repo'
  workspace.entry = '.'
  workspace.members = ['*']

  vol.fromJSON({
    '/repo/a/package.json': JSON.stringify({
      name: 'a',
      version: '1.0.0',
      dependencies: {
        x: '^9.0.0',
      },
      devDependencies: {
        b: '^2.0.0',
        c: '^3.0.0',
        y: '^9.0.0',
      },
      peerDependencies: {
        b: '^2.0.0',
        c: 'workspace:^',
      },
    }),
    '/repo/b/package.json': JSON.stringify({
      name: 'b',
      version: '2.0.0',
    }),
    '/repo/c/package.json': JSON.stringify({
      name: 'c',
      version: '3.0.0',
    }),
  })

  context.plans = [
    {
      package: {
        ...(await buildPackage(cwd, 'a', workspace)),
        provider: PLUGIN_NAME,
      },
      history: [],
      release: null,
    },
    {
      package: {
        ...(await buildPackage(cwd, 'b', workspace)),
        provider: PLUGIN_NAME,
      },
      history: [],
      release: { type: 'patch', version: '2.0.1' },
    },
    {
      package: {
        ...(await buildPackage(cwd, 'c', workspace)),
        provider: PLUGIN_NAME,
      },
      history: [],
      release: { type: 'minor', version: '3.1.0' },
    },
  ]

  await executeReleaseWorkflow(context, [plugin()])

  expect(vol.toJSON()).toMatchInlineSnapshot(`
    {
      "/repo/a/package.json": "{
      "name": "a",
      "version": "1.0.0",
      "dependencies": {
        "x": "^9.0.0"
      },
      "devDependencies": {
        "b": "^2.0.1",
        "c": "^3.1.0",
        "y": "^9.0.0"
      },
      "peerDependencies": {
        "b": "^2.0.1",
        "c": "workspace:^"
      }
    }
    ",
      "/repo/b/package.json": "{
      "name": "b",
      "version": "2.0.1"
    }
    ",
      "/repo/c/package.json": "{
      "name": "c",
      "version": "3.1.0"
    }
    ",
    }
  `)
})

test('does not modify package manifests when dry-run mode is enabled', async () => {
  using _dryRun = vi.spyOn(context, 'dryRun', 'get').mockReturnValue(true)

  vol.fromJSON({
    '/repo/a/package.json': JSON.stringify({ name: 'a', version: '0.0.0' }),
    '/repo/b/package.json': JSON.stringify({ name: 'b', version: '0.0.0' }),
  })

  context.plans = [
    {
      package: { location: 'a', version: '1.2.2' },
      history: [] as GitCommit[],
      release: { version: '1.2.3' },
    },
    {
      package: { location: 'b' },
      history: [] as GitCommit[],
      release: null,
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(vol.toJSON()).toEqual({
    '/repo/a/package.json': JSON.stringify({ name: 'a', version: '0.0.0' }),
    '/repo/b/package.json': JSON.stringify({ name: 'b', version: '0.0.0' }),
  })
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[33mPackage could not be loaded: JSON file at "[1m/repo/package.json[22m" could not be read.[39m",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m1 released[39m[22m [90m(0)[39m

    [90m ./a [39m[42m 1.2.3 ← 1.2.2 [49m
    ",
      ],
    ]
  `)
})

test('does not modify package manifests when owned by another provider', async () => {
  vol.fromJSON({
    '/repo/a/package.json': JSON.stringify({
      name: 'a',
      version: '1.0.0',
      devDependencies: { b: '^1.0.0' },
    }),
    '/repo/b/package.json': JSON.stringify({
      name: 'b',
      version: '1.0.0',
    }),
  })

  context.plans = [
    {
      package: {
        provider: PLUGIN_NAME,
        location: 'a',
        version: '1.0.0',
        private: false,
      },
      history: [] as GitCommit[],
      release: { type: 'patch', version: '1.0.1' },
    },
    {
      package: {
        provider: '@reelout/cargo',
        location: 'b',
        version: '1.0.0',
        private: false,
      },
      history: [] as GitCommit[],
      release: { type: 'patch', version: '1.0.1' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(vol.toJSON()).toMatchInlineSnapshot(`
    {
      "/repo/a/package.json": "{"name":"a","version":"1.0.0","devDependencies":{"b":"^1.0.0"}}",
      "/repo/b/package.json": "{"name":"b","version":"1.0.0"}",
    }
  `)
})

test('does not publish packages when owned by another provider', async () => {
  vol.fromJSON({
    '/repo/a/package.json': JSON.stringify({ name: 'a', version: '0.0.0' }),
    '/repo/b/package.json': JSON.stringify({ name: 'b', version: '0.0.0' }),
  })

  context.plans = [
    {
      package: {
        provider: PLUGIN_NAME,
        location: 'a',
        version: '1.0.0',
        private: false,
      },
      history: [] as GitCommit[],
      release: { type: 'patch', version: '1.0.1' },
    },
    {
      package: {
        provider: '@reelout/cargo',
        location: 'b',
        version: '1.0.0',
        private: false,
      },
      history: [] as GitCommit[],
      release: { type: 'patch', version: '1.0.1' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(publishPackage).toHaveBeenCalledTimes(1)
  expect(publishPackage.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "/repo",
        {
          "history": [],
          "package": {
            "location": "a",
            "private": false,
            "provider": "@reelout/npm",
            "version": "1.0.0",
          },
          "release": {
            "type": "patch",
            "version": "1.0.1",
          },
        },
        {
          "access": undefined,
          "dryRun": false,
          "provenance": undefined,
          "stage": undefined,
          "tag": undefined,
        },
      ],
    ]
  `)
})

test('skips authentication and publishing when packages are private', async () => {
  prepareAuth.mockRejectedValue(new Error('Auth token is missing.'))

  vol.fromJSON({
    '/repo/a/package.json': JSON.stringify({ name: 'a', version: '0.0.0' }),
    '/repo/b/package.json': JSON.stringify({ name: 'b', version: '0.0.0' }),
  })

  context.plans = [
    {
      package: { location: 'a', version: '1.2.2', private: true },
      history: [] as GitCommit[],
      release: { version: '1.2.3' },
    },
    {
      package: { location: 'b', version: '2.0.0-rc', private: true },
      history: [] as GitCommit[],
      release: { version: '2.0.0' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(prepareAuth).toHaveBeenCalledTimes(0)
  expect(publishPackage).toHaveBeenCalledTimes(0)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[33mPackage could not be loaded: JSON file at "[1m/repo/package.json[22m" could not be read.[39m",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(0)[39m

    [90m ./a [39m[42m 1.2.3 ← 1.2.2 [49m

    [90m ./b [39m[42m 2.0.0 ← 2.0.0-rc [49m
    ",
      ],
    ]
  `)
})

test('forwards dryRun flag to publisher when dry-run mode is enabled', async () => {
  using _dryRun = vi.spyOn(context, 'dryRun', 'get').mockReturnValue(true)

  vol.fromJSON({
    '/repo/a/package.json': JSON.stringify({ name: 'a', version: '0.0.0' }),
    '/repo/b/package.json': JSON.stringify({ name: 'b', version: '0.0.0' }),
  })

  context.plans = [
    {
      package: { provider: PLUGIN_NAME, location: 'a', version: '1.2.2' },
      history: [] as GitCommit[],
      release: { version: '1.2.3' },
    },
    {
      package: { provider: PLUGIN_NAME, location: 'b', version: '1.2.3' },
      history: [] as GitCommit[],
      release: { version: '2.0.0' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(prepareAuth).toHaveBeenCalledTimes(2)
  expect(publishPackage.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "/repo",
        {
          "history": [],
          "package": {
            "location": "a",
            "provider": "@reelout/npm",
            "version": "1.2.2",
          },
          "release": {
            "version": "1.2.3",
          },
        },
        {
          "access": undefined,
          "dryRun": true,
          "provenance": undefined,
          "stage": undefined,
          "tag": undefined,
        },
      ],
      [
        "/repo",
        {
          "history": [],
          "package": {
            "location": "b",
            "provider": "@reelout/npm",
            "version": "1.2.3",
          },
          "release": {
            "version": "2.0.0",
          },
        },
        {
          "access": undefined,
          "dryRun": true,
          "provenance": undefined,
          "stage": undefined,
          "tag": undefined,
        },
      ],
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[33mPackage could not be loaded: JSON file at "[1m/repo/package.json[22m" could not be read.[39m",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(0)[39m

    [90m ./a [39m[42m 1.2.3 ← 1.2.2 [49m

    [90m ./b [39m[42m 2.0.0 ← 1.2.3 [49m
    ",
      ],
    ]
  `)
})

test('forwards access, provenance, and stage options to publisher when explicitly configured', async () => {
  using _ = vi.spyOn(context, 'releaseChannel', 'get').mockReturnValue('beta')

  vol.fromJSON({
    '/repo/a/package.json': JSON.stringify({ name: 'a', version: '0.0.0' }),
    '/repo/b/package.json': JSON.stringify({ name: 'b', version: '0.0.0' }),
  })

  context.plans = [
    {
      package: { provider: PLUGIN_NAME, location: 'a' },
      history: [] as GitCommit[],
      release: { version: '1.2.3' },
    },
    {
      package: { provider: PLUGIN_NAME, location: 'b' },
      history: [] as GitCommit[],
      release: { version: '2.0.0' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [
    plugin({ access: 'restricted', provenance: true, stage: false }),
  ])

  expect(prepareAuth.mock.calls).toMatchInlineSnapshot(`
    [
      [
        {
          "cwd": "/repo",
        },
      ],
      [
        {
          "cwd": "/repo",
        },
      ],
    ]
  `)
  expect(publishPackage.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "/repo",
        {
          "history": [],
          "package": {
            "location": "a",
            "provider": "@reelout/npm",
          },
          "release": {
            "version": "1.2.3",
          },
        },
        {
          "access": "restricted",
          "dryRun": false,
          "provenance": true,
          "stage": false,
          "tag": "beta",
        },
      ],
      [
        "/repo",
        {
          "history": [],
          "package": {
            "location": "b",
            "provider": "@reelout/npm",
          },
          "release": {
            "version": "2.0.0",
          },
        },
        {
          "access": "restricted",
          "dryRun": false,
          "provenance": true,
          "stage": false,
          "tag": "beta",
        },
      ],
    ]
  `)
})

test('enables provenance automatically when publishing to a public GitHub repository', async () => {
  context.env = {
    'GITHUB_TOKEN': 'mock-github-token',
  }

  isGitHubRepositoryPublic.mockResolvedValueOnce(true)

  context.repository = repository

  vol.fromJSON({
    '/repo/a/package.json': JSON.stringify({ name: 'a', version: '0.0.0' }),
  })

  context.plans = [
    {
      package: { provider: PLUGIN_NAME, location: 'a' },
      history: [] as GitCommit[],
      release: { version: '1.2.3' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(isGitHubRepositoryPublic).toHaveBeenCalledWith(
    'mock-github-token',
    context.repository
  )
  expect(publishPackage.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "/repo",
        {
          "history": [],
          "package": {
            "location": "a",
            "provider": "@reelout/npm",
          },
          "release": {
            "version": "1.2.3",
          },
        },
        {
          "access": undefined,
          "dryRun": false,
          "provenance": true,
          "stage": undefined,
          "tag": undefined,
        },
      ],
    ]
  `)
})

test('enables provenance automatically when publishing to a public GitLab repository', async () => {
  context.env = {
    'GITLAB_TOKEN': 'mock-gitlab-token',
  }

  isGitLabRepositoryPublic.mockResolvedValueOnce(true)

  context.repository = createMockRepository('gitlab')

  vol.fromJSON({
    '/repo/a/package.json': JSON.stringify({ name: 'a', version: '0.0.0' }),
  })

  context.plans = [
    {
      package: { provider: PLUGIN_NAME, location: 'a' },
      history: [] as GitCommit[],
      release: { version: '1.2.3' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(isGitLabRepositoryPublic).toHaveBeenCalledWith(
    'mock-gitlab-token',
    context.repository
  )
  expect(publishPackage.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "/repo",
        {
          "history": [],
          "package": {
            "location": "a",
            "provider": "@reelout/npm",
          },
          "release": {
            "version": "1.2.3",
          },
        },
        {
          "access": undefined,
          "dryRun": false,
          "provenance": true,
          "stage": undefined,
          "tag": undefined,
        },
      ],
    ]
  `)
})

test('leaves provenance undefined when repository visibility check fails', async () => {
  context.env = {
    'GITHUB_TOKEN': 'mock-github-token',
  }

  isGitHubRepositoryPublic.mockRejectedValueOnce(new Error('API error'))

  context.repository = repository

  vol.fromJSON({
    '/repo/a/package.json': JSON.stringify({ name: 'a', version: '0.0.0' }),
  })

  context.plans = [
    {
      package: { provider: PLUGIN_NAME, location: 'a' },
      history: [] as GitCommit[],
      release: { version: '1.2.3' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(isGitHubRepositoryPublic).toHaveBeenCalledWith(
    'mock-github-token',
    context.repository
  )
  expect(publishPackage.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "/repo",
        {
          "history": [],
          "package": {
            "location": "a",
            "provider": "@reelout/npm",
          },
          "release": {
            "version": "1.2.3",
          },
        },
        {
          "access": undefined,
          "dryRun": false,
          "provenance": undefined,
          "stage": undefined,
          "tag": undefined,
        },
      ],
    ]
  `)
})

test('leaves provenance undefined when repository host is unsupported or tokens are missing', async () => {
  context.env = {
    'GITHUB_TOKEN': undefined,
    'GITLAB_TOKEN': undefined,
  }

  context.repository = createMockRepository('other' as Hosts)

  vol.fromJSON({
    '/repo/a/package.json': JSON.stringify({ name: 'a', version: '0.0.0' }),
  })

  context.plans = [
    {
      package: { provider: PLUGIN_NAME, location: 'a' },
      history: [] as GitCommit[],
      release: { version: '1.2.3' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(isGitHubRepositoryPublic).not.toHaveBeenCalled()
  expect(isGitLabRepositoryPublic).not.toHaveBeenCalled()
  expect(publishPackage.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "/repo",
        {
          "history": [],
          "package": {
            "location": "a",
            "provider": "@reelout/npm",
          },
          "release": {
            "version": "1.2.3",
          },
        },
        {
          "access": undefined,
          "dryRun": false,
          "provenance": undefined,
          "stage": undefined,
          "tag": undefined,
        },
      ],
    ]
  `)
})

test('rejects workflow execution when auth token setup fails', async () => {
  prepareAuth.mockRejectedValue(new Error('Auth token is missing.'))

  vol.fromJSON({
    '/repo/a/package.json': JSON.stringify({ name: 'a', version: '0.0.0' }),
    '/repo/b/package.json': JSON.stringify({ name: 'b', version: '0.0.0' }),
  })

  context.plans = [
    {
      package: { provider: PLUGIN_NAME, location: 'a' },
      history: [] as GitCommit[],
      release: { version: '1.2.3' },
    },
    {
      package: { provider: PLUGIN_NAME, location: 'b' },
      history: [] as GitCommit[],
      release: { version: '2.0.0' },
    },
  ] as ReleasePlan[]

  await expect(
    executeReleaseWorkflow(context, [plugin()])
  ).rejects.toMatchInlineSnapshot(`[Error: Auth token is missing.]`)

  expect(prepareAuth).toHaveBeenCalledTimes(1)
  expect(publishPackage).toHaveBeenCalledTimes(1)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[33mPackage could not be loaded: JSON file at "[1m/repo/package.json[22m" could not be read.[39m",
      ],
      [
        "Status: [31mFAILURE[39m",
      ],
      [
        "Release complete: [31mAuth token is missing.[39m",
      ],
    ]
  `)
})
