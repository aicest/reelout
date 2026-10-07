// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { CommitBase, CommitNote } from 'conventional-commits-parser'
import type { Hosts } from 'hosted-git-info'

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

export type ReleaseType = 'major' | 'minor' | 'patch'

export interface ReleaseContext {
  cwd: string
  env: Readonly<NodeJS.ProcessEnv>
  today: string
  repository: GitRepository | null
  dryRun: boolean
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
  version?: string | null
  tag?: Tag | null
  changelog?: string | null
}

export interface ReleasePlan<P extends Package = Package> {
  package: P
  history: GitCommit[]
  release: Release | null
}
