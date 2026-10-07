// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { AsyncLocalStorage } from 'node:async_hooks'
import { isGitShallowRepository } from './isGitShallowRepository'

const lockQueue = new Map<string, Promise<void>>()

const context = new AsyncLocalStorage<Set<string>>()

/**
 * Serialize access to a shallow Git repository while running a callback.
 *
 * If `cwd` is a shallow clone, callers from different async contexts are
 * executed one at a time; nested calls within the same async context run
 * immediately without waiting. If the repository becomes non-shallow before
 * a queued turn runs, downstream waiters are released early.
 *
 * @param cwd Repository working directory path string
 * @param callback Function to execute while the lock is held
 * @returns Promise resolving to the result of `callback`
 */
export async function withShallowLock<T>(
  cwd: string,
  callback: () => T | Promise<T>
): Promise<T> {
  if (!(await isGitShallowRepository(cwd))) {
    return callback()
  }

  const active = context.getStore()

  if (active?.has(cwd)) {
    return callback()
  }

  const { promise, resolve } = Promise.withResolvers<void>()
  const previous = lockQueue.get(cwd) ?? Promise.resolve()
  const queued = previous.then(() => promise)

  lockQueue.set(cwd, queued)

  // Wait until previous tasks complete.
  await previous

  // If an earlier task made the repo non-shallow, release downstream waiters now.
  if (!(await isGitShallowRepository(cwd))) {
    resolve()
  }

  try {
    return await context.run(new Set(active).add(cwd), callback)
  } finally {
    // Ensure downstream waiters are unblocked even if callback throws.
    resolve()

    // Remove the queue entry only if no newer task has replaced it.
    if (lockQueue.get(cwd) === queued) {
      lockQueue.delete(cwd)
    }
  }
}
