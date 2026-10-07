// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { expect, test } from 'vitest'
import { createMockCommit } from '../../../../../test/mock/git'

test('throws error for empty commit payload', async () => {
  const commit = createMockCommit('f47ac10b', '')

  await expect(commit).rejects.toThrowErrorMatchingInlineSnapshot(
    `[TypeError: Expected a raw commit]`
  )
})

test('parses commit with minimal parameters and default values', async () => {
  const commit = await createMockCommit(
    'a1b2c3d4',
    'chore(release): prepare for production release',
    'Updates dependencies and documentation.',
    []
  )

  expect(commit).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "Updates dependencies and documentation.",
      "committerDate": "2026-01-01T00:00:01.000Z",
      "files": [],
      "footer": null,
      "hash": "a1b2c3d4",
      "header": "chore(release): prepare for production release",
      "mentions": [],
      "merge": null,
      "notes": [],
      "parent": [],
      "references": [],
      "revert": null,
      "scope": "release",
      "subject": "prepare for production release",
      "trailers": [],
      "type": "chore",
    }
  `)
})

test('parses non-conventional commit with empty body', async () => {
  const commit = await createMockCommit(
    '987654321',
    'update project documentation',
    '',
    []
  )

  expect(commit).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": null,
      "committerDate": "2026-01-01T00:00:01.000Z",
      "files": [],
      "footer": null,
      "hash": "987654321",
      "header": "update project documentation",
      "mentions": [],
      "merge": null,
      "notes": [],
      "parent": [],
      "references": [],
      "revert": null,
      "scope": null,
      "subject": null,
      "trailers": [],
      "type": null,
    }
  `)
})

test('parses conventional commit with retained modified file paths', async () => {
  const commit = await createMockCommit(
    'deadbeef',
    'fix(parser): resolve edge case handling',
    'Corrected validation check during parsing',
    ['src/parser/index.ts', 'test/parser/index.test.ts']
  )

  expect(commit).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "Corrected validation check during parsing",
      "committerDate": "2026-01-01T00:00:01.000Z",
      "files": [
        "src/parser/index.ts",
        "test/parser/index.test.ts",
      ],
      "footer": null,
      "hash": "deadbeef",
      "header": "fix(parser): resolve edge case handling",
      "mentions": [],
      "merge": null,
      "notes": [],
      "parent": [],
      "references": [],
      "revert": null,
      "scope": "parser",
      "subject": "resolve edge case handling",
      "trailers": [],
      "type": "fix",
    }
  `)
})

test('flags breaking change from exclamation mark in unscoped header', async () => {
  const commit = await createMockCommit(
    '55667788',
    'refactor!: restructure internal module exports',
    '',
    []
  )

  expect(commit).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": null,
      "committerDate": "2026-01-01T00:00:01.000Z",
      "files": [],
      "footer": null,
      "hash": "55667788",
      "header": "refactor!: restructure internal module exports",
      "mentions": [],
      "merge": null,
      "notes": [
        {
          "text": "restructure internal module exports",
          "title": "BREAKING CHANGE",
        },
      ],
      "parent": [],
      "references": [],
      "revert": null,
      "scope": null,
      "subject": "restructure internal module exports",
      "trailers": [
        {
          "key": "BREAKING CHANGE",
          "value": "restructure internal module exports",
        },
      ],
      "type": "refactor",
    }
  `)
})

test('flags breaking change from exclamation mark in scoped header', async () => {
  const commit = await createMockCommit(
    '99aabbcc',
    'refactor(api/v1)!: update payload structure',
    '',
    []
  )

  expect(commit).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": null,
      "committerDate": "2026-01-01T00:00:01.000Z",
      "files": [],
      "footer": null,
      "hash": "99aabbcc",
      "header": "refactor(api/v1)!: update payload structure",
      "mentions": [],
      "merge": null,
      "notes": [
        {
          "text": "update payload structure",
          "title": "BREAKING CHANGE",
        },
      ],
      "parent": [],
      "references": [],
      "revert": null,
      "scope": "api/v1",
      "subject": "update payload structure",
      "trailers": [
        {
          "key": "BREAKING CHANGE",
          "value": "update payload structure",
        },
      ],
      "type": "refactor",
    }
  `)
})

test('flags breaking change from explicit footer note', async () => {
  const commit = await createMockCommit(
    'ddeeff00',
    'feat(storage): introduce new caching strategy',
    'Added memory-efficient storage backend.\n\nBREAKING CHANGE: Dropped support for legacy storage adapters.',
    ['src/storage/cache.ts']
  )

  expect(commit).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "Added memory-efficient storage backend.",
      "committerDate": "2026-01-01T00:00:01.000Z",
      "files": [
        "src/storage/cache.ts",
      ],
      "footer": "BREAKING CHANGE: Dropped support for legacy storage adapters.",
      "hash": "ddeeff00",
      "header": "feat(storage): introduce new caching strategy",
      "mentions": [],
      "merge": null,
      "notes": [
        {
          "text": "Dropped support for legacy storage adapters.",
          "title": "BREAKING CHANGE",
        },
      ],
      "parent": [],
      "references": [],
      "revert": null,
      "scope": "storage",
      "subject": "introduce new caching strategy",
      "trailers": [
        {
          "key": "BREAKING CHANGE",
          "value": "Dropped support for legacy storage adapters.",
        },
      ],
      "type": "feat",
    }
  `)
})

