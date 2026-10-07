// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ConsolaInstance } from 'consola/core'
import type { CommitBase, CommitNote } from 'conventional-commits-parser'
import type { Hosts } from 'hosted-git-info'
import type { HookHandler } from './plugin'

export type GitRefType = 'branch'

export interface GitRef {
  type: GitRefType
  name: string
}

export type GitCommitType =
  | 'build'
  | 'chore'
  | 'ci'
  | 'docs'
  | 'feat'
  | 'fix'
  | 'perf'
  | 'refactor'
  | 'revert'
  | 'style'
  | 'test'
  | (string & {})

export type GitCommitNote = CommitNote

export interface GitCommitTrailer {
  key: string
  value: string
}

export interface GitCommit extends CommitBase {
  hash: string
  parent: string[]
  authorDate: string
  committerDate: string
  type: GitCommitType | null
  scope: string | null
  subject: string | null
  header: string
  body: string | null
  footer: string | null
  trailers: GitCommitTrailer[]
  files: readonly string[]
}

export interface GitRepository {
  host: Hosts
  owner: string
  repo: string
  url: string
}

export interface GitAuthor {
  name: string
  email: string
}

export type CommitClassifier = (
  commit: GitCommit
) => ReleaseType | null | undefined

export type ReleaseType = 'major' | 'minor' | 'patch'

export type ReleaseTypeHint = 'auto' | ReleaseType

/**
 * Specify the strategy used to calculate the next semantic version.
 *
 * - `advance`: Bumps the target core version segment (`major`, `minor`, or
 *   `patch`). Applies when stepping into a new release milestone or switching
 *   to a new prerelease channel.
 *   - Release → Release (e.g., `1.2.3` → `1.3.0`).
 *   - Release → Prerelease (e.g., `1.2.3` → `1.3.0-dev.0`).
 *   - Prerelease → Next Prerelease Channel (e.g., `1.3.0-dev.5` → `1.4.0-dev.0`).
 * - `continue`: Retains the target core version segment without bumping it.
 *   Applies when issuing sequential prerelease builds within the same channel or
 *   graduating an active prerelease directly to its stable target release.
 *   - Prerelease → Prerelease (e.g., `1.3.0-dev.5` → `1.3.0-dev.6`).
 *   - Prerelease → Release (e.g., `1.3.0-dev.5` → `1.3.0`).
 */
export type VersionTransition = 'advance' | 'continue'

export interface ReleaseRule {
  type?: GitRefType | undefined
  pattern?: string | undefined
  qualifier?: string | boolean | undefined
  channel?: string | boolean | undefined
}

export interface ResolvedReleaseRule {
  type: GitRefType | undefined
  pattern: string
  versionQualifier: string | undefined
  releaseChannel: string | undefined
}

export interface ReleaseConfig {
  author?: Partial<GitAuthor>
  classifier?: CommitClassifier | Partial<Record<ReleaseType, GitCommitType[]>>
  rules?: (ReleaseRule | string | false | null | undefined)[]
}

export interface ResolvedReleaseConfig {
  author: GitAuthor
  classifier: CommitClassifier
  rules: ResolvedReleaseRule[]
}

export type ReleaseStatus = 'success' | 'failure'

export interface ReleasePhase {
  hook: ReleaseHookName
  plugin: string
}

export interface ReleaseContext<P extends Package = Package> {
  cwd: string
  env: Readonly<NodeJS.ProcessEnv>
  today: string
  signal: AbortSignal | undefined
  stdout: NodeJS.WritableStream
  stderr: NodeJS.WritableStream
  logger: ConsolaInstance
  repository: GitRepository | null
  ref: GitRef
  commit: GitCommit
  author: GitAuthor
  classifier: CommitClassifier
  rules: ResolvedReleaseRule[]
  type: ReleaseTypeHint
  versionQualifier: string | undefined
  releaseChannel: string | undefined
  allowEmpty: boolean
  dryRun: boolean
  packages: P[]
  plans: ReleasePlan<P>[]
  status: ReleaseStatus | null
  phase: ReleasePhase | null
  error: unknown
}

export interface Workspace {
  entry: string
  members: readonly string[] | null
}

export interface Package {
  provider?: string | undefined
  name: string | undefined
  version: string
  private?: boolean | undefined
  root: boolean
  entry: boolean
  dependencies: string[]
  location: string
  changelogFile?: string | undefined
  files?: string | string[] | undefined
  tag?: Tag | null
}

export interface Tag {
  name: string
  message?: string | undefined
}

export interface Release {
  type: ReleaseType
  transition?: VersionTransition | null
  version?: string | null
  tag?: Tag | null
  changelog?: string | null
}

export interface ReleasePlan<P extends Package = Package> {
  package: P
  history: GitCommit[]
  release: Release | null
}

export interface ReleaseHookDefinition<P extends Package = Package> {
  priority?: number | undefined
  handler: HookHandler<ReleaseContext<P>>
}

export type ReleaseHook<P extends Package = Package> =
  HookHandler<ReleaseContext<P>> | ReleaseHookDefinition<P>

export interface ReleasePlugin<P extends Package = Package> {
  name: string
  version: string
  configure?: ReleaseHook<P> | null | undefined
  discover?: ReleaseHook<P> | null | undefined
  analyze?: ReleaseHook<P> | null | undefined
  build?: ReleaseHook<P> | null | undefined
  write?: ReleaseHook<P> | null | undefined
  publish?: ReleaseHook<P> | null | undefined
  finalize?: ReleaseHook<P> | null | undefined
}

export type ReleaseHookName = Exclude<keyof ReleasePlugin, 'name' | 'version'>

export interface ReleaseReport {
  status: ReleaseStatus | null
  phase: ReleasePhase | null
  error: string | null
  packages: {
    location: string
    name: string | undefined
    version: string
  }[]
  plans: {
    package: {
      provider: string | undefined
      entry: boolean
      location: string
      name: string | undefined
      version: string
      private: boolean
    }
    release: {
      type: ReleaseType
      version: string
      tag: string | null | undefined
      changelog: string | null | undefined
    }
  }[]
}
