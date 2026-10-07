// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleasePlugin } from '#types'
import { isClass } from '#util'

/**
 * Instantiate or invoke a plugin factory to produce a release plugin instance.
 *
 * Accepts class constructors, factory functions, tuple configurations, or
 * existing plugin objects. Instantiates classes using `new` or invokes factory
 * functions with options, validating that the resulting object satisfies the
 * plugin structure.
 *
 * @param plugin A plugin constructor, factory function, tuple, or object
 * @returns A validated release plugin instance or null
 */
export async function createPlugin(
  plugin: unknown
): Promise<ReleasePlugin | null> {
  let options: unknown

  if (Array.isArray(plugin)) {
    ;[plugin, options] = plugin
  }

  if (typeof plugin === 'function') {
    plugin = isClass(plugin) ? new plugin(options) : await plugin(options)
  }

  if (
    plugin != null &&
    typeof plugin === 'object' &&
    Object.hasOwn(plugin, 'name') &&
    typeof (plugin as ReleasePlugin).name === 'string'
  ) {
    return plugin as ReleasePlugin
  }

  return null
}
