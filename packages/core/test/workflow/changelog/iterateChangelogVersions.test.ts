// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { iterateChangelogVersions } from '@reelout/core'
import { expect, test } from 'vitest'
import { stripLeadingSpaces } from '../../../../../test/mock/changelog'

function getVersions(changelogContent: string): string[] {
  return Array.from(iterateChangelogVersions(changelogContent))
}

test('extracts versions from H1 headings', () => {
  const changelog = stripLeadingSpaces(`
    # 3.0.0-rc.1

    Evaluating internal edge distribution network layouts.

    # 3.0.0-dev.1

    Validating canvas matrix interpolation modules.

    # 2.2.0

    Stable generation cycle targeting low latency runtimes.
  `)

  expect(getVersions(changelog)).toEqual(['3.0.0-rc.1', '3.0.0-dev.1', '2.2.0'])
})

test('extracts versions from H2 headings', () => {
  const changelog = stripLeadingSpaces(`
    # Changelog

    ## 2.0.0

    Closes #184 and optimizes tree shaking workflows.

    ## 1.0.0

    Legacy baseline deployment footprint.
  `)

  expect(getVersions(changelog)).toEqual(['2.0.0', '1.0.0'])
})

test('extracts versions from nested headings (H3–H6)', () => {
  const changelog = stripLeadingSpaces(`
    # Changelog

    ### 3.1.0

    Refactor internal pipeline execution contexts.

    #### 3.0.0-rc.2

    Validate edge runtime environment features.

    ##### 2.5.0

    Optimize AST node tree traversal loops.

    ###### 2.0.0

    Initial stable underlying architecture baseline.
  `)

  expect(getVersions(changelog)).toEqual([
    '3.1.0',
    '3.0.0-rc.2',
    '2.5.0',
    '2.0.0',
  ])
})

test('falls back to paragraph versions when no headings contain versions', () => {
  const changelog = stripLeadingSpaces(`
    Changelog Updates

    v2.1.0 - May 1, 2026

    Patch catastrophic memory leaks during intensive stream allocation.

    v2.0.0 - March 1, 2026

    Initialize downstream event emitter handlers.
  `)

  expect(getVersions(changelog)).toEqual(['2.1.0', '2.0.0'])
})

test('prioritizes heading versions over paragraph candidates', () => {
  const changelog = stripLeadingSpaces(`
    # Changelog

    ## 3.0.0

    v2.0.0 - March 1, 2026
  `)

  expect(getVersions(changelog)).toEqual(['3.0.0'])
})

test('extracts versions with emojis and trailing text', () => {
  const changelog = stripLeadingSpaces(`
    ## 🚀 v9.0.0-beta.0 - Core Engine Rewrite

    Introduce multi threaded cluster workers inside worker loop instances
  `)

  expect(getVersions(changelog)).toEqual(['9.0.0-beta.0'])
})

test('strips backticks from versions in headings', () => {
  const changelog = stripLeadingSpaces(`
    ## \`v7.2.1-beta\` - Edge Channel

    Internal pipeline testing loop targeting beta verification systems
  `)

  expect(getVersions(changelog)).toEqual(['7.2.1-beta'])
})

test('strips bold and italic formatting from versions', () => {
  const changelog = stripLeadingSpaces(`
    **_v3.0.0_** secondary text

    Drop runtime alignment layers targeting Node.js v14 profiles
  `)

  expect(getVersions(changelog)).toEqual(['3.0.0'])
})

test('extracts versions followed by ISO dates', () => {
  const changelog = stripLeadingSpaces(`
    # Changelog

    ## 2.1.0 (2026-03-01)

    - Refactor context bounds tracking logic.

    ## 2.0.0 (2026-01-01)

    - Deprecate synchronous payload streaming pipelines.
  `)

  expect(getVersions(changelog)).toEqual(['2.1.0', '2.0.0'])
})

test('extracts versions followed by human-readable dates', () => {
  const changelog = stripLeadingSpaces(`
    v1.2.0 - May 1, 2026

    * Patch catastrophic memory leaks during intensive stream allocation

    v1.1.0 - March 1, 2026

    * Initialize downstream event emitter handlers
  `)

  expect(getVersions(changelog)).toEqual(['1.2.0', '1.1.0'])
})

