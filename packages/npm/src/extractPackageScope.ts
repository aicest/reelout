// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/**
 * Extract the scope name from a package identifier.
 *
 * Evaluates the package string against scoped name patterns and retrieves the
 * leading scope prefix. Returns null if the package is unscoped or invalid.
 *
 * @param name Package name string to evaluate
 * @returns Extracted package scope or null if none exists
 */
export function extractPackageScope(
  name: string | null | undefined
): string | null {
  if (!name) return null

  return /^@([a-zA-Z0-9_\-.~]+)\//.exec(name)?.at(1) ?? null
}
