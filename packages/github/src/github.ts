// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleasePlugin } from '@reelout/core'
import { version } from '../package.json'
import { createRelease } from './createRelease'
import { deleteRelease } from './deleteRelease'

/**
 * Built-in plugin that creates GitHub releases for finalized release plans.
 *
 * @remarks
 * **Lifecycle Stages:**
 * - `publish`: Creates GitHub releases in reverse alphabetical package order (ensuring the root package release
 *   is created last). Automatically rolls back and deletes created releases if subsequent publishing stages fail.
 *
 * @throws {Error} If `context.repository` is not configured or `GITHUB_TOKEN` environment variable is missing.
 * @returns A release plugin configured for GitHub release creation.
 */
const github = (): ReleasePlugin => ({
  name: '@reelout/github',
  version,
  publish: async (context, next) => {
    if (!context.repository) {
      throw new Error(
        'A Git repository is required to create a GitHub release.'
      )
    }

    if (!context.env.GITHUB_TOKEN) {
      throw new Error('The GITHUB_TOKEN environment variable is required.')
    }

    if (context.dryRun) {
      context.logger.debug('[DRY RUN] GitHub releases will not be created.')
      return next(context)
    }

    const plans = context.plans.toSorted((a, b) =>
      (a.package.name || '').localeCompare(b.package.name || '')
    )

    const token = context.env.GITHUB_TOKEN

    const repository = context.repository

    // Create releases in reverse order
    // so that the root package release is created last,
    // as it is often the most important one.
    for (const plan of plans.toReversed()) {
      await createRelease(context, plan, token, repository)
    }

    try {
      return await next(context)
    } catch (err) {
      await Promise.allSettled(
        plans.map((plan) => deleteRelease(plan, token, repository))
      )

      throw err
    }
  },
})

export default github