test('extracts versions from Markdown links', () => {
  const changelog = stripLeadingSpaces(`
    ## [v2.1.0](https://github.com)

    ### Features

    - Append secure encryption transport wrappers to ingress controllers
  `)

  expect(getVersions(changelog)).toEqual(['2.1.0'])
})

test('extracts versions from Markdown links with emojis', () => {
  const changelog = stripLeadingSpaces(`
    ## ✨ [v1.0.0-rc.1](https://github.com)

    ### Features

    - Establish automated integration deployment configurations
  `)

  expect(getVersions(changelog)).toEqual(['1.0.0-rc.1'])
})

test('extracts versions from standalone links without heading hashes', () => {
  const changelog = stripLeadingSpaces(`
    [v4.0.0](https://github.com) - Release Notes

    Migrate infrastructure architecture mapping topologies seamlessly
  `)

  expect(getVersions(changelog)).toEqual(['4.0.0'])
})

test('extracts versions embedded alongside other text in heading links', () => {
  const changelog = stripLeadingSpaces(`
    ## Release [v5.1.0](https://github.com)

    ### Patch Notes

    - Enhance layout computation benchmarks using typed matrix indices
  `)

  expect(getVersions(changelog)).toEqual(['5.1.0'])
})

test('extracts versions from a mix of linked and unlinked dated entries', () => {
  const changelog = stripLeadingSpaces(`
    # Changelog

    ## [2.0.0](https://github.com) (2026-03-01)

    - Consolidated changelog diff metadata analysis.

    ## 1.0.0 (2026-01-01)

    - Initial baseline delivery metrics.
  `)

  expect(getVersions(changelog)).toEqual(['2.0.0', '1.0.0'])
})

test('extracts the target version from linked comparison ranges', () => {
  const changelog = stripLeadingSpaces(`
    ## [v1.1.0...v1.2.0](https://github.com) (2026-01-01)

    ### Patch Notes

    - Resolve intermittent deadlocks during pipeline validation routines
  `)

  expect(getVersions(changelog)).toEqual(['1.2.0'])
})

test('extracts the target version from unlinked comparison ranges', () => {
  const changelog = stripLeadingSpaces(`
    # Changelog

    ## v1.1.0...v1.2.0-dev.0 (2026-02-01)

    Comparing active telemetry pipelines over staging branches.

    ## v1.0.0...v1.1.0 (2026-01-01)

    Historical diff reference mappings.
  `)

  expect(getVersions(changelog)).toEqual(['1.2.0-dev.0', '1.1.0'])
})

test('extracts the target version from ranges with changing prerelease tags', () => {
  const changelog = stripLeadingSpaces(`
    # Changelog

    ## [v3.0.0-alpha.5...v3.0.0-beta.1](https://github.com) (2026-03-01)

    Transitioning pipeline architectures from alpha validation to beta staging.

    ## v2.0.0-alpha.3...v2.0.0-rc.1

    Promoting release candidate configurations directly.
  `)

  expect(getVersions(changelog)).toEqual(['3.0.0-beta.1', '2.0.0-rc.1'])
})

test('extracts the target version from ranges incrementing prerelease numbers', () => {
  const changelog = stripLeadingSpaces(`
    # Changelog

    ## [v3.0.0-beta.1...v3.0.0-beta.2](https://github.com) (2026-03-15)

    Iterative beta improvements targeting memory consumption models.

    ## v1.5.0-rc.1...v1.5.0-rc.4

    Bump release candidate iterations following security audits.
  `)

  expect(getVersions(changelog)).toEqual(['3.0.0-beta.2', '1.5.0-rc.4'])
})

test('extracts highest semver when a heading line contains multiple versions', () => {
  const changelog = stripLeadingSpaces(`
    [v6.0.0](https://github.com) comparisons to [v5.0.0](https://github.com)

    ### Migrations

    - Enforce declarative state container constraints on components
  `)

  expect(getVersions(changelog)).toEqual(['6.0.0'])
})

test('extracts prerelease versions prefixed with "v"', () => {
  const changelog = stripLeadingSpaces(`
    # Changelog

    ## v2.0.0-dev.0

    Nightly pipeline build from mainline merge commits.

    ## v1.0.0

    Previous production tag marker.
  `)

  expect(getVersions(changelog)).toEqual(['2.0.0-dev.0', '1.0.0'])
})

