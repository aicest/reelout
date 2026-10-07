// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { HookPriority } from '#plugin'
import type { Package, ReleasePlugin } from '#types'
import { formatError } from '#util'
import {
  buildChangelog,
  discoverPackageTag,
  resolvePackageTag,
  writeChangelog,
} from '#workflow'
import { colors } from 'consola/utils'
import { version } from '../package.json'

/**
 * Built-in plugin that resolves package tags, generates release changelogs, and persists changelog files.
 *
 * @remarks
 * **Lifecycle Stages:**
 * - `discover`: Resolves missing Git tags for workspace packages (low priority execution).
 * - `build`: Generates Markdown changelogs for planned releases based on historical commits.
 * - `write`: Writes generated changelog files to disk (skipped during dry-run mode).
 *
 * @returns A release plugin configured for changelog generation and file persistence.
 */
const changelog = (): ReleasePlugin => ({
  name: '@reelout/core/changelog',
  version,
  discover: {
    priority: HookPriority.Low,
    handler: async (context, next) => {
      context.packages = await Promise.all(
        context.packages.map(async (pkg): Promise<Package> => ({
          ...pkg,
          tag: await resolvePackageTag(context.cwd, pkg),
        }))
      )

      await next(context)
    },
  },
  build: async (context, next) => {
    context.plans = await Promise.all(
      context.plans.map(async (plan) => {
        plan = { ...plan }

        if (!plan.release) {
          return plan
        }

        if (!plan.release.version) {
          return plan
        }

        plan.release = { ...plan.release }

        let changelog: string | null | undefined

        let previousTag = (await resolvePackageTag(context.cwd, plan.package))
          ?.name

        if (!previousTag) {
          previousTag = (await discoverPackageTag(context.cwd, plan.package))
            ?.name
        }

        try {
          changelog = await buildChangelog(context, plan.history, {
            packageDir: plan.package.location,
            changelogFile: plan.package.changelogFile,
            version: plan.release.version,
            previousTag,
            currentTag: plan.release.tag?.name,
          })
        } catch (err) {
          context.logger.warn(
            colors.yellow(
              `Changelog could not be generated for package at "${colors.bold(plan.package.location)}": ${formatError(err)}`
            )
          )
        }

        if (changelog) {
          plan.release.changelog = changelog
        }

        return plan
      })
    )

    return next(context)
  },
  write: async (context, next) => {
    if (context.dryRun) {
      context.logger.debug('[DRY RUN] Changelog files will not be written.')
    } else {
      for (const plan of context.plans) {
        await writeChangelog(context.cwd, plan)
      }
    }

    return next(context)
  },
})

export default changelog
