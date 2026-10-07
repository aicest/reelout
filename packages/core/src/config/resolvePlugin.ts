// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type {
  ReleasePlugin,
  ReleasePluginDefinition,
  ReleasePluginFactory,
  ReleasePluginTuple,
} from '#types'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

/**
 * Resolve a release plugin definition into a factory tuple or plugin object.
 *
 * Handles string module specifiers by dynamically importing the package relative
 * to `cwd`. Unwraps ES module default exports, array configurations containing
 * options, function factories, and direct plugin objects.
 *
 * @param cwd The working directory path used to resolve string specifiers
 * @param plugin The plugin name, path, tuple configuration, or plugin object
 * @returns A factory tuple, plugin object, or null if resolution fails
 */
export async function resolvePlugin(
  cwd: string,
  plugin: unknown
): Promise<ReleasePluginDefinition | ReleasePluginTuple | null> {
  let options: unknown

  if (Array.isArray(plugin)) {
    ;[plugin, options] = plugin
  }

  if (typeof plugin === 'string') {
    const require = createRequire(pathToFileURL(cwd))
    plugin = await import(require.resolve(plugin))
  }

  if (plugin != null && typeof plugin === 'object' && 'default' in plugin) {
    plugin = plugin.default
  }

  if (typeof plugin === 'function') {
    return [plugin as ReleasePluginFactory, options]
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
