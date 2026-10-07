// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type {
  GitCommit,
  GitCommitNote,
  ReleasePlan,
  ReleaseTypeHint,
} from '@reelout/core'
import { deriveChangeReleases, normalizeCommitFilter } from '@reelout/core'
import { expect, test } from 'vitest'

const classifier = normalizeCommitFilter({
  minor: ['feat'],
  patch: ['fix'],
})

test('associates commits with target packages and calculates release types when release hint is auto', async () => {
  const plans = [
    {
      package: { files: 'packages/foo/**/*' },
      history: [] as GitCommit[],
      release: { type: 'major', version: '1.0.0' },
    },
    {
      package: { files: 'packages/bar/**/*' },
      history: [] as GitCommit[],
      release: { type: 'patch', version: '2.0.0' },
    },
    {
      package: { files: 'packages/baz/**/*' },
      history: [] as GitCommit[],
      release: null,
    },
    {
      package: { files: 'packages/qux/**/*' },
      history: [] as GitCommit[],
      release: null,
    },
  ] as ReleasePlan[]

  async function* createAsyncHistory(): AsyncGenerator<GitCommit> {
    yield {
      hash: 'c1',
      type: 'feat',
      notes: [] as GitCommitNote[],
      files: ['packages/foo/src/index.ts'],
    } as Partial<GitCommit> as GitCommit
    yield {
      hash: 'c2',
      type: 'feat',
      notes: [] as GitCommitNote[],
      files: ['packages/bar/src/index.ts'],
    } as Partial<GitCommit> as GitCommit
    yield {
      hash: 'c3',
      type: 'chore',
      notes: [] as GitCommitNote[],
      files: ['packages/baz/src/index.ts'],
    } as Partial<GitCommit> as GitCommit
  }

  const result = await deriveChangeReleases(
    'auto',
    classifier,
    plans,
    createAsyncHistory()
  )

  expect(result).toMatchInlineSnapshot(`
    [
      {
        "history": [
          {
            "files": [
              "packages/foo/src/index.ts",
            ],
            "hash": "c1",
            "notes": [],
            "type": "feat",
          },
        ],
        "package": {
          "files": "packages/foo/**/*",
        },
        "release": {
          "type": "major",
          "version": "1.0.0",
        },
      },
      {
        "history": [
          {
            "files": [
              "packages/bar/src/index.ts",
            ],
            "hash": "c2",
            "notes": [],
            "type": "feat",
          },
        ],
        "package": {
          "files": "packages/bar/**/*",
        },
        "release": {
          "type": "minor",
          "version": "2.0.0",
        },
      },
      {
        "history": [
          {
            "files": [
              "packages/baz/src/index.ts",
            ],
            "hash": "c3",
            "notes": [],
            "type": "chore",
          },
        ],
        "package": {
          "files": "packages/baz/**/*",
        },
        "release": null,
      },
      {
        "history": [],
        "package": {
          "files": "packages/qux/**/*",
        },
        "release": null,
      },
    ]
  `)
})

test('overrides calculated release type with major when release hint is major', async () => {
  const plans = [
    {
      package: { files: 'packages/foo/**/*' },
      history: [] as GitCommit[],
      release: null,
    },
  ] as ReleasePlan[]

  const history = [
    {
      hash: 'c1',
      type: 'fix',
      notes: [],
      files: ['packages/foo/src/index.ts'],
    },
  ] as Partial<GitCommit>[] as GitCommit[]

  const result = await deriveChangeReleases('major', classifier, plans, history)

  expect(result).toMatchInlineSnapshot(`
    [
      {
        "history": [
          {
            "files": [
              "packages/foo/src/index.ts",
            ],
            "hash": "c1",
            "notes": [],
            "type": "fix",
          },
        ],
        "package": {
          "files": "packages/foo/**/*",
        },
        "release": {
          "type": "major",
        },
      },
    ]
  `)
})