test('flags breaking change from custom header and marker combination', async () => {
  const commit = await createMockCommit(
    '2468ace0',
    'feat!: update authentication flow',
    'BREAKING AMEND: security token format changed',
    [],
    ['BREAKING AMEND']
  )

  expect(commit).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "",
      "committerDate": "2026-01-01T00:00:01.000Z",
      "files": [],
      "footer": "BREAKING AMEND: security token format changed",
      "hash": "2468ace0",
      "header": "feat!: update authentication flow",
      "mentions": [],
      "merge": null,
      "notes": [
        {
          "text": "update authentication flow",
          "title": "BREAKING CHANGE",
        },
      ],
      "parent": [],
      "references": [],
      "revert": null,
      "scope": null,
      "subject": "update authentication flow",
      "trailers": [
        {
          "key": "BREAKING AMEND",
          "value": "security token format changed",
        },
        {
          "key": "BREAKING CHANGE",
          "value": "update authentication flow",
        },
      ],
      "type": "feat",
    }
  `)
})

test('handles breaking change specified in both header and footer', async () => {
  const commit = await createMockCommit(
    '13579bdf',
    'feat!: major architectural redesign',
    'BREAKING CHANGE: complete overhaul of core services',
    []
  )

  expect(commit).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "",
      "committerDate": "2026-01-01T00:00:01.000Z",
      "files": [],
      "footer": "BREAKING CHANGE: complete overhaul of core services",
      "hash": "13579bdf",
      "header": "feat!: major architectural redesign",
      "mentions": [],
      "merge": null,
      "notes": [
        {
          "text": "complete overhaul of core services",
          "title": "BREAKING CHANGE",
        },
      ],
      "parent": [],
      "references": [],
      "revert": null,
      "scope": null,
      "subject": "major architectural redesign",
      "trailers": [
        {
          "key": "BREAKING CHANGE",
          "value": "complete overhaul of core services",
        },
      ],
      "type": "feat",
    }
  `)
})

test('preserves multi-line formatting in breaking change note text', async () => {
  const commit = await createMockCommit(
    '77889900',
    'feat(config): change settings architecture',
    [
      'Initial context for configuration changes.',
      '',
      'BREAKING CHANGE: Configuration structure is now strict.',
      'Migration steps:',
      '1. Export current settings',
      '2. Validate schema compliance',
    ].join('\n'),
    []
  )

  expect(commit).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "Initial context for configuration changes.",
      "committerDate": "2026-01-01T00:00:01.000Z",
      "files": [],
      "footer": "BREAKING CHANGE: Configuration structure is now strict.
    Migration steps:
    1. Export current settings
    2. Validate schema compliance",
      "hash": "77889900",
      "header": "feat(config): change settings architecture",
      "mentions": [],
      "merge": null,
      "notes": [
        {
          "text": "Configuration structure is now strict.
    Migration steps:
    1. Export current settings
    2. Validate schema compliance",
          "title": "BREAKING CHANGE",
        },
      ],
      "parent": [],
      "references": [],
      "revert": null,
      "scope": "config",
      "subject": "change settings architecture",
      "trailers": [
        {
          "key": "BREAKING CHANGE",
          "value": "Configuration structure is now strict.
    Migration steps:
    1. Export current settings
    2. Validate schema compliance",
        },
      ],
      "type": "feat",
    }
  `)
})

test('parses multiple footer notes including custom breaking markers', async () => {
  const commit = await createMockCommit(
    '1a2b3c4d',
    'feat(core): introduce plugin architecture',
    'BREAKING CHANGE: Plugin API has been completely redesigned.\nREVIEWED BY: Architecture Team',
    [],
    ['REVIEWED BY']
  )

  expect(commit).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "",
      "committerDate": "2026-01-01T00:00:01.000Z",
      "files": [],
      "footer": "BREAKING CHANGE: Plugin API has been completely redesigned.
    REVIEWED BY: Architecture Team",
      "hash": "1a2b3c4d",
      "header": "feat(core): introduce plugin architecture",
      "mentions": [],
      "merge": null,
      "notes": [
        {
          "text": "Plugin API has been completely redesigned.",
          "title": "BREAKING CHANGE",
        },
      ],
      "parent": [],
      "references": [],
      "revert": null,
      "scope": "core",
      "subject": "introduce plugin architecture",
      "trailers": [
        {
          "key": "BREAKING CHANGE",
          "value": "Plugin API has been completely redesigned.",
        },
        {
          "key": "REVIEWED BY",
          "value": "Architecture Team",
        },
      ],
      "type": "feat",
    }
  `)
})

