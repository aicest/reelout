// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/**
 * Generate a git tag name for a package.
 *
 * For entry packages the tag is `v<version>`. For non-entry packages the
 * tag is `<name>@<version>`. Returns `null` when `version` is not provided.
 *
 * @param entry Whether the package is the repository entry package
 * @param name Package name (required for non-entry packages)
 * @param version Package version
 * @returns Tag string, or `null` when `version` is absent
 */
export function generateGitTagName(
  entry: boolean,
  name: string | null | undefined,
  version: string
): string
export function generateGitTagName(
  entry: boolean,
  name: string | null | undefined,
  version: string | null | undefined
): string | null
export function generateGitTagName(
  entry: boolean,
  name: string | null | undefined,
  version: string | null | undefined
): string | null {
  if (!version) {
    return null
  }

  if (entry) {
    return `v${version}`
  }

  if (!name) {
    throw new Error('Package name is required to build a tag name.')
  }

  return `${name}@${version}`
}
