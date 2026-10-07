// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { Workspace } from '@reelout/core'
import path from 'node:path'

const ALL_FILES = '**/*'

const LOCK_FILES = [
  'package-lock.json',
  'npm-shrinkwrap.json',
  'pnpm-lock.yaml',
  'yarn.lock',
]

/**
 * Build a glob pattern for package files.
 *
 * For workspace roots with members, returns an exclusion pattern that ignores
 * member directories and lock files. For packages or single-package workspaces,
 * returns an inclusion pattern for the package directory or all files.
 *
 * @param workspace Workspace metadata and configuration
 * @param root Whether the package is the workspace root
 * @param dir Package directory relative to workspace root
 * @returns Glob pattern string for the package files
 */
export function buildPackageFilePattern(
  workspace: Workspace,
  root: boolean,
  dir: string
): string {
  const { members } = workspace

  if (members) {
    if (root) {
      const excluded = LOCK_FILES.concat(
        members.map((dir) => path.join(dir, ALL_FILES))
      ).join(',')

      return `!{${excluded}}`
    }

    return path.join(dir, ALL_FILES)
  }

  return ALL_FILES
}
