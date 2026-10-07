// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  formatError,
  normalizeWorkspace,
  sortPackages,
  type Package,
  type ReleasePlugin,
  type Workspace,
} from '@reelout/core'
import * as github from '@reelout/github'
import * as gitlab from '@reelout/gitlab'
import { colors } from 'consola/utils'
import { version } from '../package.json'
import { bumpPackageDependencies } from './bumpPackageDependencies'
import { loadPackages } from './loadPackages'
import { publishPackage } from './publishPackage'
import { resolveGitRepositoryFromPackage } from './resolveGitRepositoryFromPackage'
import { resolveWorkspaceMembers } from './resolveWorkspaceMembers'
import type { PublishAccess } from './types'

export const PLUGIN_NAME = '@reelout/npm'

export interface PluginOptions {
  workspace?: Partial<Workspace>
  access?: PublishAccess | null | undefined
  provenance?: boolean | undefined
  stage?: boolean | undefined
}

/**
 * Built-in plugin that discovers workspace packages, updates package manifests, and publishes packages to NPM.
 *
 * @remarks
 * **Lifecycle Stages:**
 * - `configure`: Resolves and attaches Git repository metadata from root package configuration.
 * - `discover`: Discovers workspace member packages and loads package metadata into context.
 * - `write`: Bumps internal workspace dependency versions in `package.json` files (skipped in dry-run).
 * - `publish`: Authenticates, detects public provenance status, and publishes non-private packages to NPM.
 *
 * @param options Configuration options for NPM workspace discovery and publishing behavior.
 * @returns A release plugin configured for NPM workspace management and package publication.
 */
const npm = (options: PluginOptions = {}): ReleasePlugin => ({
  name: PLUGIN_NAME,
  version,
  configure: async (context, next) => {
    const repo = await resolveGitRepositoryFromPackage(context.cwd)
    context.repository = repo ?? context.repository

    return next(context)
  },
  discover: async (context, next) => {
    const packages: Package[] = []

    const workspace = normalizeWorkspace(context.cwd, options.workspace)

    workspace.members ??= await resolveWorkspaceMembers(context.cwd)

    for (const result of await loadPackages(context.cwd, workspace)) {
      if (result.status === 'fulfilled') {
        packages.push({
          ...result.value,
          provider: PLUGIN_NAME,
        })
      } else {
        context.logger.warn(
          colors.yellow(
            `Package could not be loaded: ${formatError(result.reason)}`
          )
        )
      }
    }

    context.packages = sortPackages(context.packages.concat(packages))

    return next(context)
  },
  write: async (context, next) => {
    if (context.dryRun) {
      context.logger.debug('[DRY RUN] Package files will not be updated.')
    } else {
      await bumpPackageDependencies(
        context.cwd,
        context.plans.filter((plan) => plan.package.provider === PLUGIN_NAME)
      )
    }

    return next(context)
  },
  publish: async (context, next) => {
    let { provenance } = options

    try {
      if (provenance == null) {
        if (context.repository?.host === 'github' && context.env.GITHUB_TOKEN) {
          provenance = await github.isRepositoryPublic(
            context.env.GITHUB_TOKEN,
            context.repository
          )
        }

        if (context.repository?.host === 'gitlab' && context.env.GITLAB_TOKEN) {
          provenance = await gitlab.isRepositoryPublic(
            context.env.GITLAB_TOKEN,
            context.repository
          )
        }
      }
    } catch {}

    for (const plan of context.plans) {
      if (plan.package.provider === PLUGIN_NAME) {
        await publishPackage(context, plan, {
          dryRun: context.dryRun,
          tag: context.releaseChannel,
          access: options.access,
          provenance,
          stage: options.stage,
        })
      }
    }

    return next(context)
  },
})

export default npm
