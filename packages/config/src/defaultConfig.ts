// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleaseConfig } from '@reelout/core'

/**
 * Default release configuration used when no user config is provided.
 *
 * Includes defaults for user identity, workspace layout, release rules,
 * commit-to-release mappings, and built-in plugins.
 */
export const defaultConfig = Object.freeze({
  author: {
    name: 'github-actions[bot]',
    email: '41898282+github-actions[bot]@users.noreply.github.com',
  },
  classifier: {
    major: [],
    minor: ['feat'],
    patch: ['fix', 'perf', 'revert'],
  },
  rules: [
    { type: 'branch', pattern: 'alpha', qualifier: 'alpha', channel: 'alpha' },
    { type: 'branch', pattern: 'beta', qualifier: 'beta', channel: 'beta' },
    { type: 'branch', pattern: 'next', qualifier: 'next', channel: 'next' },
  ],
  plugins: [
    '@reelout/core/analyzer', // Analyze the commits and determine the release type.
    '@reelout/core/builder', // Build the release artifacts.
    '@reelout/core/changelog', // Generate and write changelog entries for each release.
    '@reelout/npm', // Update package manifests and publish packages to npm.
    '@reelout/git', // Create release commits and tags, then push them.
    '@reelout/github', // Create GitHub releases from finalized plans.
  ],
} satisfies Required<ReleaseConfig>)
