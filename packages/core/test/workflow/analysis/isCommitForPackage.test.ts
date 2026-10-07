// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  isCommitForPackage,
  type GitCommit,
  type ReleasePlan,
} from '@reelout/core'
import { buildPackageFilePattern } from '@reelout/npm'
import { expect, test } from 'vitest'
import { workspace } from '../../../../../test/mock/context'

test('returns true if file matches pattern', () => {
  workspace.entry = '.'
  workspace.members = ['packages/*']

  const plans = [
    {
      package: {
        location: '.',
        files: undefined,
      },
    },
    {
      package: {
        location: '.',
        files: buildPackageFilePattern(workspace, true, '.'),
      },
    },
    {
      package: {
        location: 'packages/foo',
        files: undefined,
      },
    },
    {
      package: {
        location: 'packages/foo',
        files: buildPackageFilePattern(workspace, false, 'packages/foo'),
      },
    },
  ] as ReleasePlan[]

  expect(plans).toMatchInlineSnapshot(`
    [
      {
        "package": {
          "files": undefined,
          "location": ".",
        },
      },
      {
        "package": {
          "files": "!{package-lock.json,npm-shrinkwrap.json,pnpm-lock.yaml,yarn.lock,packages/*/**/*}",
          "location": ".",
        },
      },
      {
        "package": {
          "files": undefined,
          "location": "packages/foo",
        },
      },
      {
        "package": {
          "files": "packages/foo/**/*",
          "location": "packages/foo",
        },
      },
    ]
  `)

  for (const [file, expected] of [
    ['.npmrc', [true, true, false, false]],
    ['.prettierrc.json', [true, true, false, false]],
    ['src/index.ts', [true, true, false, false]],
    ['package.json', [true, true, false, false]],
    ['package-lock.json', [true, false, false, false]],
    ['npm-shrinkwrap.json', [true, false, false, false]],
    ['pnpm-lock.yaml', [true, false, false, false]],
    ['yarn.lock', [true, false, false, false]],
    ['packages/foo/.npmrc', [true, false, true, true]],
    ['packages/foo/.gitignore', [true, false, true, true]],
    ['packages/foo/package.json', [true, false, true, true]],
    ['packages/foo/src/index.ts', [true, false, true, true]],
    ['packages/bar/.npmrc', [true, false, false, false]],
    ['packages/bar/.gitignore', [true, false, false, false]],
    ['packages/bar/package.json', [true, false, false, false]],
    ['packages/bar/src/index.ts', [true, false, false, false]],
  ] as const) {
    const commit = { files: [file] as readonly string[] } as GitCommit

    plans.forEach((plan, index) => {
      expect({
        file,
        root: index === 0,
        isCommitForPackage: isCommitForPackage(plan.package, commit),
      }).toEqual({
        file,
        root: index === 0,
        isCommitForPackage: expected[index],
      })
    })
  }
})
