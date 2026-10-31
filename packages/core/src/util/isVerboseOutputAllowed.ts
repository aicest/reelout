// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isCI } from './isCI'

/**
 * Determine whether verbose child process output may be written to a stream.
 *
 * Verbose output is worth printing when something will actually keep it: an
 * attached terminal for a human, or a CI provider that records the job log.
 * A plain pipe outside of CI — an agent sandbox, a script capturing output, a
 * detached daemon — would only accumulate noise, so the output is withheld and
 * left to `execCommand` for error reporting instead. A caller that does want
 * the output in a non-TTY, non-CI environment can set `CI=1`, which this
 * predicate treats as an escape hatch.
 *
 * @param stream Optional writable stream that would receive the output, may be
 * `undefined` when the caller has no stream to forward to
 * @param env Readonly process environment variables object
 * @returns `true` when a TTY is attached or the run happens in CI
 */
export function isVerboseOutputAllowed(
  stream: NodeJS.WritableStream | undefined,
  env: Readonly<NodeJS.ProcessEnv>
): boolean {
  if (isCI(env)) return true

  return (stream as NodeJS.WriteStream | undefined)?.isTTY === true
}
