// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

export interface ProcessAbortSignal extends AbortSignal, Disposable {
  readonly controller: AbortController
}

/**
 * Create a process abort signal tied to termination events.
 *
 * Registers event listeners for `SIGINT` and `SIGTERM` on the active process
 * to automatically trigger an abort action upon receipt. Attaches a custom
 * disposal method to clean up listeners and enforce abort state on cleanup.
 *
 * @returns A newly configured process abort signal ready for use
 */
export function createProcessAbortSignal(): ProcessAbortSignal {
  const controller = new AbortController()
  const handler = () => controller.abort()

  process.on('SIGINT', handler)
  process.on('SIGTERM', handler)

  const dispose = () => {
    process.off('SIGINT', handler)
    process.off('SIGTERM', handler)

    if (!controller.signal.aborted) {
      controller.abort()
    }
  }

  const signal = controller.signal as ProcessAbortSignal

  Object.defineProperty(signal, 'controller', { value: controller })

  Object.defineProperty(signal, Symbol.dispose, { value: dispose })

  return signal
}
