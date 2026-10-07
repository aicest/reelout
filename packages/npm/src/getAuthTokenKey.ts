// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import nerfDart from '@npmcli/config/lib/nerf-dart.js'

/**
 * Generate a registry-specific configuration key for auth tokens.
 *
 * Normalizes the registry URL into a nerfed dart path and appends the standard
 * authentication token key suffix.
 *
 * @param registry Target registry URL string
 * @returns Formatted auth token configuration key
 */
export function getAuthTokenKey(registry: string): string {
  return `${nerfDart(registry)}:_authToken`
}
