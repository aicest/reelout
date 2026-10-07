// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  findReleaseRule,
  getCurrentGitBranch,
  getCurrentGitCommit,
  GIT_TRAILER_RELEASE_AGENT,
  resolveGitRepository,
  resolveReleaseChannel,
  resolveVersionQualifier,
  type GitCommit,
  type GitRef,
  type ReleaseContext,
  type ReleaseTypeHint,
  type ResolvedReleaseConfig,
} from '@reelout/core'
import { createConsola, LogLevels } from 'consola/basic'
import type { ConsolaInstance } from 'consola/core'

export interface CreateContextOptions extends Omit<
  ResolvedReleaseConfig,
  'plugins'
> {
  cwd: string
  env: Readonly<NodeJS.ProcessEnv>
  signal?: AbortSignal | undefined
  stdout: NodeJS.WritableStream
  stderr: NodeJS.WritableStream
  logger?: ConsolaInstance | undefined
  type?: ReleaseTypeHint | undefined
  qualifier?: boolean | string | undefined
  channel?: boolean | string | undefined
  allowEmpty?: boolean | undefined
  dryRun?: boolean | undefined
  debug?: boolean | undefined
}

/**
 * Initialize a release context for the current execution run.
 *
 * Resolves the Git repository, current commit, and branch information, then
 * computes target release parameters using the provided configuration rules
 * and runtime options.
 *
 * @param options Combined release configuration and runtime options
 * @returns A promise that resolves to the fully initialized release context
 * @throws If the Git repository has no commits or no branch is checked out
 */
export async function createContext(
  options: CreateContextOptions
): Promise<ReleaseContext> {
  const { cwd, stdout, stderr } = options
  let { logger } = options

  logger ??= createConsola({
    level: options.debug ? LogLevels.verbose : LogLevels.info,
    stdout: stdout as NodeJS.WriteStream,
    stderr: stderr as NodeJS.WriteStream,
  })

  const repository = await resolveGitRepository(cwd)
  let commit: GitCommit
  let branch: string

  try {
    commit = await getCurrentGitCommit(cwd, [GIT_TRAILER_RELEASE_AGENT])
  } catch (err) {
    throw new Error(
      'Initialize a Git repository with at least one commit before running this command.',
      { cause: err }
    )
  }

  try {
    branch = await getCurrentGitBranch(cwd)
  } catch (err) {
    throw new Error(
      'Check out a Git branch in your repository before proceeding.',
      { cause: err }
    )
  }

  const ref: GitRef = { type: 'branch', name: branch }
  const rule = findReleaseRule(ref, options.rules)

  const now = new Date()
  const date = now.toISOString().slice(0, 10) // YYYY-MM-DD
  const time = now.toISOString().slice(11, 19) // HH:mm:ss
  const templateParams = {
    date: date.replaceAll('-', ''),
    time: time.replaceAll(':', ''),
  }

  const versionQualifier = resolveVersionQualifier({
    rule,
    templateParams,
    qualifier: options.qualifier,
  })

  const releaseChannel = resolveReleaseChannel({
    ref,
    rule,
    templateParams,
    channel: options.channel,
  })

  return {
    cwd,
    env: options.env,
    today: date,
    signal: options.signal,
    stdout,
    stderr,
    logger,
    repository,
    ref,
    commit,
    author: options.author,
    classifier: options.classifier,
    rules: options.rules,
    type: options.type ?? 'auto',
    versionQualifier,
    releaseChannel,
    allowEmpty: !!options.allowEmpty,
    dryRun: !!options.dryRun,
    packages: [],
    plans: [],
    status: null,
    phase: null,
    error: null,
  }
}
