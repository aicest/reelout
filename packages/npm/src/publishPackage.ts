// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleaseContext, ReleasePlan } from '@reelout/core'
import { execCommand, isVerboseOutputAllowed } from '@reelout/core'
import path from 'node:path'
import { inspectPackageManager } from './inspectPackageManager'
import { prepareAuth } from './prepareAuth'
import type { PublishAccess } from './types'

export interface PublishPackageOptions {
  dryRun?: boolean | undefined
  tag?: string | undefined
  access?: PublishAccess | null | undefined
  provenance?: boolean | undefined
  stage?: boolean | undefined
}

/**
 * Publish a package to a registry using the active package manager.
 *
 * Prepares registry authentication and constructs package manager CLI flags to
 * execute the release publish operation. Skips execution if the package is
 * private, unversioned, or missing a package name.
 *
 * @param context Release context containing environment, streams, and directory
 * @param plan Release plan describing the target package and release version
 * @param options Publishing flags including dry-run status, tags, and provenance
 */
export async function publishPackage(
  context: ReleaseContext,
  plan: ReleasePlan,
  options: PublishPackageOptions = {}
): Promise<void> {
  if (plan.package.private || !plan.package.name || !plan.release?.version) {
    return
  }

  const packageManager = await inspectPackageManager(context.cwd, {
    env: context.env,
  })

  const { isNpm, isPnpm, isYarnClassic, isYarnBerry } = packageManager

  const commandArgs: string[] = []

  await using env = await prepareAuth(context, plan.package, packageManager)

  switch (true) {
    case isNpm:
    case isPnpm:
      if (options.stage) commandArgs.push('stage', 'publish')
      else commandArgs.push('publish')
      break
    case isYarnClassic:
      commandArgs.push('publish')
      break
    case isYarnBerry:
      if (options.stage) commandArgs.push('npm', 'publish', '--staged')
      else commandArgs.push('npm', 'publish')
      break
  }

  if (options.dryRun && isYarnClassic) return

  if (options.dryRun) commandArgs.push('--dry-run')

  if (options.tag) commandArgs.push('--tag', options.tag)

  if (options.access) commandArgs.push('--access', options.access)

  if (options.provenance && !isYarnClassic) commandArgs.push('--provenance')

  if (isPnpm) commandArgs.push('--no-git-checks')

  // Package manager stdout is extremely verbose. Forward it only when someone
  // will actually keep it: an attached terminal, or a CI provider that records
  // the job log. Anywhere else (agent sandboxes, captured pipes) the output
  // stays in memory so `execCommand` can still report it on failure. Warnings
  // and errors on stderr are always forwarded, they are few and load-bearing.
  const verboseOutputAllowed = isVerboseOutputAllowed(
    context.stdout,
    context.env
  )

  if (!verboseOutputAllowed) {
    context.logger.debug(
      'Suppressing publish stdout because no terminal or CI log is attached.'
    )
  }

  await execCommand(packageManager.name, commandArgs, {
    cwd: path.resolve(context.cwd, plan.package.location),
    env: { ...context.env, ...env },
    signal: context.signal,
    stdout: verboseOutputAllowed ? context.stdout : undefined,
    stderr: context.stderr,
  })
}
