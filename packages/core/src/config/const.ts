// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleaseHookName } from '#types'
import { Writable } from 'node:stream'

export const ALL_FILES = '**/*'

export const DEFAULT_CHANGELOG_FILE = 'CHANGELOG.md'

export const GIT_TRAILER_RELEASE_AGENT = 'Release-Agent'

/**
 * 1. Primitive Building Blocks
 *
 * Base regular expression patterns for wildcards, alphanumeric strings with hyphens,
 * and standard non-negative integers.
 */
const WILDCARD = '\\*'
const ALPHANUM_DASH = '[0-9a-zA-Z-]+'
const NUMERIC_IDENTIFIER = '0|[1-9]\\d*'

/**
 * 2. Package Name & Prefix Constructs
 *
 * Matches package name prefixes (unscoped or scoped) or a simple `v` prefix.
 *
 * Capture Groups:
 * - Group 1: Package name (e.g., `my-package` or `@scope/my-package`)
 */
const PKG_NAME_PART = `(?:${WILDCARD}|${ALPHANUM_DASH})`
const CAPTURED_PACKAGE_NAME = `(${PKG_NAME_PART}|@${PKG_NAME_PART}\\/${PKG_NAME_PART})`
const OPTIONAL_VERSION_PREFIX = `(?:v|${CAPTURED_PACKAGE_NAME}@)`

/**
 * 3. Core SemVer Components
 *
 * Matches standard `MAJOR.MINOR.PATCH` versions or wildcard variants (e.g., `1.0.0`, `*.*.*`).
 *
 * Capture Groups:
 * - Group 3: Major version
 * - Group 4: Minor version
 * - Group 5: Patch version
 */
const CAPTURED_VERSION_DIGIT = `(${WILDCARD}|${NUMERIC_IDENTIFIER})`
const SEMVER_CORE = `${CAPTURED_VERSION_DIGIT}\\.${CAPTURED_VERSION_DIGIT}\\.${CAPTURED_VERSION_DIGIT}`

/**
 * 4. Prerelease & Build Metadata
 *
 * Matches optional prerelease identifiers (e.g., `-alpha.1`) and build metadata (e.g., `+build123`).
 *
 * Capture Groups:
 * - Group 6: Complete prerelease string (without `-`)
 * - Group 7: Non-numeric prerelease token
 * - Group 8: Complete build metadata string (without `+`)
 */
const CAPTURED_NON_NUMERIC_PRERELEASE_ID = `(\\d*[a-zA-Z-][0-9a-zA-Z-]*)`
const PRERELEASE_IDENTIFIER = `(?:${WILDCARD}|${NUMERIC_IDENTIFIER}|${CAPTURED_NON_NUMERIC_PRERELEASE_ID})`
const OPTIONAL_PRERELEASE_SECTION = `(?:-(${PRERELEASE_IDENTIFIER}(?:\\.${PRERELEASE_IDENTIFIER})*))`
const OPTIONAL_BUILD_SECTION = `(?:\\+(${ALPHANUM_DASH}(?:\\.${ALPHANUM_DASH})*))`

/**
 * 5. Assembled SemVer Pattern
 *
 * Combines core SemVer components with optional prerelease identifiers and build metadata.
 *
 * Capture Groups:
 * - Group 2: Full SemVer version string (excluding package/prefix)
 */
const CAPTURED_SEMVER_VERSION = `(${SEMVER_CORE}${OPTIONAL_PRERELEASE_SECTION}?${OPTIONAL_BUILD_SECTION}?)`
const FULL_SEMVER_PATTERN = `${OPTIONAL_VERSION_PREFIX}?${CAPTURED_SEMVER_VERSION}`

/**
 * Regular expression to match and capture Semantic Versioning (SemVer) strings,
 * including optional package prefixes (e.g., `@scope/pkg@`) and `v` prefixes.
 *
 * @example
 * ```ts
 * SEMVER_REGEX.test('1.0.0') // true
 * SEMVER_REGEX.test('v1.2.3-beta.1+sha.1234') // true
 * SEMVER_REGEX.test('@scope/package@1.0.0') // true
 * ```
 *
 * @see {@link https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string SemVer Specification}
 */
export const SEMVER_REGEX = new RegExp(FULL_SEMVER_PATTERN)

export const DEV_NULL = new Writable({
  /* istanbul ignore next */
  write(_chunk, _encoding, callback) {
    callback()
  },
})

export const RELEASE_HOOK_NAMES = [
  'configure',
  'discover',
  'analyze',
  'build',
  'write',
  'publish',
  'finalize',
] as const satisfies ReleaseHookName[]
