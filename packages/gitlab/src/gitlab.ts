// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleasePlugin } from '@reelout/core'
import { version } from '../package.json'
import { createRelease } from './createRelease'
import { deleteRelease } from './deleteRelease'

/**
 * Built-in plugin that creates GitLab releases for finalized release plans.
 *
 * @remarks
 * **Lifecycle Stages:**
 * - `publish`: Creates GitLab releases in reverse alphabetical package order (ensuring the root package release
 *   is created last). Automatically rolls back and deletes created releases if subsequent publishing stages fail.
 *
 * @throws {Error} If `context.repository` is not configured or `GITLAB_TOKEN` environment variable is missing.
 * @returns A release plugin configured for GitLab release creation.
 */
const gitlab = (): ReleasePlugin => ({
  name: '@reelout/gitlab',
  version,
  publish: async (context, next) => {
    if (!context.repository) {
      throw new Error(
        'A Git repository is required to create a GitLab release.'
      )
    }

    if (!context.env.GITLAB_TOKEN) {
      throw new Error('The GITLAB_TOKEN environment variable is required.')
    }

    if (context.dryRun) {
      return next(context)
    }

    const plans = context.plans.toSorted((a, b) =>
      (a.package.name || '').localeCompare(b.package.name || '')
    )

    const token = context.env.GITLAB_TOKEN

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

export default gitlab
