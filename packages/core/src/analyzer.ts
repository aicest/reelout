// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleasePlan, ReleasePlugin } from '#types'
import {
  deriveChangeReleases,
  deriveTransitionReleases,
  propagateDependencyUpdates,
  sliceUnreleased,
} from '#workflow'
import { version } from '../package.json'

/**
 * Built-in plugin that inspects repository history and produces release plans for packages.
 *
 * @remarks
 * **Lifecycle Stages:**
 * - `analyze`: Initializes release plans if empty, extracts unreleased Git commit history,
 *   calculates package version bumps based on commit classifications, handles transition releases
 *   for empty changesets (if enabled), and propagates dependency updates across internal packages.
 *
 * @returns A release plugin configured for package change analysis.
 */
const analyzer = (): ReleasePlugin => ({
  name: '@reelout/core/analyzer',
  version,
  analyze: async (context, next) => {
    if (context.plans.length === 0) {
      context.plans = context.packages.map((pkg): ReleasePlan => ({
        package: pkg,
        history: [],
        release: null,
      }))
    }

    const history = await sliceUnreleased(context.cwd)

    context.plans = await deriveChangeReleases(
      context.type,
      context.classifier,
      context.plans,
      history
    )

    if (context.allowEmpty) {
      context.plans = deriveTransitionReleases(
        context.type,
        context.versionQualifier,
        context.plans
      )
    }

    context.plans = await propagateDependencyUpdates(context.cwd, context.plans)

    return next(context)
  },
})

export default analyzer
