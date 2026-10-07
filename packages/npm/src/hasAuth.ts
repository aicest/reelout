// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { Package, ReleaseContext } from '@reelout/core'
import { structUtils } from '@yarnpkg/core'
import { npmConfigUtils } from '@yarnpkg/plugin-npm'
import type { PackageManagerInfo } from './inspectPackageManager'
import { loadConfig } from './loadConfig'
import {
  loadYarnConfig,
  type YarnRegistryConfig,
  type YarnScopeConfig,
} from './loadYarnConfig'
import { normalizeRegistry } from './normalizeRegistry'
import { resolvePublishRegistry } from './resolvePublishRegistry'

/**
 * Determine whether authentication credentials exist for a package registry.
 *
 * Checks OIDC environment tokens, scope-level settings, registry configs,
 * and standard auth credentials to verify registry access.
 *
 * @param context Release context containing environment and working directory
 * @param pkg Target package metadata object
 * @param packageManager Information about the active package manager
 * @returns True if authentication credentials exist, otherwise false
 */
export async function hasAuth(
  context: ReleaseContext,
  pkg: Package,
  packageManager: Partial<PackageManagerInfo>
): Promise<boolean> {
  if (context.env.NPM_ID_TOKEN) {
    return true
  }

  if (
    context.env.ACTIONS_ID_TOKEN_REQUEST_URL &&
    context.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN
  ) {
    return true
  }

  const registry = await resolvePublishRegistry(context, pkg, packageManager)

  if (packageManager.isYarnBerry) {
    const hasTokenOrIdent = (config: YarnRegistryConfig | null | undefined) => {
      return Boolean(config?.get('npmAuthToken') || config?.get('npmAuthIdent'))
    }

    const configuration = await loadYarnConfig(context.cwd)

    const ident = pkg.name ? structUtils.parseIdent(pkg.name) : undefined

    const scopeConfiguration = npmConfigUtils.getScopeConfiguration(
      ident ? ident.scope : null,
      { configuration }
    ) as YarnScopeConfig | null

    if (hasTokenOrIdent(scopeConfiguration)) {
      return true
    }

    const registryConfiguration = npmConfigUtils.getRegistryConfiguration(
      registry,
      { configuration }
    ) as YarnRegistryConfig | null

    if (hasTokenOrIdent(registryConfiguration)) {
      return true
    }

    const defaultRegistry =
      normalizeRegistry(configuration.get('npmPublishRegistry')) ??
      normalizeRegistry(configuration.get('npmRegistryServer'))

    if (defaultRegistry === registry && hasTokenOrIdent(configuration)) {
      return true
    }
  } else {
    const config = await loadConfig(context.cwd, { env: context.env })

    const credentials = config.getCredentialsByURI(registry)

    if (credentials.token || credentials.auth) {
      return true
    }
  }

  return false
}
