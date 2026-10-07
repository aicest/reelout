// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

export type NextFunction<Context> = (context: Context) => Promise<void>

export type HookHandler<Context> = {
  bivariant(context: Context, next: NextFunction<Context>): void | Promise<void>
}['bivariant']

export const HookPriority = {
  High: 50,
  Normal: 0,
  Low: -50,
} as const

interface HookRegistration<HookName, Context> {
  name: HookName
  handler: HookHandler<Context>
  priority: number
}

export type InferContext<Handler> =
  Handler extends HookHandler<infer Context> ? Context : never

/**
 * Manage hook registrations and asynchronous execution chains.
 *
 * Stores handlers in a prioritized registry and executes them sequentially in
 * priority order.
 */
export class HookManager<
  HookMap extends Record<keyof HookMap, HookHandler<unknown>>,
> {
  readonly #registry = new Map<
    keyof HookMap,
    HookRegistration<keyof HookMap, unknown>[]
  >()

  /**
   * Register a handler function for a specific hook.
   *
   * Adds the `handler` to the internal registry for `name` and sorts the list
   * so higher-priority handlers run first.
   *
   * @param name Name of the hook to register
   * @param handler Callback function executed when the hook triggers
   * @param priority Execution order rank where higher values run earlier
   */
  on<HookName extends keyof HookMap>(
    name: HookName,
    handler: HookMap[HookName],
    priority: number = HookPriority.Normal
  ): void {
    const registrations = this.#registry.get(name) ?? []

    registrations.push({ name, handler, priority })

    registrations.sort((a, b) => b.priority - a.priority)

    this.#registry.set(name, registrations)
  }

  /**
   * Unregister a handler function from a specific hook.
   *
   * Removes matching `handler` references from the internal registry for
   * `name`. Takes no action if `name` has no registered handlers.
   *
   * @param name Name of the hook to unregister from
   * @param handler Reference of the handler function to remove
   */
  off<HookName extends keyof HookMap>(
    name: HookName,
    handler: HookMap[HookName]
  ): void {
    const registrations = this.#registry.get(name)

    if (!registrations) return

    this.#registry.set(
      name,
      registrations.filter((registration) => registration.handler !== handler)
    )
  }

  /**
   * Trigger execution of all handlers registered to a hook.
   *
   * Passes `context` through the handler pipeline in descending priority order.
   * Enables handlers to control execution flow using `next` and executes `done`
   * after the last handler completes.
   *
   * @param name Name of the hook to trigger
   * @param context Shared payload passed into each handler
   * @param done Optional final callback run after the pipeline completes
   * @returns Promise that resolves when execution completes
   */
  async emit<HookName extends keyof HookMap>(
    name: HookName,
    context: InferContext<HookMap[HookName]>,
    done?: NextFunction<InferContext<HookMap[HookName]>>
  ): Promise<void> {
    type Context = InferContext<HookMap[HookName]>

    const registrations = (this.#registry.get(name) ?? []) as HookRegistration<
      HookName,
      Context
    >[]

    const dispatch = async (index: number, context: Context): Promise<void> => {
      const registration = registrations[index]

      if (!registration) {
        return done ? await done(context) : undefined
      }

      let isNextCalled = false

      return await registration.handler(context, async (context) => {
        if (isNextCalled) return
        isNextCalled = true
        return await dispatch(index + 1, context)
      })
    }

    return await dispatch(0, context)
  }
}
