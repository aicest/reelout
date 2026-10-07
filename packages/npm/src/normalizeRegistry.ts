// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/**
 * Normalize a registry URL string.
 *
 * Validates the input string using the `URL` constructor and extracts its href
 * representation. Returns undefined if the string is empty or invalid.
 *
 * @param registry Registry URL string to normalize
 * @returns Normalized URL string or undefined if invalid
 */
export function normalizeRegistry(
  registry: string | null | undefined
): string | undefined {
  if (!registry) return undefined

  try {
    return new URL(registry).href
  } catch {
    return undefined
  }
}
