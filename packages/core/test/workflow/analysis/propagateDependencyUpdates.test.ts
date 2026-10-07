// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitCommit, ReleasePlan } from '@reelout/core'
import { propagateDependencyUpdates } from '@reelout/core'
import { expect, test, vi } from 'vitest'
import { context } from '../../../../../test/mock/context'
import { createMockCommit } from '../../../../../test/mock/git'

const mergeGitHistory = vi.hoisted(() =>
  vi.fn().mockImplementation((cwd: string, a: GitCommit[], b: GitCommit[]) => {
    return a
      .concat(b)
      .filter(
        ({ hash }, index, array) =>
          array.findIndex((commit) => commit.hash === hash) === index
      )
      .sort((a, b) => a.hash.localeCompare(b.hash))
      .reverse()
  })
)

vi.mock(import('@reelout/core/git/history/mergeGitHistory'), () => ({
  mergeGitHistory,
}))

test('propagates patch release to dependents', async () => {
  const plans = [
    {
      package: { name: 'a', dependencies: [] as string[] },
      history: [await createMockCommit('c1', 'feat: add something')],
      release: { type: 'minor' },
    },
    {
      package: { name: 'b', dependencies: ['d'] },
      history: [],
      release: null,
    },
    {
      package: { name: 'c', dependencies: ['a', 'b'] },
      history: [],
      release: null,
    },
    {
      package: { name: 'd', dependencies: ['c'] },
      history: [],
      release: null,
    },
  ] as ReleasePlan[]

  expect(await propagateDependencyUpdates(context.cwd, plans))
    .toMatchInlineSnapshot(`
      [
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:00.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:01.000Z",
              "files": [],
              "footer": null,
              "hash": "c1",
              "header": "feat: add something",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add something",
              "trailers": [],
              "type": "feat",
            },
          ],
          "package": {
            "dependencies": [],
            "name": "a",
          },
          "release": {
            "type": "minor",
          },
        },
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:00.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:01.000Z",
              "files": [],
              "footer": null,
              "hash": "c1",
              "header": "feat: add something",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add something",
              "trailers": [],
              "type": "feat",
            },
          ],
          "package": {
            "dependencies": [
              "d",
            ],
            "name": "b",
          },
          "release": {
            "type": "patch",
          },
        },
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:00.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:01.000Z",
              "files": [],
              "footer": null,
              "hash": "c1",
              "header": "feat: add something",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add something",
              "trailers": [],
              "type": "feat",
            },
          ],
          "package": {
            "dependencies": [
              "a",
              "b",
            ],
            "name": "c",
          },
          "release": {
            "type": "patch",
          },
        },
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:00.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:01.000Z",
              "files": [],
              "footer": null,
              "hash": "c1",
              "header": "feat: add something",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add something",
              "trailers": [],
              "type": "feat",
            },
          ],
          "package": {
            "dependencies": [
              "c",
            ],
            "name": "d",
          },
          "release": {
            "type": "patch",
          },
        },
      ]
    `)
})

test('propagates patch releases even with missing package names', async () => {
  const plans = [
    {
      package: { name: undefined, dependencies: ['a', 'c'] },
      history: [],
      release: null,
    },
    {
      package: { name: 'a', dependencies: ['b', 'c'] },
      history: [],
      release: null,
    },
    {
      package: { name: 'b', dependencies: ['a'] },
      history: [await createMockCommit('c1', 'feat: add something')],
      release: { type: 'major' },
    },
    {
      package: { name: 'c', dependencies: [] },
      history: [await createMockCommit('c1', 'feat: add something')],
      release: { type: 'minor' },
    },
    {
      package: { name: 'd', dependencies: [] },
      history: [await createMockCommit('c2', 'feat: add something')],
      release: { type: 'minor' },
    },
    {
      package: { name: 'e', dependencies: [] },
      history: [],
      release: { type: 'unknown' },
    },
    {
      package: { name: '', dependencies: ['a', 'd'] },
      history: [],
      release: null,
    },
  ] as ReleasePlan[]

  expect(await propagateDependencyUpdates(context.cwd, plans))
    .toMatchInlineSnapshot(`
      [
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:00.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:01.000Z",
              "files": [],
              "footer": null,
              "hash": "c1",
              "header": "feat: add something",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add something",
              "trailers": [],
              "type": "feat",
            },
          ],
          "package": {
            "dependencies": [
              "a",
              "c",
            ],
            "name": undefined,
          },
          "release": {
            "type": "patch",
          },
        },
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:00.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:01.000Z",
              "files": [],
              "footer": null,
              "hash": "c1",
              "header": "feat: add something",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add something",
              "trailers": [],
              "type": "feat",
            },
          ],
          "package": {
            "dependencies": [
              "b",
              "c",
            ],
            "name": "a",
          },
          "release": {
            "type": "patch",
          },
        },
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:00.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:01.000Z",
              "files": [],
              "footer": null,
              "hash": "c1",
              "header": "feat: add something",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add something",
              "trailers": [],
              "type": "feat",
            },
          ],
          "package": {
            "dependencies": [
              "a",
            ],
            "name": "b",
          },
          "release": {
            "type": "major",
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
              "hash": "c1",
              "header": "feat: add something",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add something",
              "trailers": [],
              "type": "feat",
            },
          ],
          "package": {
            "dependencies": [],
            "name": "c",
          },
          "release": {
            "type": "minor",
          },
        },
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:04.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:05.000Z",
              "files": [],
              "footer": null,
              "hash": "c2",
              "header": "feat: add something",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add something",
              "trailers": [],
              "type": "feat",
            },
          ],
          "package": {
            "dependencies": [],
            "name": "d",
          },
          "release": {
            "type": "minor",
          },
        },
        {
          "history": [],
          "package": {
            "dependencies": [],
            "name": "e",
          },
          "release": {
            "type": "unknown",
          },
        },
        {
          "history": [
            {
              "authorDate": "2026-01-01T00:00:04.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:05.000Z",
              "files": [],
              "footer": null,
              "hash": "c2",
              "header": "feat: add something",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add something",
              "trailers": [],
              "type": "feat",
            },
            {
              "authorDate": "2026-01-01T00:00:00.000Z",
              "body": null,
              "committerDate": "2026-01-01T00:00:01.000Z",
              "files": [],
              "footer": null,
              "hash": "c1",
              "header": "feat: add something",
              "mentions": [],
              "merge": null,
              "notes": [],
              "parent": [],
              "references": [],
              "revert": null,
              "scope": null,
              "subject": "add something",
              "trailers": [],
              "type": "feat",
            },
          ],
          "package": {
            "dependencies": [
              "a",
              "d",
            ],
            "name": "",
          },
          "release": {
            "type": "patch",
          },
        },
      ]
    `)
})
