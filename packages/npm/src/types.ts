// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

export interface PackageJson {
  name?: string | undefined
  version?: string | undefined
  description?: string | undefined
  private?: boolean | undefined
  dependencies?: Record<string, string> | undefined
  devDependencies?: Record<string, string> | undefined
  peerDependencies?: Record<string, string> | undefined
  optionalDependencies?: Record<string, string> | undefined
}
