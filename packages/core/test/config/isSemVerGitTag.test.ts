// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isSemVerGitTag } from '@reelout/core'
import { expect, test } from 'vitest'

const validPatterns = [
  '0.0.4',
  '1.2.3',
  '10.20.30',
  '1.1.2-prerelease+meta',
  '1.1.2+meta',
  '1.1.2+meta-valid',
  '1.0.0-alpha',
  '1.0.0-beta',
  '1.0.0-alpha.beta',
  '1.0.0-alpha.beta.1',
  '1.0.0-alpha.1',
  '1.0.0-alpha0.valid',
  '1.0.0-alpha.0valid',
  '1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay',
  '1.0.0-rc.1+build.1',
  '2.0.0-rc.1+build.123',
  '1.2.3-beta',
  '10.2.3-DEV-SNAPSHOT',
  '1.2.3-SNAPSHOT-123',
  '1.0.0',
  '2.0.0',
  '1.1.7',
  '2.0.0+build.1848',
  '2.0.1-alpha.1227',
  '1.0.0-alpha+beta',
  '1.2.3----RC-SNAPSHOT.12.9.1--.12+788',
  '1.2.3----R-S.12.9.1--.12+meta',
  '1.2.3----RC-SNAPSHOT.12.9.1--.12',
  '1.0.0+0.build.1-rc.10000aaa-kk-0.1',
  '99999999999999999999999.999999999999999999.99999999999999999',
  '1.0.0-0A.is.legal',
]

test('recognizes valid semver tags', () => {
  for (const pattern of validPatterns) {
    expect({
      pattern,
      isSemVerGitTag: isSemVerGitTag(`v${pattern}`),
    }).toEqual({
      pattern,
      isSemVerGitTag: true,
    })
  }
})

test('recognizes patterns with wildcards', () => {
  const arr: string[] = []

  for (let pattern of validPatterns) {
    const RE = /(?<!\+.*)(?:(?<!-.*)\d+\b|(?<=\.)\d+\b(?!-))/

    while (RE.test(pattern)) {
      pattern = pattern.replace(RE, '*')

      arr.push(pattern)

      expect({
        pattern,
        isSemVerGitTag: isSemVerGitTag(`v${pattern}`),
      }).toEqual({
        pattern,
        isSemVerGitTag: true,
      })
    }
  }

  expect(arr).toMatchInlineSnapshot(`
    [
      "*.0.4",
      "*.*.4",
      "*.*.*",
      "*.2.3",
      "*.*.3",
      "*.*.*",
      "*.20.30",
      "*.*.30",
      "*.*.*",
      "*.1.2-prerelease+meta",
      "*.*.2-prerelease+meta",
      "*.*.*-prerelease+meta",
      "*.1.2+meta",
      "*.*.2+meta",
      "*.*.*+meta",
      "*.1.2+meta-valid",
      "*.*.2+meta-valid",
      "*.*.*+meta-valid",
      "*.0.0-alpha",
      "*.*.0-alpha",
      "*.*.*-alpha",
      "*.0.0-beta",
      "*.*.0-beta",
      "*.*.*-beta",
      "*.0.0-alpha.beta",
      "*.*.0-alpha.beta",
      "*.*.*-alpha.beta",
      "*.0.0-alpha.beta.1",
      "*.*.0-alpha.beta.1",
      "*.*.*-alpha.beta.1",
      "*.*.*-alpha.beta.*",
      "*.0.0-alpha.1",
      "*.*.0-alpha.1",
      "*.*.*-alpha.1",
      "*.*.*-alpha.*",
      "*.0.0-alpha0.valid",
      "*.*.0-alpha0.valid",
      "*.*.*-alpha0.valid",
      "*.0.0-alpha.0valid",
      "*.*.0-alpha.0valid",
      "*.*.*-alpha.0valid",
      "*.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay",
      "*.*.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay",
      "*.*.*-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay",
      "*.0.0-rc.1+build.1",
      "*.*.0-rc.1+build.1",
      "*.*.*-rc.1+build.1",
      "*.*.*-rc.*+build.1",
      "*.0.0-rc.1+build.123",
      "*.*.0-rc.1+build.123",
      "*.*.*-rc.1+build.123",
      "*.*.*-rc.*+build.123",
      "*.2.3-beta",
      "*.*.3-beta",
      "*.*.*-beta",
      "*.2.3-DEV-SNAPSHOT",
      "*.*.3-DEV-SNAPSHOT",
      "*.*.*-DEV-SNAPSHOT",
      "*.2.3-SNAPSHOT-123",
      "*.*.3-SNAPSHOT-123",
      "*.*.*-SNAPSHOT-123",
      "*.0.0",
      "*.*.0",
      "*.*.*",
      "*.0.0",
      "*.*.0",
      "*.*.*",
      "*.1.7",
      "*.*.7",
      "*.*.*",
      "*.0.0+build.1848",
      "*.*.0+build.1848",
      "*.*.*+build.1848",
      "*.0.1-alpha.1227",
      "*.*.1-alpha.1227",
      "*.*.*-alpha.1227",
      "*.*.*-alpha.*",
      "*.0.0-alpha+beta",
      "*.*.0-alpha+beta",
      "*.*.*-alpha+beta",
      "*.2.3----RC-SNAPSHOT.12.9.1--.12+788",
      "*.*.3----RC-SNAPSHOT.12.9.1--.12+788",
      "*.*.*----RC-SNAPSHOT.12.9.1--.12+788",
      "*.*.*----RC-SNAPSHOT.*.9.1--.12+788",
      "*.*.*----RC-SNAPSHOT.*.*.1--.12+788",
      "*.*.*----RC-SNAPSHOT.*.*.1--.*+788",
      "*.2.3----R-S.12.9.1--.12+meta",
      "*.*.3----R-S.12.9.1--.12+meta",
      "*.*.*----R-S.12.9.1--.12+meta",
      "*.*.*----R-S.*.9.1--.12+meta",
      "*.*.*----R-S.*.*.1--.12+meta",
      "*.*.*----R-S.*.*.1--.*+meta",
      "*.2.3----RC-SNAPSHOT.12.9.1--.12",
      "*.*.3----RC-SNAPSHOT.12.9.1--.12",
      "*.*.*----RC-SNAPSHOT.12.9.1--.12",
      "*.*.*----RC-SNAPSHOT.*.9.1--.12",
      "*.*.*----RC-SNAPSHOT.*.*.1--.12",
      "*.*.*----RC-SNAPSHOT.*.*.1--.*",
      "*.0.0+0.build.1-rc.10000aaa-kk-0.1",
      "*.*.0+0.build.1-rc.10000aaa-kk-0.1",
      "*.*.*+0.build.1-rc.10000aaa-kk-0.1",
      "*.999999999999999999.99999999999999999",
      "*.*.99999999999999999",
      "*.*.*",
      "*.0.0-0A.is.legal",
      "*.*.0-0A.is.legal",
      "*.*.*-0A.is.legal",
    ]
  `)
})