test('overrides calculated release type with minor when release hint is minor', async () => {
  const plans = [
    {
      package: { files: 'packages/foo/**/*' },
      history: [] as GitCommit[],
      release: null,
    },
  ] as ReleasePlan[]

  const history = [
    {
      hash: 'c1',
      type: 'fix',
      notes: [],
      files: ['packages/foo/src/index.ts'],
    },
  ] as Partial<GitCommit>[] as GitCommit[]

  const result = await deriveChangeReleases('minor', classifier, plans, history)

  expect(result).toMatchInlineSnapshot(`
    [
      {
        "history": [
          {
            "files": [
              "packages/foo/src/index.ts",
            ],
            "hash": "c1",
            "notes": [],
            "type": "fix",
          },
        ],
        "package": {
          "files": "packages/foo/**/*",
        },
        "release": {
          "type": "minor",
        },
      },
    ]
  `)
})

test('overrides calculated release type with patch when release hint is patch', async () => {
  const plans = [
    {
      package: { files: 'packages/foo/**/*' },
      history: [] as GitCommit[],
      release: null,
    },
  ] as ReleasePlan[]

  const history = [
    {
      hash: 'c1',
      type: 'feat',
      notes: [],
      files: ['packages/foo/src/index.ts'],
    },
  ] as Partial<GitCommit>[] as GitCommit[]

  const result = await deriveChangeReleases('patch', classifier, plans, history)

  expect(result).toMatchInlineSnapshot(`
    [
      {
        "history": [
          {
            "files": [
              "packages/foo/src/index.ts",
            ],
            "hash": "c1",
            "notes": [],
            "type": "feat",
          },
        ],
        "package": {
          "files": "packages/foo/**/*",
        },
        "release": {
          "type": "patch",
        },
      },
    ]
  `)
})

test('falls back to calculated release type when release hint is unrecognized', async () => {
  const plans = [
    {
      package: { files: 'packages/foo/**/*' },
      history: [] as GitCommit[],
      release: null,
    },
  ] as ReleasePlan[]

  const history = [
    {
      hash: 'c1',
      type: 'fix',
      notes: [],
      files: ['packages/foo/src/index.ts'],
    },
  ] as Partial<GitCommit>[] as GitCommit[]

  const result = await deriveChangeReleases(
    'unknown' as string as ReleaseTypeHint,
    classifier,
    plans,
    history
  )

  expect(result).toMatchInlineSnapshot(`
    [
      {
        "history": [
          {
            "files": [
              "packages/foo/src/index.ts",
            ],
            "hash": "c1",
            "notes": [],
            "type": "fix",
          },
        ],
        "package": {
          "files": "packages/foo/**/*",
        },
        "release": {
          "type": "patch",
        },
      },
    ]
  `)
})

test('returns null release type when commit history is empty', async () => {
  const plans = [
    {
      package: { files: 'packages/foo/**/*' },
      history: [] as GitCommit[],
      release: null,
    },
  ] as ReleasePlan[]

  const result = await deriveChangeReleases('auto', classifier, plans, [])

  expect(result).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "files": "packages/foo/**/*",
        },
        "release": null,
      },
    ]
  `)
})

test('does not apply release hint override when commit history is empty', async () => {
  const plans = [
    {
      package: { files: 'packages/foo/**/*' },
      history: [] as GitCommit[],
      release: null,
    },
  ] as ReleasePlan[]

  let result = await deriveChangeReleases('major', classifier, plans, [])

  expect(result).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "files": "packages/foo/**/*",
        },
        "release": null,
      },
    ]
  `)

  result = await deriveChangeReleases('minor', classifier, plans, [])

  expect(result).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "files": "packages/foo/**/*",
        },
        "release": null,
      },
    ]
  `)

  result = await deriveChangeReleases('patch', classifier, plans, [])

  expect(result).toMatchInlineSnapshot(`
    [
      {
        "history": [],
        "package": {
          "files": "packages/foo/**/*",
        },
        "release": null,
      },
    ]
  `)
})
