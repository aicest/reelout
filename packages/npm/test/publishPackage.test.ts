// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/env'

import type { ReleasePlan } from '@reelout/core'
import { publishPackage } from '@reelout/npm'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { context } from '../../../test/mock/context'

const execCommand = vi.hoisted(() => vi.fn())
const resolvePackageManager = vi.hoisted(() => vi.fn())
const getPackageManagerVersion = vi.hoisted(() => vi.fn())

vi.mock(import('@reelout/core/util/execCommand'), () => ({
  execCommand: (command, args, options) => {
    return execCommand(command, args, { cwd: options?.cwd, env: options?.env })
  },
}))

vi.mock(import('@reelout/npm/resolvePackageManager'), () => ({
  resolvePackageManager,
}))

vi.mock(import('@reelout/npm/getPackageManagerVersion'), () => ({
  getPackageManagerVersion,
}))

const plan = {
  package: { location: '.', private: false, name: 'foo', version: '1.0.0' },
  release: { type: 'minor', version: '1.1.0' },
} as ReleasePlan

beforeEach(() => {
  context.env = {
    NPM_TOKEN: 'mock-npm-token',
  }
})

afterEach(() => {
  vi.resetAllMocks()
})

test('skips publishing when package is marked as private', async () => {
  await publishPackage(context, {
    ...plan,
    package: { ...plan.package, private: true },
  })

  expect(execCommand).not.toHaveBeenCalled()
})

test('skips publishing when package name is missing', async () => {
  await publishPackage(context, {
    ...plan,
    package: { ...plan.package, name: undefined },
  })

  expect(execCommand).not.toHaveBeenCalled()
})

test('skips publishing when release plan is null', async () => {
  await publishPackage(context, {
    ...plan,
    release: null,
  })

  expect(execCommand).not.toHaveBeenCalled()
})

test('skips publishing when release version is null', async () => {
  await publishPackage(context, {
    ...plan,
    release: { version: null },
  } as ReleasePlan)

  expect(execCommand).not.toHaveBeenCalled()
})

test('publishes package successfully using npm with various command options', async () => {
  resolvePackageManager.mockResolvedValue('npm')

  await publishPackage(context, plan)
  await publishPackage(context, plan, { dryRun: true })
  await publishPackage(context, plan, { tag: 'beta' })
  await publishPackage(context, plan, { access: 'restricted' })
  await publishPackage(context, plan, { provenance: true, stage: true })
  await publishPackage(context, plan, { stage: true })

  expect(execCommand.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "npm",
        [
          "publish",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "npm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
      [
        "npm",
        [
          "publish",
          "--dry-run",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "npm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
      [
        "npm",
        [
          "publish",
          "--tag",
          "beta",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "npm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
      [
        "npm",
        [
          "publish",
          "--access",
          "restricted",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "npm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
      [
        "npm",
        [
          "stage",
          "publish",
          "--provenance",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "npm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
      [
        "npm",
        [
          "stage",
          "publish",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "npm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
    ]
  `)
})

test('publishes package successfully using pnpm with git check bypass flags and options', async () => {
  resolvePackageManager.mockResolvedValue('pnpm')

  await publishPackage(context, plan)
  await publishPackage(context, plan, { dryRun: true })
  await publishPackage(context, plan, { tag: 'beta' })
  await publishPackage(context, plan, { access: 'restricted' })
  await publishPackage(context, plan, { provenance: true, stage: true })
  await publishPackage(context, plan, { stage: true })

  expect(execCommand.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "pnpm",
        [
          "publish",
          "--no-git-checks",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "pnpm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
      [
        "pnpm",
        [
          "publish",
          "--dry-run",
          "--no-git-checks",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "pnpm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
      [
        "pnpm",
        [
          "publish",
          "--tag",
          "beta",
          "--no-git-checks",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "pnpm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
      [
        "pnpm",
        [
          "publish",
          "--access",
          "restricted",
          "--no-git-checks",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "pnpm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
      [
        "pnpm",
        [
          "stage",
          "publish",
          "--provenance",
          "--no-git-checks",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "pnpm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
      [
        "pnpm",
        [
          "stage",
          "publish",
          "--no-git-checks",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "pnpm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
    ]
  `)
})

test('skips publishing when dry-run option is enabled for yarn version 1', async () => {
  resolvePackageManager.mockResolvedValue('yarn')
  getPackageManagerVersion.mockResolvedValue(1)

  await publishPackage(context, plan, { dryRun: true })

  expect(execCommand).not.toHaveBeenCalled()
})

test('publishes package successfully using yarn version 1 with supported options', async () => {
  resolvePackageManager.mockResolvedValue('yarn')
  getPackageManagerVersion.mockResolvedValue(1)

  await publishPackage(context, plan)
  await publishPackage(context, plan, { dryRun: true })
  await publishPackage(context, plan, { tag: 'beta' })
  await publishPackage(context, plan, { access: 'restricted' })
  await publishPackage(context, plan, { provenance: true, stage: true })
  await publishPackage(context, plan, { stage: true })

  expect(execCommand.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "yarn",
        [
          "publish",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "npm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
      [
        "yarn",
        [
          "publish",
          "--tag",
          "beta",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "npm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
      [
        "yarn",
        [
          "publish",
          "--access",
          "restricted",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "npm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
      [
        "yarn",
        [
          "publish",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "npm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
      [
        "yarn",
        [
          "publish",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "npm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
          },
        },
      ],
    ]
  `)
})

test('publishes package successfully using yarn version 2 or higher with npm workspace options', async () => {
  resolvePackageManager.mockResolvedValue('yarn')
  getPackageManagerVersion.mockResolvedValue(2)

  await publishPackage(context, plan)
  await publishPackage(context, plan, { dryRun: true })
  await publishPackage(context, plan, { tag: 'beta' })
  await publishPackage(context, plan, { access: 'restricted' })
  await publishPackage(context, plan, { provenance: true, stage: true })
  await publishPackage(context, plan, { stage: true })

  expect(execCommand.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "yarn",
        [
          "npm",
          "publish",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "YARN_NPM_AUTH_TOKEN": "mock-npm-token",
          },
        },
      ],
      [
        "yarn",
        [
          "npm",
          "publish",
          "--dry-run",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "YARN_NPM_AUTH_TOKEN": "mock-npm-token",
          },
        },
      ],
      [
        "yarn",
        [
          "npm",
          "publish",
          "--tag",
          "beta",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "YARN_NPM_AUTH_TOKEN": "mock-npm-token",
          },
        },
      ],
      [
        "yarn",
        [
          "npm",
          "publish",
          "--access",
          "restricted",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "YARN_NPM_AUTH_TOKEN": "mock-npm-token",
          },
        },
      ],
      [
        "yarn",
        [
          "npm",
          "publish",
          "--staged",
          "--provenance",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "YARN_NPM_AUTH_TOKEN": "mock-npm-token",
          },
        },
      ],
      [
        "yarn",
        [
          "npm",
          "publish",
          "--staged",
        ],
        {
          "cwd": "/repo",
          "env": {
            "NPM_TOKEN": "mock-npm-token",
            "YARN_NPM_AUTH_TOKEN": "mock-npm-token",
          },
        },
      ],
    ]
  `)
})
