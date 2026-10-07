// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitCommit, ReleasePlan } from '@reelout/core'
import {
  execGit,
  executeReleaseWorkflow,
  prependChangelog,
} from '@reelout/core'
import plugin from '@reelout/core/builder'
import { buildPackage, writePackageJson } from '@reelout/npm'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { context, logger, workspace } from '../../../test/mock/context'
import {
  createMockCommit,
  initializeGitRepository,
} from '../../../test/mock/git'

async function writeChangelog(dir: string, version: string, changes?: string) {
  await prependChangelog(
    path.join(dir, 'CHANGELOG.md'),
    [`## ${version}`, changes || 'Add some changes'].join('\n')
  )
}

test('skips release metadata generation when plan release is null', async () => {
  context.plans = [
    {
      package: {
        entry: true,
        location: 'pkg1',
        name: 'pkg1',
        version: '1.0.0',
      },
      history: [] as GitCommit[],
      release: null,
    },
    {
      package: {
        entry: false,
        location: 'pkg2',
        name: 'pkg2',
        version: '1.0.0',
      },
      history: [] as GitCommit[],
      release: null,
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.plans).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "entry": true,
          "location": "pkg1",
          "name": "pkg1",
          "version": "1.0.0",
        },
        "release": null,
      },
      {
        "history": [],
        "package": {
          "entry": false,
          "location": "pkg2",
          "name": "pkg2",
          "version": "1.0.0",
        },
        "release": null,
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [33mNo packages are scheduled for release.[39m",
      ],
    ]
  `)
})

test('logs warning and omits release version when package version is invalid semver', async () => {
  context.plans = [
    {
      package: {
        entry: true,
        location: 'pkg1',
        name: 'pkg1',
        version: 'x.y.z',
      },
      history: [] as GitCommit[],
      release: { type: 'major' },
    },
    {
      package: {
        entry: false,
        location: 'pkg2',
        name: 'pkg2',
        version: 'x.y.z',
      },
      history: [] as GitCommit[],
      release: { type: 'major' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.plans).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "entry": true,
          "location": "pkg1",
          "name": "pkg1",
          "version": "x.y.z",
        },
        "release": {
          "type": "major",
        },
      },
      {
        "history": [],
        "package": {
          "entry": false,
          "location": "pkg2",
          "name": "pkg2",
          "version": "x.y.z",
        },
        "release": {
          "type": "major",
        },
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[33mVersion could not be determined for package at "[1mpkg1[22m": Version "x.y.z" is not a valid semantic version.[39m",
      ],
      [
        "[33mVersion could not be determined for package at "[1mpkg2[22m": Version "x.y.z" is not a valid semantic version.[39m",
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

test('bumps package version to next major semver when release type is major', async () => {
  context.plans = [
    {
      package: { entry: true, location: 'pkg1', version: '1.0.0' },
      history: [] as GitCommit[],
      release: { type: 'major' },
    },
    {
      package: { entry: false, location: 'pkg2', version: '1.0.0' },
      history: [] as GitCommit[],
      release: { type: 'major' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.plans).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "entry": true,
          "location": "pkg1",
          "version": "1.0.0",
        },
        "release": {
          "tag": {
            "message": "",
            "name": "v2.0.0",
          },
          "type": "major",
          "version": "2.0.0",
        },
      },
      {
        "history": [],
        "package": {
          "entry": false,
          "location": "pkg2",
          "version": "1.0.0",
        },
        "release": {
          "type": "major",
          "version": "2.0.0",
        },
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[33mTag could not be determined for package at "[1mpkg2[22m": Package name is required to build a tag name.[39m",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(0)[39m

    [41m 2.0.0 ← 1.0.0 [49m[90m major [39m

    [90m ./pkg2 [39m[41m 2.0.0 ← 1.0.0 [49m[90m major [39m
    ",
      ],
    ]
  `)
})

