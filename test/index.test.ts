// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import * as module from 'reelout'
import { expect, test } from 'vitest'

test('exposes the correct API contract', () => {
  expect(Object.keys(module).sort()).toMatchInlineSnapshot(`
    [
      "buildTrailerPattern",
      "compact",
      "execCommand",
      "execGit",
      "extractMentions",
      "formatError",
      "formatFile",
      "interpolate",
      "isCI",
      "isDefined",
      "isMatch",
      "isSemVer",
      "isTruthyString",
      "parseGitCommit",
      "readJson",
      "unique",
      "writeJson",
    ]
  `)
})