test('parses consecutive footer notes following multi-line breaking note', async () => {
  const commit = await createMockCommit(
    'aabbccdd',
    'feat(router): overhaul route matching',
    [
      'BREAKING CHANGE: Route paths are now case-sensitive.',
      'Subsequent detail line for the note.',
      'Co-authored-by: Contributor <contributor@example.com>',
    ].join('\n'),
    []
  )

  expect(commit).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "",
      "committerDate": "2026-01-01T00:00:01.000Z",
      "files": [],
      "footer": "BREAKING CHANGE: Route paths are now case-sensitive.
    Subsequent detail line for the note.
    Co-authored-by: Contributor <contributor@example.com>",
      "hash": "aabbccdd",
      "header": "feat(router): overhaul route matching",
      "mentions": [],
      "merge": null,
      "notes": [
        {
          "text": "Route paths are now case-sensitive.
    Subsequent detail line for the note.",
          "title": "BREAKING CHANGE",
        },
      ],
      "parent": [],
      "references": [],
      "revert": null,
      "scope": "router",
      "subject": "overhaul route matching",
      "trailers": [
        {
          "key": "BREAKING CHANGE",
          "value": "Route paths are now case-sensitive.
    Subsequent detail line for the note.",
        },
        {
          "key": "Co-authored-by",
          "value": "Contributor <contributor@example.com>",
        },
      ],
      "type": "feat",
    }
  `)
})

test('parses multiple trailers and footer notes', async () => {
  const commit = await createMockCommit(
    'c0ffee42',
    'chore(deps): bump version to two',
    'Upgraded internal packages.\n\nSigned-off-by: Code Reviewer <reviewer@example.com>\nChange-Id: I123456789abcdef',
    []
  )

  expect(commit).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "Upgraded internal packages.",
      "committerDate": "2026-01-01T00:00:01.000Z",
      "files": [],
      "footer": "Signed-off-by: Code Reviewer <reviewer@example.com>
    Change-Id: I123456789abcdef",
      "hash": "c0ffee42",
      "header": "chore(deps): bump version to two",
      "mentions": [],
      "merge": null,
      "notes": [],
      "parent": [],
      "references": [],
      "revert": null,
      "scope": "deps",
      "subject": "bump version to two",
      "trailers": [
        {
          "key": "Signed-off-by",
          "value": "Code Reviewer <reviewer@example.com>",
        },
        {
          "key": "Change-Id",
          "value": "I123456789abcdef",
        },
      ],
      "type": "chore",
    }
  `)
})

test('parses custom markers and trailers', async () => {
  const commit = await createMockCommit(
    'aabbccdd',
    'feat(auth): add OAuth2 login support',
    'Implemented Google and GitHub authentication providers.\n\nTested by: Security Team <security@example.com>',
    [],
    ['Tested by']
  )

  expect(commit).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "Implemented Google and GitHub authentication providers.",
      "committerDate": "2026-01-01T00:00:01.000Z",
      "files": [],
      "footer": "Tested by: Security Team <security@example.com>",
      "hash": "aabbccdd",
      "header": "feat(auth): add OAuth2 login support",
      "mentions": [],
      "merge": null,
      "notes": [],
      "parent": [],
      "references": [],
      "revert": null,
      "scope": "auth",
      "subject": "add OAuth2 login support",
      "trailers": [
        {
          "key": "Tested by",
          "value": "Security Team <security@example.com>",
        },
      ],
      "type": "feat",
    }
  `)
})
