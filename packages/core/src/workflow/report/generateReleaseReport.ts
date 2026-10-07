// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleaseContext, ReleaseReport } from '#types'
import { compact } from '#util'

/**
 * Generate a structured release report from the current workflow state.
 *
 * Extracts state information from `context` and organizes it into a report
 * containing workflow status, release plans, and package metadata. Omits
 * unversioned release plans from the finalized output.
 *
 * @param context Release execution context containing workflow state and plans
 * @returns Structured release report object containing workflow results
 */
export function generateReleaseReport(context: ReleaseContext): ReleaseReport {
  return {
    status: context.status,
    phase: context.phase,
    error: Error.isError(context.error)
      ? context.error.message
      : typeof context.error === 'string'
        ? context.error
        : null,
    packages: context.packages.map((pkg) => ({
      location: pkg.location,
      name: pkg.name,
      version: pkg.version,
    })),
    plans: compact(
      context.plans.map((plan) => {
        if (!plan.release?.version) return null

        return {
          package: {
            provider: plan.package.provider,
            entry: plan.package.entry,
            location: plan.package.location,
            name: plan.package.name,
            version: plan.package.version,
            private: !!plan.package.private,
          },
          release: {
            type: plan.release.type,
            version: plan.release.version,
            tag: plan.release.tag?.name,
            changelog: plan.release.changelog,
          },
        }
      })
    ),
  }
}
