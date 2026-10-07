// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execCommand, type ExecCommandOptions } from '@reelout/core'
import semver from 'semver'
import type { PackageManager } from './resolvePackageManager'

/**
 * Retrieve the major version number of an installed package manager.
 *
 * Executes the version query flag for the specified package manager binary
 * and parses the standard output using semver semantics.
 *
 * @param cwd Working directory path where the binary command executes
 * @param manager Name of the package manager executable
 * @param options Additional execution, environment, and stream options
 * @returns Major version number or undefined if parsing fails
 */
export async function getPackageManagerVersion(
  cwd: string,
  manager: PackageManager,
  options?: Partial<ExecCommandOptions>
): Promise<number | undefined> {
  try {
    const version = (
      await execCommand(manager, ['-v'], { ...options, cwd })
    ).trim()

    const parsed = semver.parse(version)

    return parsed?.major
  } catch {
    return undefined
  }
}
