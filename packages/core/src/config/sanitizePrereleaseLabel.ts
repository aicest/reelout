// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/**
 * Sanitize a string into a safe, SemVer-compliant prerelease label.
 *
 * Replaces sequences of non-alphanumeric characters with a single hyphen and
 * removes leading or trailing hyphens.
 *
 * @param label Raw string to sanitize
 * @returns Safe SemVer prerelease label
 */
export function sanitizePrereleaseLabel(label: string): string {
  return label
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}
