// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleasePlan } from '#types'

export type DependencyGraph = Map<string, Set<ReleasePlan>>

/**
 * Build a dependency graph mapping package names to dependent release plans.
 *
 * Each key is a package name and the value is a set of `ReleasePlan`s that
 * list that package as a dependency.
 *
 * @param plans Array of release plans to analyze
 * @returns Dependency graph mapping package name -> set of dependent plans
 */
export function buildDependencyGraph(
  plans: readonly ReleasePlan[]
): DependencyGraph {
  const graph = new Map<string, Set<ReleasePlan>>()

  const packageNames = new Set(
    plans
      .map((plan) => plan.package.name)
      .filter((name): name is string => !!name)
  )

  for (const plan of plans) {
    for (const depName of plan.package.dependencies) {
      let set = graph.get(depName)

      if (!set && packageNames.has(depName)) {
        graph.set(depName, (set = new Set()))
      }

      if (set) {
        set.add(plan)
      }
    }
  }

  return graph
}
