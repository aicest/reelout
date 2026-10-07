// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import * as module from 'reelout'
import { expect, test } from 'vitest'

test('exposes the correct API contract', () => {
  expect(Object.keys(module).sort()).toMatchInlineSnapshot(`
    [
      "DEFAULT_CHANGELOG_FILE",
      "GIT_TRAILER_RELEASE_AGENT",
      "SEMVER_REGEX",
      "buildChangelog",
      "buildTrailerPattern",
      "compact",
      "countGitHistory",
      "createGitTag",
      "deleteGitTag",
      "ensureGitTag",
      "execCommand",
      "execGit",
      "extractLatestVersion",
      "extractMentions",
      "extractPlainText",
      "extractPreviousVersion",
      "extractSemVer",
      "formatError",
      "formatFile",
      "generateGitTagName",
      "getCurrentGitTag",
      "getLatestGitTag",
      "interpolate",
      "isCI",
      "isDefined",
      "isGitAncestor",
      "isGitShallowRepository",
      "isGitTagConnected",
      "isGitTagPointed",
      "isGitTagPresent",
      "isMatch",
      "isSemVer",
      "isTruthyString",
      "iterateChangelogVersions",
      "parseGitCommit",
      "prependChangelog",
      "pushGitChanges",
      "readJson",
      "resolveGitRevision",
      "unique",
      "withShallowLock",
      "writeChangelog",
      "writeJson",
    ]
  `)
})
