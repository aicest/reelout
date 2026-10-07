// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

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