test('bumps package version to next minor semver when release type is minor', async () => {
  context.plans = [
    {
      package: { entry: true, location: 'pkg1', version: '1.0.0' },
      history: [] as GitCommit[],
      release: { type: 'minor' },
    },
    {
      package: { entry: false, location: 'pkg2', version: '1.0.0' },
      history: [] as GitCommit[],
      release: { type: 'minor' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.plans).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "entry": true,
          "location": "pkg1",
          "version": "1.0.0",
        },
        "release": {
          "tag": {
            "message": "",
            "name": "v1.1.0",
          },
          "type": "minor",
          "version": "1.1.0",
        },
      },
      {
        "history": [],
        "package": {
          "entry": false,
          "location": "pkg2",
          "version": "1.0.0",
        },
        "release": {
          "type": "minor",
          "version": "1.1.0",
        },
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[33mTag could not be determined for package at "[1mpkg2[22m": Package name is required to build a tag name.[39m",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(0)[39m

    [42m 1.1.0 ← 1.0.0 [49m[90m minor [39m

    [90m ./pkg2 [39m[42m 1.1.0 ← 1.0.0 [49m[90m minor [39m
    ",
      ],
    ]
  `)
})

test('bumps package version to next patch semver when release type is patch', async () => {
  context.plans = [
    {
      package: { entry: true, location: 'pkg1', version: '1.0.0' },
      history: [] as GitCommit[],
      release: { type: 'patch' },
    },
    {
      package: { entry: false, location: 'pkg2', version: '1.0.0' },
      history: [] as GitCommit[],
      release: { type: 'patch' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.plans).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "entry": true,
          "location": "pkg1",
          "version": "1.0.0",
        },
        "release": {
          "tag": {
            "message": "",
            "name": "v1.0.1",
          },
          "type": "patch",
          "version": "1.0.1",
        },
      },
      {
        "history": [],
        "package": {
          "entry": false,
          "location": "pkg2",
          "version": "1.0.0",
        },
        "release": {
          "type": "patch",
          "version": "1.0.1",
        },
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[33mTag could not be determined for package at "[1mpkg2[22m": Package name is required to build a tag name.[39m",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(0)[39m

    [42m 1.0.1 ← 1.0.0 [49m[90m patch [39m

    [90m ./pkg2 [39m[42m 1.0.1 ← 1.0.0 [49m[90m patch [39m
    ",
      ],
    ]
  `)
})

test('graduates prerelease to stable major version when release type is major', async () => {
  context.plans = [
    {
      package: { entry: true, location: 'pkg1', version: '1.0.0-dev.1' },
      history: [] as GitCommit[],
      release: { type: 'major' },
    },
    {
      package: { entry: false, location: 'pkg2', version: '1.0.0-dev.1' },
      history: [] as GitCommit[],
      release: { type: 'major' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.plans).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "entry": true,
          "location": "pkg1",
          "version": "1.0.0-dev.1",
        },
        "release": {
          "tag": {
            "message": "",
            "name": "v1.0.0",
          },
          "type": "major",
          "version": "1.0.0",
        },
      },
      {
        "history": [],
        "package": {
          "entry": false,
          "location": "pkg2",
          "version": "1.0.0-dev.1",
        },
        "release": {
          "type": "major",
          "version": "1.0.0",
        },
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[33mTag could not be determined for package at "[1mpkg2[22m": Package name is required to build a tag name.[39m",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(0)[39m

    [41m 1.0.0 ← 1.0.0-dev.1 [49m[90m major [39m

    [90m ./pkg2 [39m[41m 1.0.0 ← 1.0.0-dev.1 [49m[90m major [39m
    ",
      ],
    ]
  `)
})

test('graduates prerelease to stable minor version when release type is minor', async () => {
  context.plans = [
    {
      package: { entry: true, location: 'pkg1', version: '1.0.0-dev.1' },
      history: [] as GitCommit[],
      release: { type: 'minor' },
    },
    {
      package: { entry: false, location: 'pkg2', version: '1.0.0-dev.1' },
      history: [] as GitCommit[],
      release: { type: 'minor' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.plans).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "entry": true,
          "location": "pkg1",
          "version": "1.0.0-dev.1",
        },
        "release": {
          "tag": {
            "message": "",
            "name": "v1.0.0",
          },
          "type": "minor",
          "version": "1.0.0",
        },
      },
      {
        "history": [],
        "package": {
          "entry": false,
          "location": "pkg2",
          "version": "1.0.0-dev.1",
        },
        "release": {
          "type": "minor",
          "version": "1.0.0",
        },
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[33mTag could not be determined for package at "[1mpkg2[22m": Package name is required to build a tag name.[39m",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(0)[39m

    [42m 1.0.0 ← 1.0.0-dev.1 [49m[90m minor [39m

    [90m ./pkg2 [39m[42m 1.0.0 ← 1.0.0-dev.1 [49m[90m minor [39m
    ",
      ],
    ]
  `)
})

test('graduates prerelease to stable patch version when release type is patch', async () => {
  context.plans = [
    {
      package: { entry: true, location: 'pkg1', version: '1.0.0-dev.1' },
      history: [] as GitCommit[],
      release: { type: 'patch' },
    },
    {
      package: { entry: false, location: 'pkg2', version: '1.0.0-dev.1' },
      history: [] as GitCommit[],
      release: { type: 'patch' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.plans).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "entry": true,
          "location": "pkg1",
          "version": "1.0.0-dev.1",
        },
        "release": {
          "tag": {
            "message": "",
            "name": "v1.0.0",
          },
          "type": "patch",
          "version": "1.0.0",
        },
      },
      {
        "history": [],
        "package": {
          "entry": false,
          "location": "pkg2",
          "version": "1.0.0-dev.1",
        },
        "release": {
          "type": "patch",
          "version": "1.0.0",
        },
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[33mTag could not be determined for package at "[1mpkg2[22m": Package name is required to build a tag name.[39m",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(0)[39m

    [42m 1.0.0 ← 1.0.0-dev.1 [49m[90m patch [39m

    [90m ./pkg2 [39m[42m 1.0.0 ← 1.0.0-dev.1 [49m[90m patch [39m
    ",
      ],
    ]
  `)
})

test('applies prerelease qualifier to bumped version when versionQualifier is set in context', async () => {
  context.plans = [
    {
      package: {
        entry: true,
        location: 'pkg1',
        name: 'pkg1',
        version: '1.0.0',
      },
      history: [] as GitCommit[],
      release: { type: 'minor' },
    },
    {
      package: {
        entry: false,
        location: 'pkg2',
        name: 'pkg2',
        version: '1.0.0',
      },
      history: [] as GitCommit[],
      release: { type: 'minor' },
    },
  ] as ReleasePlan[]

  context.versionQualifier = 'beta'

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.plans).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "entry": true,
          "location": "pkg1",
          "name": "pkg1",
          "version": "1.0.0",
        },
        "release": {
          "tag": {
            "message": "",
            "name": "v1.1.0-beta.0",
          },
          "type": "minor",
          "version": "1.1.0-beta.0",
        },
      },
      {
        "history": [],
        "package": {
          "entry": false,
          "location": "pkg2",
          "name": "pkg2",
          "version": "1.0.0",
        },
        "release": {
          "tag": {
            "message": "",
            "name": "pkg2@1.1.0-beta.0",
          },
          "type": "minor",
          "version": "1.1.0-beta.0",
        },
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(0)[39m

    [44m pkg1 [49m[42m 1.1.0-beta.0 ← 1.0.0 [49m[90m minor [39m

    [44m pkg2 [49m[42m 1.1.0-beta.0 ← 1.0.0 [49m[90m minor [39m
    ",
      ],
    ]
  `)
})

test('advances prerelease to next minor track when bumping minor version with empty versionQualifier', async () => {
  context.plans = [
    {
      package: {
        entry: true,
        location: 'pkg1',
        name: 'pkg1',
        version: '1.1.0-dev.1',
      },
      history: [] as GitCommit[],
      release: {
        type: 'minor',
        transition: 'advance',
      },
    },
    {
      package: {
        entry: false,
        location: 'pkg2',
        name: 'pkg2',
        version: '1.1.0-dev.1',
      },
      history: [] as GitCommit[],
      release: {
        type: 'minor',
        transition: 'advance',
      },
    },
  ] as ReleasePlan[]

  context.versionQualifier = ''

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.plans).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "entry": true,
          "location": "pkg1",
          "name": "pkg1",
          "version": "1.1.0-dev.1",
        },
        "release": {
          "tag": {
            "message": "",
            "name": "v1.2.0-0",
          },
          "transition": "advance",
          "type": "minor",
          "version": "1.2.0-0",
        },
      },
      {
        "history": [],
        "package": {
          "entry": false,
          "location": "pkg2",
          "name": "pkg2",
          "version": "1.1.0-dev.1",
        },
        "release": {
          "tag": {
            "message": "",
            "name": "pkg2@1.2.0-0",
          },
          "transition": "advance",
          "type": "minor",
          "version": "1.2.0-0",
        },
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(0)[39m

    [44m pkg1 [49m[42m 1.2.0-0 ← 1.1.0-dev.1 [49m[90m minor [39m

    [44m pkg2 [49m[42m 1.2.0-0 ← 1.1.0-dev.1 [49m[90m minor [39m
    ",
      ],
    ]
  `)
})

test('logs warning and omits tag creation when non-entry package lacks a name', async () => {
  context.plans = [
    {
      package: {
        entry: true,
        location: 'pkg1',
        name: undefined,
        version: '1.0.0',
      },
      history: [] as GitCommit[],
      release: { type: 'minor' },
    },
    {
      package: {
        entry: false,
        location: 'pkg2',
        name: undefined,
        version: '1.0.0',
      },
      history: [] as GitCommit[],
      release: { type: 'major' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.plans).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "entry": true,
          "location": "pkg1",
          "name": undefined,
          "version": "1.0.0",
        },
        "release": {
          "tag": {
            "message": "",
            "name": "v1.1.0",
          },
          "type": "minor",
          "version": "1.1.0",
        },
      },
      {
        "history": [],
        "package": {
          "entry": false,
          "location": "pkg2",
          "name": undefined,
          "version": "1.0.0",
        },
        "release": {
          "type": "major",
          "version": "2.0.0",
        },
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[33mTag could not be determined for package at "[1mpkg2[22m": Package name is required to build a tag name.[39m",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(0)[39m

    [42m 1.1.0 ← 1.0.0 [49m[90m minor [39m

    [90m ./pkg2 [39m[41m 2.0.0 ← 1.0.0 [49m[90m major [39m
    ",
      ],
    ]
  `)
})

test('attaches root tag to entry package and package-prefixed tag to non-entry packages', async () => {
  context.plans = [
    {
      package: {
        entry: true,
        location: 'pkg1',
        name: 'pkg1',
        version: '1.0.0',
      },
      history: [] as GitCommit[],
      release: { type: 'major' },
    },
    {
      package: {
        entry: false,
        location: 'pkg2',
        name: 'pkg2',
        version: '1.0.0',
      },
      history: [] as GitCommit[],
      release: { type: 'major' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.plans).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "entry": true,
          "location": "pkg1",
          "name": "pkg1",
          "version": "1.0.0",
        },
        "release": {
          "tag": {
            "message": "",
            "name": "v2.0.0",
          },
          "type": "major",
          "version": "2.0.0",
        },
      },
      {
        "history": [],
        "package": {
          "entry": false,
          "location": "pkg2",
          "name": "pkg2",
          "version": "1.0.0",
        },
        "release": {
          "tag": {
            "message": "",
            "name": "pkg2@2.0.0",
          },
          "type": "major",
          "version": "2.0.0",
        },
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(0)[39m

    [44m pkg1 [49m[41m 2.0.0 ← 1.0.0 [49m[90m major [39m

    [44m pkg2 [49m[41m 2.0.0 ← 1.0.0 [49m[90m major [39m
    ",
      ],
    ]
  `)
})

test('populates tag message with formatted release notes when plan history contains commits', async () => {
  context.plans = [
    {
      package: {
        entry: true,
        location: 'pkg1',
        name: 'pkg1',
        version: '1.0.0',
      },
      history: [
        await createMockCommit('a8b3c4d', 'fix: patch critical memory leak'),
      ],
      release: { type: 'major' },
    },
    {
      package: {
        entry: false,
        location: 'pkg2',
        name: 'pkg2',
        version: '1.0.0',
      },
      history: [
        await createMockCommit('e2f4a6b', 'fix: patch critical memory leak'),
      ],
      release: { type: 'major' },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.plans).toMatchInlineSnapshot(`
    [
      {
        "history": [
          {
            "authorDate": "2026-01-01T00:00:00.000Z",
            "body": null,
            "committerDate": "2026-01-01T00:00:01.000Z",
            "files": [],
            "footer": null,
            "hash": "a8b3c4d",
            "header": "fix: patch critical memory leak",
            "mentions": [],
            "merge": null,
            "notes": [],
            "parent": [],
            "references": [],
            "revert": null,
            "scope": null,
            "subject": "patch critical memory leak",
            "trailers": [],
            "type": "fix",
          },
        ],
        "package": {
          "entry": true,
          "location": "pkg1",
          "name": "pkg1",
          "version": "1.0.0",
        },
        "release": {
          "tag": {
            "message": "## Bug Fixes

    - patch critical memory leak a8b3c4d
    ",
            "name": "v2.0.0",
          },
          "type": "major",
          "version": "2.0.0",
        },
      },
      {
        "history": [
          {
            "authorDate": "2026-01-01T00:00:02.000Z",
            "body": null,
            "committerDate": "2026-01-01T00:00:03.000Z",
            "files": [],
            "footer": null,
            "hash": "e2f4a6b",
            "header": "fix: patch critical memory leak",
            "mentions": [],
            "merge": null,
            "notes": [],
            "parent": [],
            "references": [],
            "revert": null,
            "scope": null,
            "subject": "patch critical memory leak",
            "trailers": [],
            "type": "fix",
          },
        ],
        "package": {
          "entry": false,
          "location": "pkg2",
          "name": "pkg2",
          "version": "1.0.0",
        },
        "release": {
          "tag": {
            "message": "## Bug Fixes

    - patch critical memory leak e2f4a6b
    ",
            "name": "pkg2@2.0.0",
          },
          "type": "major",
          "version": "2.0.0",
        },
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(0)[39m

    [44m pkg1 [49m[41m 2.0.0 ← 1.0.0 [49m[90m major [39m

    [44m pkg2 [49m[41m 2.0.0 ← 1.0.0 [49m[90m major [39m
    ",
      ],
    ]
  `)
})

test('leaves tag message undefined when release notes generation throws an error', async () => {
  context.plans = [
    {
      package: {
        entry: true,
        location: 'pkg1',
        name: 'pkg1',
        version: '1.0.0',
      },
      history: null as unknown,
      release: {
        type: 'major',
        changelog: '# Release Notes\n\n- Milestone release published',
      },
    },
    {
      package: {
        entry: false,
        location: 'pkg2',
        name: 'pkg2',
        version: '1.0.0',
      },
      history: null as unknown,
      release: {
        type: 'major',
        changelog: '# Release Notes\n\n- Milestone release published',
      },
    },
  ] as ReleasePlan[]

  await executeReleaseWorkflow(context, [plugin()])

  expect(context.plans).toMatchInlineSnapshot(`
    [
      {
        "history": null,
        "package": {
          "entry": true,
          "location": "pkg1",
          "name": "pkg1",
          "version": "1.0.0",
        },
        "release": {
          "changelog": "# Release Notes

    - Milestone release published",
          "tag": {
            "message": undefined,
            "name": "v2.0.0",
          },
          "type": "major",
          "version": "2.0.0",
        },
      },
      {
        "history": null,
        "package": {
          "entry": false,
          "location": "pkg2",
          "name": "pkg2",
          "version": "1.0.0",
        },
        "release": {
          "changelog": "# Release Notes

    - Milestone release published",
          "tag": {
            "message": undefined,
            "name": "pkg2@2.0.0",
          },
          "type": "major",
          "version": "2.0.0",
        },
      },
    ]
  `)
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(0)[39m

    [44m pkg1 [49m[41m 2.0.0 ← 1.0.0 [49m[90m major [39m

    [36m# Release Notes[39m

    - Milestone release published

    [44m pkg2 [49m[41m 2.0.0 ← 1.0.0 [49m[90m major [39m

    [36m# Release Notes[39m

    - Milestone release published
    ",
      ],
    ]
  `)
})

test('derives release notes from commits since previous stable tag when allowEmpty is true and release cycle is unchanged', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await writeChangelog(cwd, '1.0.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: release v1.0.0'])
    await execGit(cwd, ['tag', 'v1.0.0'])

    await writePackageJson(cwd, { version: '1.1.0-dev.1' })
    await writeChangelog(cwd, '1.1.0-dev.1')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'fix: resolve issue for v1.1.0-dev.1'])
    await execGit(cwd, ['tag', 'v1.1.0-dev.1'])

    await writePackageJson(cwd, { version: '1.1.0-dev.2' })
    await writeChangelog(cwd, '1.1.0-dev.2')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'feat: add preview feature for v1.1.0-dev.2',
    ])
    await execGit(cwd, ['tag', 'v1.1.0-dev.2'])

    await writePackageJson(cwd, { version: '1.1.0' })
    await writeChangelog(cwd, '1.1.0')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: release v1.1.0'])
    await execGit(cwd, ['tag', 'v1.1.0'])

    await writePackageJson(cwd, { version: '1.2.0-dev.1' })
    await writeChangelog(cwd, '1.2.0-dev.1')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'fix: patch minor bug in v1.2.0-dev.1'])
    await execGit(cwd, ['tag', 'v1.2.0-dev.1'])

    await writePackageJson(cwd, { version: '1.2.0-dev.2' })
    await writeChangelog(cwd, '1.2.0-dev.2')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'feat: add latest changes for v1.2.0-dev.2',
    ])

    context.plans = [
      {
        package: await buildPackage(cwd, '.', workspace),
        history: [] as GitCommit[],
        release: { type: 'minor' },
      },
    ] as ReleasePlan[]

    context.allowEmpty = true

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [],
          "package": {
            "dependencies": [],
            "entry": true,
            "files": "**/*",
            "location": ".",
            "name": undefined,
            "private": undefined,
            "root": true,
            "version": "1.2.0-dev.2",
          },
          "release": {
            "tag": {
              "message": "## Features

      - add latest changes for v1.2.0-dev.2 2f6dc4e

      ## Bug Fixes

      - patch minor bug in v1.2.0-dev.1 deb956d
      ",
              "name": "v1.2.0",
            },
            "type": "minor",
            "version": "1.2.0",
          },
        },
      ]
    `)
  })
})

test('derives release notes from all commits when allowEmpty is true and no previous stable tag exists', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0-0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'feat: initial prerelease work'])

    context.plans = [
      {
        package: await buildPackage(cwd, '.', workspace),
        history: [] as GitCommit[],
        release: { type: 'patch' },
      },
    ] as ReleasePlan[]

    context.allowEmpty = true

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [],
          "package": {
            "dependencies": [],
            "entry": true,
            "files": "**/*",
            "location": ".",
            "name": undefined,
            "private": undefined,
            "root": true,
            "version": "1.0.0-0",
          },
          "release": {
            "tag": {
              "message": "## Features

      - initial prerelease work 2db0f03
      ",
              "name": "v1.0.0",
            },
            "type": "patch",
            "version": "1.0.0",
          },
        },
      ]
    `)
  })
})

test('uses plan history for release notes when allowEmpty is true but release cycle changes', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.1.0-dev.1' })
    await writeChangelog(cwd, '1.1.0-dev.1')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: release v1.1.0-dev.1'])
    await execGit(cwd, ['tag', 'v1.1.0-dev.1'])

    context.plans = [
      {
        package: await buildPackage(cwd, '.', workspace),
        history: [] as GitCommit[],
        release: { type: 'minor', transition: 'advance' },
      },
    ] as ReleasePlan[]

    context.versionQualifier = ''

    context.allowEmpty = true

    await executeReleaseWorkflow(context, [plugin()])

    expect(context.plans).toMatchInlineSnapshot(`
      [
        {
          "history": [],
          "package": {
            "dependencies": [],
            "entry": true,
            "files": "**/*",
            "location": ".",
            "name": undefined,
            "private": undefined,
            "root": true,
            "version": "1.1.0-dev.1",
          },
          "release": {
            "tag": {
              "message": "",
              "name": "v1.2.0-0",
            },
            "transition": "advance",
            "type": "minor",
            "version": "1.2.0-0",
          },
        },
      ]
    `)
  })
})