test('extracts versions with build metadata', () => {
  const changelog = stripLeadingSpaces(`
    # Changelog

    ## v2.0.0-beta.1+exp.sha.5114f85

    Verify capability parsing constraints under compound string segments.
  `)

  expect(getVersions(changelog)).toEqual(['2.0.0-beta.1+exp.sha.5114f85'])
})

test('extracts CalVer-formatted versions inside links', () => {
  const changelog = stripLeadingSpaces(`
    ## [2026.1.1-rc.2](https://github.com)

    ### Patch Notes

    - Perform security vulnerability analysis on vendor module trees
  `)

  expect(getVersions(changelog)).toEqual(['2026.1.1-rc.2'])
})

test('ignores "Unreleased" headings', () => {
  const changelog = stripLeadingSpaces(`
    ## Unreleased

    - Refactor telemetry hooks prior to staging cycle.

    ## 2.1.0

    - Migrate schema definitions to schema version v3.

    ## 2.0.0

    - Initial robust public interface module.
  `)

  expect(getVersions(changelog)).toEqual(['2.1.0', '2.0.0'])
})

test('ignores non-semver four-digit version strings', () => {
  const changelog = stripLeadingSpaces(`
    # Changelog

    ## v1.2.3.4

    Reject invalid semantic structures exceeding patch bounds.

    ## 2.0.0

    Isolate compliant schema configurations cleanly.
  `)

  expect(getVersions(changelog)).toEqual(['2.0.0'])
})

test('ignores candidate paragraphs over 48 characters or ending with sentence punctuation', () => {
  const changelog = stripLeadingSpaces(`
    v2.1.0 - This is a candidate paragraph description that exceeds forty-eight characters limit.

    v2.0.0 - Fixed a minor bug.

    v1.0.0
  `)

  expect(getVersions(changelog)).toEqual(['1.0.0'])
})

test('ignores version numbers in body text', () => {
  const changelog = stripLeadingSpaces(`
    ## 2.0.0

    Upgraded engine from v1.8.2 to 1.9.0-rc.1.
    Fixed memory leak on Node v20.10.0.

    ## 1.0.0
  `)

  expect(getVersions(changelog)).toEqual(['2.0.0', '1.0.0'])
})

test('ignores version numbers inside list items', () => {
  const changelog = stripLeadingSpaces(`
    ## 2.0.0

    - Refactored logic present since v1.2.3
    * Upgraded baseline engine to 1.0.0-beta.1
    1. Migrated controllers from v1.0.0 to v2.0.0

    ## 1.0.0
  `)

  expect(getVersions(changelog)).toEqual(['2.0.0', '1.0.0'])
})

test('ignores version numbers in inline code blocks', () => {
  const changelog = stripLeadingSpaces(`
    # Changelog

    ## 1.1.0

    Run \`npm install @example/pkg@1.0.0\` or \`npx runner@v2.0.0-beta.1\` to initialize.

    * Execute command using \`v1.0.5\` runtime flag for low latency runtimes.
    * Output payload schema versioned at \`schema-v2.0.0.json\`.
  `)

  expect(getVersions(changelog)).toEqual(['1.1.0'])
})

test('ignores empty Markdown links', () => {
  const changelog = stripLeadingSpaces(`
    ## [](https://github.com)

    ### Empty Link Heading Case
  `)

  expect(getVersions(changelog)).toEqual([])
})

test('handles malformed or broken Markdown links gracefully', () => {
  const changelog = stripLeadingSpaces(`
    ## [v8.0.0](BrokenLink

    Verify parsing fault tolerance mechanics across truncated stream inputs
  `)

  expect(getVersions(changelog)).toEqual(['8.0.0'])
})

test('returns an empty array when no version headers are found', () => {
  const changelog = stripLeadingSpaces(`
    # Project Updates

    No version records have been generated yet for this codebase.
  `)

  expect(getVersions(changelog)).toEqual([])
})

test('returns an empty array for empty or whitespace-only input', () => {
  expect(getVersions('')).toEqual([])
  expect(getVersions('    \n  \n    ')).toEqual([])
})
