// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type {
  ReleasePlan,
  ReleaseType,
  ReleaseTypeHint,
  VersionTransition,
} from '#types'
import semver from 'semver'
import { extractVersionQualifier } from '../versioning/extractVersionQualifier'

/**
 * Derive transition release types for release plans based on version qualifiers.
 *
 * Evaluates unreleased `plans` by parsing package `semver` strings and checking
 * prerelease tags. Compares parsed version qualifiers against
 * `versionQualifier` and assigns `major`, `minor`, or `patch` release types
 * according to `hint`.
 *
 * @param hint Release type override hint to guide release classification
 * @param versionQualifier Optional qualifier string to compare against prerelease tags
 * @param plans List of release plans to analyze and update
 * @returns Updated release plans with derived transition release types
 */
export function deriveTransitionReleases(
  hint: ReleaseTypeHint,
  versionQualifier: string | undefined,
  plans: readonly ReleasePlan[]
): ReleasePlan[] {
  return plans.map((plan) => {
    if (plan.release) return plan

    const parsed = semver.parse(plan.package.version)

    if (!parsed) return plan

    const { major, minor, patch } = parsed
    const parsedVersionQualifier = extractVersionQualifier(parsed)
    let releaseType: ReleaseType | undefined
    let versionTransition: VersionTransition | undefined

    switch (hint) {
      case 'major':
        if (parsed.prerelease.length === 0) {
          if (typeof versionQualifier === 'string') {
            releaseType = 'major'
          } else if (major === 0 && (minor > 0 || patch > 0)) {
            releaseType = 'major'
          }
        } else {
          if (
            minor === 0 &&
            patch === 0 &&
            parsedVersionQualifier !== versionQualifier
          ) {
            releaseType = 'major'
          }
        }
        break

      case 'minor':
        if (parsed.prerelease.length === 0) {
          if (typeof versionQualifier === 'string') {
            releaseType = 'minor'
          }
        } else {
          if (
            minor > 0 &&
            patch === 0 &&
            parsedVersionQualifier !== versionQualifier
          ) {
            releaseType = 'minor'
          }
        }
        break

      case 'patch':
        if (parsed.prerelease.length === 0) {
          if (typeof versionQualifier === 'string') {
            releaseType = 'patch'
          }
        } else {
          if (patch > 0 && parsedVersionQualifier !== versionQualifier) {
            releaseType = 'patch'
          }
        }
        break

      default:
        if (parsed.prerelease.length === 0) {
          if (major === 0 && (minor > 0 || patch > 0)) {
            releaseType = 'major'
          }
        } else {
          if (
            minor === 0 &&
            patch === 0 &&
            parsedVersionQualifier !== versionQualifier
          ) {
            releaseType = 'major'
          } else if (
            minor > 0 &&
            patch === 0 &&
            parsedVersionQualifier !== versionQualifier
          ) {
            releaseType = 'minor'
          } else if (patch > 0 && parsedVersionQualifier !== versionQualifier) {
            releaseType = 'patch'
          }
        }
        break
    }

    if (
      parsedVersionQualifier == null ||
      (parsedVersionQualifier !== '' && versionQualifier === '')
    ) {
      versionTransition = 'advance'
    } else {
      versionTransition = 'continue'
    }

    if (!releaseType) return plan

    return {
      ...plan,
      release: {
        type: releaseType,
        transition: versionTransition,
      },
    }
  })
}