test('returns expected boolean for scoped and wildcard patterns', () => {
  for (const [pattern, expected] of [
    ['foo@1.0.0', true],
    ['*@1.0.0', true],
    ['@1.0.0', false],

    ['@foo@1.0.0', false],
    ['@*@1.0.0', false],
    ['@@1.0.0', false],

    ['@foo/bar@1.0.0', true],
    ['@foo/*@1.0.0', true],
    ['@foo/@1.0.0', false],

    ['@*/bar@1.0.0', true],
    ['@*/*@1.0.0', true],
    ['@*/@1.0.0', false],
  ] as const) {
    expect({
      pattern,
      isSemVerGitTag: isSemVerGitTag(pattern),
    }).toEqual({
      pattern,
      isSemVerGitTag: expected,
    })
  }
})

test('accepts tags with trailing hyphen segments', () => {
  for (const pattern of [
    'v1.0.0-beta-',
    'v1.0.0-beta.x',
    'v1.0.0-beta.x-',
    'v1.2.3-snapshot-',
  ]) {
    expect({
      pattern,
      isSemVerGitTag: isSemVerGitTag(pattern),
    }).toEqual({
      pattern,
      isSemVerGitTag: true,
    })
  }
})

test('rejects patterns with invalid boundary sequences', () => {
  const invalidPatterns = [
    '1.0.0',
    ' v1.0.0',
    'v1.0.0 ',
    'v3.1.2-rc.1 ',
    'v1.0.0-alpha build',

    '-v1.0.0',
    '.1.0.0',
    'vv1.0.0',
    'version1.0.0',
    'release-v2.0.0',

    '/@foo/bar@1.0.0',
    '@@foo/bar@1.0.0',
    '@foo/bar@1.0.0-',
    'abc@foo/bar@1.0.0',

    'v1.0.0.patch',
    'v1.2.3.4',
    'v2.0.0+meta+',
  ]

  for (const pattern of invalidPatterns) {
    expect({
      pattern,
      isSemVerGitTag: isSemVerGitTag(pattern),
    }).toEqual({
      pattern,
      isSemVerGitTag: false,
    })
  }
})
