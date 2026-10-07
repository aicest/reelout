// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { Package } from '#types'

interface PackageNode {
  package: Package
  level: number
}

/**
 * Sort workspace packages topologically based on their dependency graphs.
 *
 * Deepest dependents are placed first in the resulting array, ensuring that
 * a package always precedes its own dependencies. Ties and circular dependencies
 * are resolved deterministically using an alphabetical sort on the package directory (`dir`).
 *
 * @param packages The workspace packages to sort.
 * @returns A new array of packages sorted by dependency depth and directory path.
 */
export function sortPackages(packages: readonly Package[]): Package[] {
  const packageNodes: PackageNode[] = []
  const packageMap = new Map<string, PackageNode>()

  for (const pkg of packages.toSorted((a, b) =>
    a.location.localeCompare(b.location)
  )) {
    const node: PackageNode = {
      package: pkg,
      level: -1,
    }

    packageNodes.push(node)

    if (pkg.name) {
      packageMap.set(pkg.name, node)
    }
  }

  for (const node of packageNodes) {
    visit(node)
  }

  function visit(
    node: PackageNode,
    level = 0,
    visited = new Set<PackageNode>()
  ): void {
    if (node.level >= level) {
      return
    }

    if (visited.has(node)) {
      return
    }

    visited.add(node)

    for (const depName of node.package.dependencies) {
      const depNode = packageMap.get(depName)

      if (depNode && depNode !== node) {
        visit(depNode, level + 1, visited)
      }
    }

    node.level = level
  }

  const sorted = packageNodes
    .toSorted((a, b) => b.level - a.level)
    .map((node) => node.package)

  return sorted
}
