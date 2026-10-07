// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { GIT_PRETTY_FIELD_SEPARATOR, parseGitPrettyFormat } from '@reelout/core'
import { expect, test } from 'vitest'

test('throws on input without separators', () => {
  const raw = 'malformed-string-without-delimiters'

  expect(() => parseGitPrettyFormat(raw)).toThrowErrorMatchingInlineSnapshot(
    `[Error: The input "[1mmalformed-string-without-delimiters[22m" is not in the expected pretty format.]`
  )
})

test('throws when hash is missing or empty', () => {
  const raw = [
    '',
    'def456',
    '2026-01-01T00:00:00Z',
    '2026-02-01T00:00:00Z',
    'feat: add core engine',
  ].join(GIT_PRETTY_FIELD_SEPARATOR)

  expect(() => parseGitPrettyFormat(raw)).toThrowErrorMatchingInlineSnapshot(
    `[Error: The input "[1mdef4562026-01-01T00:00:00Z2026-02-01T00:00:00Zfeat: add core engine[22m" is not in the expected pretty format.]`
  )
})

test('throws when authorDate is missing or empty', () => {
  const raw = [
    'abc1234',
    'def456',
    '',
    '2026-02-01T00:00:00Z',
    'feat: add core engine',
  ].join(GIT_PRETTY_FIELD_SEPARATOR)

  expect(() => parseGitPrettyFormat(raw)).toThrowErrorMatchingInlineSnapshot(
    `[Error: The input "[1mabc1234def4562026-02-01T00:00:00Zfeat: add core engine[22m" is not in the expected pretty format.]`
  )
})

test('throws when committerDate is missing or empty', () => {
  const raw = [
    'abc1234',
    'def456',
    '2026-01-01T00:00:00Z',
    '',
    'feat: add core engine',
  ].join(GIT_PRETTY_FIELD_SEPARATOR)

  expect(() => parseGitPrettyFormat(raw)).toThrowErrorMatchingInlineSnapshot(
    `[Error: The input "[1mabc1234def4562026-01-01T00:00:00Zfeat: add core engine[22m" is not in the expected pretty format.]`
  )
})

test('throws when subject field is absent', () => {
  const raw = [
    'abc1234',
    'def456',
    '2026-01-01T00:00:00Z',
    '2026-02-01T00:00:00Z',
  ].join(GIT_PRETTY_FIELD_SEPARATOR)

  expect(() => parseGitPrettyFormat(raw)).toThrowErrorMatchingInlineSnapshot(
    `[Error: The input "[1mabc1234def4562026-01-01T00:00:00Z2026-02-01T00:00:00Z[22m" is not in the expected pretty format.]`
  )
})

test('parses minimal entry with empty parent', () => {
  const raw = [
    'abc1234',
    '',
    '2026-01-01T00:00:00Z',
    '2026-02-01T00:00:00Z',
    'feat: add core engine',
  ].join(GIT_PRETTY_FIELD_SEPARATOR)

  expect(parseGitPrettyFormat(raw)).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "",
      "committerDate": "2026-02-01T00:00:00.000Z",
      "files": [],
      "hash": "abc1234",
      "parent": [],
      "subject": "feat: add core engine",
    }
  `)
})

test('parses multiple parent hashes', () => {
  const raw = [
    'abc1234',
    'def456 ghi789 jkl012',
    '2026-01-01T00:00:00Z',
    '2026-02-01T00:00:00Z',
    'feat: add core engine',
  ].join(GIT_PRETTY_FIELD_SEPARATOR)

  expect(parseGitPrettyFormat(raw)).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "",
      "committerDate": "2026-02-01T00:00:00.000Z",
      "files": [],
      "hash": "abc1234",
      "parent": [
        "def456",
        "ghi789",
        "jkl012",
      ],
      "subject": "feat: add core engine",
    }
  `)
})

test('trims whitespace from fields before parsing', () => {
  const raw = [
    '  abc1234  ',
    '  def456  ghi789  ',
    '  2026-01-01T00:00:00Z  ',
    '  2026-02-01T00:00:00Z  ',
    '  feat: add core engine  ',
  ].join(GIT_PRETTY_FIELD_SEPARATOR)

  expect(parseGitPrettyFormat(raw)).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "",
      "committerDate": "2026-02-01T00:00:00.000Z",
      "files": [],
      "hash": "abc1234",
      "parent": [
        "def456",
        "ghi789",
      ],
      "subject": "feat: add core engine",
    }
  `)
})

test('accepts empty subject when present', () => {
  const raw = [
    'abc1234',
    'def456',
    '2026-01-01T00:00:00Z',
    '2026-02-01T00:00:00Z',
    '',
  ].join(GIT_PRETTY_FIELD_SEPARATOR)

  expect(parseGitPrettyFormat(raw)).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "",
      "committerDate": "2026-02-01T00:00:00.000Z",
      "files": [],
      "hash": "abc1234",
      "parent": [
        "def456",
      ],
      "subject": "",
    }
  `)
})

test('extracts multi-line body when files are absent', () => {
  const raw = [
    'abc1234',
    'def456',
    '2026-01-01T00:00:00Z',
    '2026-02-01T00:00:00Z',
    'feat: add core engine',
    'Detailed description of the change\n\nBREAKING CHANGE: api mutation change.',
  ].join(GIT_PRETTY_FIELD_SEPARATOR)

  expect(parseGitPrettyFormat(raw)).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "Detailed description of the change

    BREAKING CHANGE: api mutation change.",
      "committerDate": "2026-02-01T00:00:00.000Z",
      "files": [],
      "hash": "abc1234",
      "parent": [
        "def456",
      ],
      "subject": "feat: add core engine",
    }
  `)
})

test('parses newline-separated files into array', () => {
  const raw = [
    'abc1234',
    'def456',
    '2026-01-01T00:00:00Z',
    '2026-02-01T00:00:00Z',
    'feat: add core engine',
    '',
    ['src/index.ts', 'README.md'].join('\n'),
  ].join(GIT_PRETTY_FIELD_SEPARATOR)

  expect(parseGitPrettyFormat(raw)).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "",
      "committerDate": "2026-02-01T00:00:00.000Z",
      "files": [
        "src/index.ts",
        "README.md",
      ],
      "hash": "abc1234",
      "parent": [
        "def456",
      ],
      "subject": "feat: add core engine",
    }
  `)
})

test('parses body and files when both are present', () => {
  const raw = [
    'abc1234',
    'def456',
    '2026-01-01T00:00:00Z',
    '2026-02-01T00:00:00Z',
    'feat: add core engine',
    'Detailed description of the change',
    ['src/index.ts', 'README.md'].join('\n'),
  ].join(GIT_PRETTY_FIELD_SEPARATOR)

  expect(parseGitPrettyFormat(raw)).toMatchInlineSnapshot(`
    {
      "authorDate": "2026-01-01T00:00:00.000Z",
      "body": "Detailed description of the change",
      "committerDate": "2026-02-01T00:00:00.000Z",
      "files": [
        "src/index.ts",
        "README.md",
      ],
      "hash": "abc1234",
      "parent": [
        "def456",
      ],
      "subject": "feat: add core engine",
    }
  `)
})
