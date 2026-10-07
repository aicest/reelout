// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { RELEASE_HOOK_NAMES } from '#config'
import { HookManager, type HookHandler } from '#plugin'
import type { ReleaseContext, ReleaseHookName, ReleasePlugin } from '#types'
import { colors } from 'consola/utils'
import { generateReleaseReport, printReleaseReport } from './report'

/**
 * Execute the complete release workflow across all configured plugins.
 *
 * Runs each lifecycle phase sequentially, dispatching plugin hooks in onion
 * order based on declared priority. Logs hook execution timing for non-silent
 * runs and prints a release report upon completion or failure.
 *
 * @param context Release execution context containing runtime options and logger
 * @param plugins List of release plugins to execute
 * @returns Promise that resolves when all workflow phases complete
 * @throws If any lifecycle hook execution fails
 */
export async function executeReleaseWorkflow(
  context: ReleaseContext,
  plugins: readonly ReleasePlugin[]
): Promise<void> {
  const isSilent = import.meta.env.MODE === 'test'

  try {
    context.status = null
    context.error = null

    const manager = new HookManager<
      Record<ReleaseHookName, HookHandler<ReleaseContext>>
    >()

    for (const hookName of RELEASE_HOOK_NAMES) {
      for (const plugin of plugins) {
        let hook = plugin[hookName]

        if (typeof hook === 'function') {
          hook = { handler: hook }
        }

        const handler = hook?.handler
        const priority = hook?.priority

        if (handler) {
          manager.on(
            hookName,
            async (context, next) => {
              const current = (context.phase = {
                hook: hookName,
                plugin: plugin.name,
              })

              const label = `${colors.gray(`[${current.hook}]`)} ${current.plugin}`
              let startedLogging = false
              let hasError = false

              if (!isSilent) {
                startedLogging = true
                context.logger.start(label)
              }

              const currentFrame = { startTime: performance.now() }
              const nextFrame = { duration: 0 }

              try {
                return await handler.call(plugin, context, async () => {
                  const startTime = performance.now()

                  try {
                    return await next(context)
                  } finally {
                    nextFrame.duration = performance.now() - startTime
                  }
                })
              } catch (err) {
                hasError = true
                throw err
              } finally {
                if (startedLogging) {
                  const duration =
                    performance.now() -
                    currentFrame.startTime -
                    nextFrame.duration
                  const color = duration >= 5000 ? colors.yellow : colors.cyan
                  const message = [
                    label,
                    color(`${(duration / 1000).toFixed(2)}s`),
                  ].join(' ')

                  if (hasError) {
                    context.logger.error(message)
                  } else {
                    context.logger.success(message)
                  }
                }
              }
            },
            priority
          )
        }
      }
    }

    const dispatch = async (
      index: number,
      context: ReleaseContext
    ): Promise<void> => {
      const hook = RELEASE_HOOK_NAMES[index]

      if (!hook) return

      return await manager.emit(hook, context, (context) =>
        dispatch(index + 1, context)
      )
    }

    await dispatch(0, context)

    context.status = 'success'
  } catch (err) {
    context.status = 'failure'
    context.error = err
    throw err
  } finally {
    printReleaseReport(context.logger, generateReleaseReport(context))
  }
}
