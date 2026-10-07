// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { generateGitTagName } from '#git'
import type { ReleasePlan, ReleasePlugin } from '#types'
import { formatError } from '#util'
import {
  buildReleaseNotes,
  bumpVersion,
  isSameReleaseCycle,
  resolvePackageStableTag,
  streamPackageCommits,
} from '#workflow'
import { colors } from 'consola/utils'
import { version } from '../package.json'

/**
 * Built-in plugin that prepares release metadata and artifacts for active plans.
 *
 * @remarks
 * **Lifecycle Stages:**
 * - `build`: Computes bumped package versions, derives standardized Git tag names,
 *   and generates release notes/tag messages from unreleased commit history.
 *
 * @returns A release plugin configured for release metadata preparation.
 */
const builder = (): ReleasePlugin => ({
  name: '@reelout/core/builder',
  version,
  build: async (context, next) => {
    context.plans = await Promise.all(
      context.plans.map(async (plan): Promise<ReleasePlan> => {
        plan = { ...plan }

        if (!plan.release) return plan

        plan.release = { ...plan.release }

        let version: string | null | undefined

        try {
          version = bumpVersion({
            version: plan.package.version,
            private: plan.package.private,
            release: plan.release.type,
            identifier: context.versionQualifier,
            transition: plan.release.transition,
          })
        } catch (err) {
          context.logger.warn(
            colors.yellow(
              `Version could not be determined for package at "${colors.bold(plan.package.location)}": ${formatError(err)}`
            )
          )
        }

        if (version) {
          plan.release.version = version
        }

        let tagName: string | null | undefined

        try {
          tagName = generateGitTagName(
            plan.package.entry,
            plan.package.name,
            plan.release.version
          )
        } catch (err) {
          context.logger.warn(
            colors.yellow(
              `Tag could not be determined for package at "${colors.bold(plan.package.location)}": ${formatError(err)}`
            )
          )
        }

        let tagMessage: string | undefined

        try {
          if (tagName) {
            if (
              context.allowEmpty &&
              plan.history.length === 0 &&
              isSameReleaseCycle(plan.package.version, plan.release.version)
            ) {
              const previousTag = (
                await resolvePackageStableTag(context.cwd, plan.package)
              )?.name

              const history = streamPackageCommits(context.cwd, plan.package, {
                until: previousTag,
              })

              tagMessage = await buildReleaseNotes(context, history)
            } else {
              tagMessage = await buildReleaseNotes(context, plan.history)
            }
          }
        } catch {}

        if (tagName) {
          plan.release.tag = {
            name: tagName,
            message: tagMessage,
          }
        }

        return plan
      })
    )

    return next(context)
  },
})

export default builder
