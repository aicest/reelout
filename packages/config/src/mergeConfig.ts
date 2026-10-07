// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { assignWith } from 'lodash-es'

/**
 * Merge a user configuration into the defaults, preserving unspecified keys.
 *
 * Uses `lodash.assignWith` to avoid overwriting default values with
 * `undefined` from the user configuration.
 *
 * @param defaultConfig Default configuration object
 * @param userConfig Partial user-provided configuration
 * @returns Merged configuration object
 */
export function mergeConfig<T>(
  defaultConfig: T,
  userConfig: Partial<T> | null | undefined
): T {
  return assignWith({}, defaultConfig, userConfig, (objValue, srcValue) => {
    if (srcValue === undefined) {
      return objValue
    }
  })
}
