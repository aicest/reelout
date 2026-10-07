// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  createGitCommit,
  createGitTag,
  deleteGitTag,
  ensureGitUserConfig,
  generateReleaseCommitMessage,
  HookPriority,
  pushGitChanges,
  type ReleasePlugin,
  type Tag,
} from '@reelout/core'
import { version } from '../package.json'

/**
 * Built-in plugin that performs Git lifecycle tasks including user configuration, commit creation, tagging, and pushing.
 *
 * @remarks
 * **Lifecycle Stages:**
 * - `configure`: Ensures local Git user identity (`git config user.name`/`user.email`) is configured (skipped in dry-run).
 * - `commit`: Creates a consolidated Git release commit for planned package changes (skipped in dry-run).
 * - `publish`: Creates Git tags for each release plan and pushes commits and tags to the remote repository.
 *   Provides automated rollback tag deletion if downstream publishing steps fail.
 *
 * @returns A release plugin configured for Git operations.
 */
const git = (): ReleasePlugin => ({
  name: '@reelout/git',
  version,
  configure: async (context, next) => {
    if (context.dryRun) {
      return next(context)
    }

    await using _disposable = await ensureGitUserConfig(
      context.cwd,
      context.author
    )

    return await next(context)
  },
  write: {
    priority: HookPriority.Low,
    handler: async (context, next) => {
      if (context.dryRun) {
        context.logger.debug(
          '[DRY RUN] The release commit will not be created.'
        )
      } else {
        await createGitCommit(
          context.cwd,
          await generateReleaseCommitMessage(context.cwd, context.plans, {})
        )
      }

      return next(context)
    },
  },
  publish: async (context, next) => {
    if (!context.repository) {
      throw new Error('A Git remote must be configured to push tags.')
    }

    const tags: Tag[] = []

    try {
      for (const plan of context.plans) {
        if (plan.release?.tag) {
          tags.push(plan.release.tag)

          if (!context.dryRun) {
            await createGitTag(
              context.cwd,
              plan.release.tag.name,
              plan.release.tag.message
            )
          }
        }
      }

      if (tags.length > 0) {
        if (context.dryRun) {
          context.logger.debug('[DRY RUN] Git tags will not be pushed.')
        } else {
          await pushGitChanges(
            context.cwd,
            context.ref.name,
            ...tags.map((tag) => tag.name)
          )
        }
      }
    } catch (err) {
      /* istanbul ignore else */
      if (!context.dryRun) {
        await Promise.allSettled(
          tags.map((tag) => deleteGitTag(context.cwd, tag.name))
        )
      }

      throw err
    }

    try {
      return await next(context)
    } catch (err) {
      /* istanbul ignore else */
      if (tags.length > 0 && !context.dryRun) {
        await Promise.allSettled(
          tags.map((tag) => deleteGitTag(context.cwd, tag.name))
        )

        await pushGitChanges(
          context.cwd,
          null,
          ...tags.map((tag) => `:${tag.name}`)
        )
      }

      throw err
    }
  },
})

export default git
