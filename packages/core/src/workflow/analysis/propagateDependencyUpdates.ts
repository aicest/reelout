// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { mergeGitHistory } from '#git'
import type { GitCommit, ReleasePlan } from '#types'
import { buildDependencyGraph } from '../discovery'

/**
 * Propagate release updates through package dependencies.
 *
 * Marks packages that depend on a releasing package for a `patch` release
 * when they do not already have a release type.
 *
 * @param plans Array of release plans to update
 * @returns Updated array of release plans
 */
export async function propagateDependencyUpdates(
  cwd: string,
  plans: readonly ReleasePlan[]
): Promise<ReleasePlan[]> {
  const graph = buildDependencyGraph(plans)

  const scheduled = new Map<ReleasePlan, GitCommit[]>()

  const stack: ReleasePlan[] = []

  for (const plan of plans) {
    if (plan.release?.type) {
      const visited = new Set([plan])

      stack.push(plan)

      let curr: ReleasePlan | undefined

      while ((curr = stack.pop())) {
        if (curr.package.name) {
          for (const dependent of graph.get(curr.package.name) ?? []) {
            if (!visited.has(dependent)) {
              visited.add(dependent)

              stack.push(dependent)

              scheduled.set(
                dependent,
                await mergeGitHistory(
                  cwd,
                  scheduled.get(dependent) ?? dependent.history,
                  plan.history
                )
              )
            }
          }
        }
      }
    }
  }

  return plans.map((plan) => {
    const history = scheduled.get(plan)

    if (history) {
      plan = { ...plan, history }

      if (!plan.release?.type) {
        plan.release = { type: 'patch' }
      }
    }

    return plan
  })
}
