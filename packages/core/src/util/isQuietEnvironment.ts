// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleaseContext } from '../types'
import { isCI } from './isCI'

/**
 * Determine whether the current run should stay quiet about verbose output.
 *
 * A run is quiet when nothing will keep what it prints: no terminal is attached
 * for a human, and no CI provider is recording a job log. A plain pipe outside
 * of CI — an agent sandbox, a script capturing output, a detached daemon — only
 * accumulates noise, so verbose output should be withheld and left to
 * `execCommand` for error reporting instead.
 *
 * CI is deliberately *not* quiet even though its streams are not TTYs: the
 * provider persists the job log, so the output does reach someone. A caller
 * that wants output from a pipe in a non-CI environment can set `CI=1` as an
 * escape hatch.
 *
 * The verdict is per environment, not per stream, so a redirected stdout inside
 * an interactive terminal still counts as quiet.
 *
 * @param context Release context carrying the destination stream and environment
 * @returns `true` when no TTY is attached and the run is not part of CI
 */
export function isQuietEnvironment(
  context: Pick<ReleaseContext, 'env' | 'stdout'>
): boolean {
  if (isCI(context.env)) return false

  const stream = context.stdout as NodeJS.WriteStream | undefined

  return stream?.isTTY !== true
}
