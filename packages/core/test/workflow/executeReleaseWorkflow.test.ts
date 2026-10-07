// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type {
  Package,
  ReleaseContext,
  ReleasePlan,
  ReleasePlugin,
} from '@reelout/core'
import {
  HookPriority,
  RELEASE_HOOK_NAMES,
  executeReleaseWorkflow,
} from '@reelout/core'
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import { context, logger } from '../../../../test/mock/context'

function wait(delay: number) {
  return vi.advanceTimersByTimeAsync(delay)
}

const plugin = {
  name: 'plugin',
  version: '1.0.0',
  configure: vi.fn((ctx, next) => next(ctx)),
  discover: vi.fn((ctx, next) => next(ctx)),
  analyze: vi.fn((ctx, next) => next(ctx)),
  build: vi.fn((ctx, next) => next(ctx)),
  write: vi.fn((ctx, next) => next(ctx)),
  publish: vi.fn((ctx, next) => next(ctx)),
  finalize: vi.fn((ctx, next) => next(ctx)),
} satisfies Required<ReleasePlugin>

let executedHooks: string[]

const trackedPlugin = RELEASE_HOOK_NAMES.reduce(
  (plugin, hook) => {
    const handler = plugin[hook]

    return {
      ...plugin,
      [hook]: vi.fn(async (ctx, next) => {
        executedHooks.push(hook)

        const proxy = {
          get packages() {
            return ctx.packages
          },
          set packages(packages) {
            ctx.packages = packages
          },
          get plans() {
            return ctx.plans
          },
          set plans(plans) {
            ctx.plans = plans
          },
        } as ReleaseContext

        return handler(proxy, next)
      }),
    }
  },
  { ...plugin }
)

const plugins = [trackedPlugin]

beforeAll(() => {
  vi.useFakeTimers()
})

beforeEach(() => {
  executedHooks = []
})

afterEach(() => {
  vi.resetAllMocks()
})

test('executes all workflow hooks with empty release plans when no packages are discovered', async () => {
  plugin.discover.mockImplementation((ctx, next) => {
    ctx.packages = []
    return next()
  })

  await executeReleaseWorkflow(context, plugins)

  expect(plugin.configure).toHaveBeenCalledTimes(1)
  expect(plugin.discover).toHaveBeenCalledTimes(1)
  expect(plugin.analyze).toHaveBeenCalledTimes(1)
  expect(plugin.build).toHaveBeenCalledTimes(1)
  expect(plugin.write).toHaveBeenCalledTimes(1)
  expect(plugin.publish).toHaveBeenCalledTimes(1)
  expect(plugin.finalize).toHaveBeenCalledTimes(1)
  expect(plugin.finalize.mock.calls).toMatchInlineSnapshot(`
    [
      [
        {
          "packages": [],
          "plans": [],
        },
        [Function],
      ],
    ]
  `)
  expect(executedHooks).toEqual([
    'configure',
    'discover',
    'analyze',
    'build',
    'write',
    'publish',
    'finalize',
  ])
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [33mNo packages are scheduled for release.[39m",
      ],
    ]
  `)
})

test('forwards discovered packages to finalize hook context when package discovery succeeds', async () => {
  plugin.discover.mockImplementation((ctx, next) => {
    ctx.packages = [{ name: 'foo' }, { name: 'bar' }] as Package[]
    return next()
  })

  await executeReleaseWorkflow(context, plugins)

  expect(plugin.configure).toHaveBeenCalledTimes(1)
  expect(plugin.discover).toHaveBeenCalledTimes(1)
  expect(plugin.analyze).toHaveBeenCalledTimes(1)
  expect(plugin.build).toHaveBeenCalledTimes(1)
  expect(plugin.write).toHaveBeenCalledTimes(1)
  expect(plugin.publish).toHaveBeenCalledTimes(1)
  expect(plugin.finalize).toHaveBeenCalledTimes(1)
  expect(plugin.finalize.mock.calls).toMatchInlineSnapshot(`
    [
      [
        {
          "packages": [
            {
              "name": "foo",
            },
            {
              "name": "bar",
            },
          ],
          "plans": [],
        },
        [Function],
      ],
    ]
  `)
  expect(executedHooks).toEqual([
    'configure',
    'discover',
    'analyze',
    'build',
    'write',
    'publish',
    'finalize',
  ])
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [33mNo packages are scheduled for release.[39m",
      ],
    ]
  `)
})

test('prints release summary report when packages are scheduled for release', async () => {
  plugin.discover.mockImplementation((ctx, next) => {
    ctx.packages = [{ name: 'foo' }, { name: 'bar' }] as Package[]
    return next()
  })

  plugin.build.mockImplementation((ctx, next) => {
    ctx.plans = [
      {
        package: { name: 'foo', location: 'foo' },
        release: null,
      },
      {
        package: { name: 'bar', location: 'bar', version: '0.5.0' },
        release: { version: '1.0.0', type: 'major' },
      },
      {
        package: { name: 'baz', location: 'baz' },
        release: null,
      },
    ] as ReleasePlan[]

    return next()
  })

  await executeReleaseWorkflow(context, plugins)

  expect(plugin.configure).toHaveBeenCalledTimes(1)
  expect(plugin.discover).toHaveBeenCalledTimes(1)
  expect(plugin.analyze).toHaveBeenCalledTimes(1)
  expect(plugin.build).toHaveBeenCalledTimes(1)
  expect(plugin.write).toHaveBeenCalledTimes(1)
  expect(plugin.publish).toHaveBeenCalledTimes(1)
  expect(plugin.finalize).toHaveBeenCalledTimes(1)
  expect(plugin.finalize.mock.calls).toMatchInlineSnapshot(`
    [
      [
        {
          "packages": [
            {
              "name": "foo",
            },
            {
              "name": "bar",
            },
          ],
          "plans": [
            {
              "package": {
                "location": "foo",
                "name": "foo",
              },
              "release": null,
            },
            {
              "package": {
                "location": "bar",
                "name": "bar",
                "version": "0.5.0",
              },
              "release": {
                "type": "major",
                "version": "1.0.0",
              },
            },
            {
              "package": {
                "location": "baz",
                "name": "baz",
              },
              "release": null,
            },
          ],
        },
        [Function],
      ],
    ]
  `)
  expect(executedHooks).toEqual([
    'configure',
    'discover',
    'analyze',
    'build',
    'write',
    'publish',
    'finalize',
  ])
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m1 released[39m[22m [90m(2)[39m

    [44m bar [49m[41m 1.0.0 ← 0.5.0 [49m[90m major [39m
    ",
      ],
    ]
  `)
})

test('prints dry-run preview report when dryRun mode is enabled', async () => {
  plugin.discover.mockImplementation((ctx, next) => {
    ctx.packages = [{ name: 'foo' }, { name: 'bar' }] as Package[]
    return next()
  })

  plugin.build.mockImplementation((ctx, next) => {
    ctx.plans = [
      {
        package: { location: 'foo' },
        release: null,
      },
      {
        package: { location: 'bar', version: '1.0.0-rc.0' },
        release: { version: '1.0.0', type: 'major' },
      },
      {
        package: { location: 'baz', version: '2.0.0-rc.0' },
        release: { version: '2.0.0', type: 'major' },
      },
    ] as ReleasePlan[]

    return next()
  })

  using _ = vi.spyOn(context, 'dryRun', 'get').mockReturnValue(true)

  await executeReleaseWorkflow(context, plugins)

  expect(plugin.configure).toHaveBeenCalledTimes(1)
  expect(plugin.discover).toHaveBeenCalledTimes(1)
  expect(plugin.analyze).toHaveBeenCalledTimes(1)
  expect(plugin.build).toHaveBeenCalledTimes(1)
  expect(plugin.write).toHaveBeenCalledTimes(1)
  expect(plugin.publish).toHaveBeenCalledTimes(1)
  expect(plugin.finalize).toHaveBeenCalledTimes(1)
  expect(plugin.finalize.mock.calls).toMatchInlineSnapshot(`
    [
      [
        {
          "packages": [
            {
              "name": "foo",
            },
            {
              "name": "bar",
            },
          ],
          "plans": [
            {
              "package": {
                "location": "foo",
              },
              "release": null,
            },
            {
              "package": {
                "location": "bar",
                "version": "1.0.0-rc.0",
              },
              "release": {
                "type": "major",
                "version": "1.0.0",
              },
            },
            {
              "package": {
                "location": "baz",
                "version": "2.0.0-rc.0",
              },
              "release": {
                "type": "major",
                "version": "2.0.0",
              },
            },
          ],
        },
        [Function],
      ],
    ]
  `)
  expect(executedHooks).toEqual([
    'configure',
    'discover',
    'analyze',
    'build',
    'write',
    'publish',
    'finalize',
  ])
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m2 released[39m[22m [90m(2)[39m

    [90m ./bar [39m[41m 1.0.0 ← 1.0.0-rc.0 [49m[90m major [39m

    [90m ./baz [39m[41m 2.0.0 ← 2.0.0-rc.0 [49m[90m major [39m
    ",
      ],
    ]
  `)
})

test('executes plugin hooks in onion order when dispatching phase middleware', async () => {
  const executionOrder: string[] = []

  const plugin1: ReleasePlugin = {
    name: 'plugin1',
    version: '1.0.0',
    configure: async (ctx, next) => {
      executionOrder.push('pre-1')
      await next(ctx)
      executionOrder.push('post-1')
    },
  }

  const plugin2: ReleasePlugin = {
    name: 'plugin2',
    version: '1.0.0',
    configure: async (ctx, next) => {
      executionOrder.push('pre-2')
      await next(ctx)
      executionOrder.push('post-2')
    },
  }

  const plugin3: ReleasePlugin = {
    name: 'plugin3',
    version: '1.0.0',
    configure: async (ctx, next) => {
      executionOrder.push('pre-3')
      await next(ctx)
      executionOrder.push('post-3')
    },
  }

  await executeReleaseWorkflow(context, [plugin1, plugin2, plugin3])

  expect(executionOrder).toEqual([
    'pre-1',
    'pre-2',
    'pre-3',
    'post-3',
    'post-2',
    'post-1',
  ])
})

test('executes only implemented plugin hooks when plugins omit optional handlers', async () => {
  const plugin1: ReleasePlugin = {
    name: 'plugin1',
    version: '1.0.0',
    analyze: vi.fn((ctx, next) => next(ctx)),
    build: undefined,
    write: undefined,
  }

  const plugin2: ReleasePlugin = {
    name: 'plugin2',
    version: '1.0.0',
    analyze: undefined,
    build: vi.fn((ctx, next) => next(ctx)),
    write: undefined,
  }

  const plugin3: ReleasePlugin = {
    name: 'plugin3',
    version: '1.0.0',
    analyze: undefined,
    build: undefined,
    write: vi.fn((ctx, next) => next(ctx)),
  }

  await executeReleaseWorkflow(context, [plugin1, plugin2, plugin3])

  expect(plugin1.analyze).toHaveBeenCalled()
  expect(plugin2.build).toHaveBeenCalled()
  expect(plugin3.write).toHaveBeenCalled()
})

test('retains class instance binding when executing class-based plugin hooks', async () => {
  class ClassPlugin implements ReleasePlugin {
    name = 'class-plugin'
    version = '1.0.0'
    state = 'initialized'

    configure(ctx: ReleaseContext): void {
      if (this.state === 'initialized') {
        ctx.logger.info(this.name)
      }
    }
  }

  await executeReleaseWorkflow(context, [new ClassPlugin()])

  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "class-plugin",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [33mNo packages are scheduled for release.[39m",
      ],
    ]
  `)
})

test('stops subsequent hook execution when a plugin hook omits calling next', async () => {
  const plugin1: ReleasePlugin = {
    name: 'plugin1',
    version: '1.0.0',
    configure: vi.fn((ctx, next) => next(ctx)),
    discover: vi.fn((ctx, next) => next(ctx)),
  }

  const plugin2: ReleasePlugin = {
    name: 'plugin2',
    version: '1.0.0',
    configure: vi.fn((ctx, next) => ctx),
    discover: vi.fn((ctx, next) => next(ctx)),
  }

  const plugin3: ReleasePlugin = {
    name: 'plugin3',
    version: '1.0.0',
    configure: vi.fn((ctx, next) => next(ctx)),
    discover: vi.fn((ctx, next) => next(ctx)),
  }

  await executeReleaseWorkflow(context, [plugin1, plugin2, plugin3])

  expect(plugin1.configure).toHaveBeenCalled()
  expect(plugin2.configure).toHaveBeenCalled()
  expect(plugin3.configure).not.toHaveBeenCalled()
  expect(plugin1.discover).not.toHaveBeenCalled()
  expect(plugin2.discover).not.toHaveBeenCalled()
  expect(plugin3.discover).not.toHaveBeenCalled()
})

test('orders hook execution by defined priority when executing a workflow phase', async () => {
  const executionOrder: string[] = []

  const plugin1: ReleasePlugin = {
    name: 'plugin1',
    version: '1.0.0',
    configure: (ctx, next) => {
      executionOrder.push('plugin1:configure')
      return next(ctx)
    },
    discover: (ctx, next) => {
      executionOrder.push('plugin1:discover')
      return next(ctx)
    },
  }

  const plugin2: ReleasePlugin = {
    name: 'plugin2',
    version: '1.0.0',
    configure: {
      priority: HookPriority.Low,
      handler: (ctx, next) => {
        executionOrder.push('plugin2:configure')
        return next(ctx)
      },
    },
    discover: {
      priority: HookPriority.Low,
      handler: (ctx, next) => {
        executionOrder.push('plugin2:discover')
        return next(ctx)
      },
    },
  }

  const plugin3: ReleasePlugin = {
    name: 'plugin3',
    version: '1.0.0',
    configure: (ctx, next) => {
      executionOrder.push('plugin3:configure')
      return next(ctx)
    },
    discover: (ctx, next) => {
      executionOrder.push('plugin3:discover')
      return next(ctx)
    },
  }

  await executeReleaseWorkflow(context, [plugin1, plugin2, plugin3])

  expect(executionOrder).toEqual([
    'plugin1:configure',
    'plugin3:configure',
    'plugin2:configure',
    'plugin1:discover',
    'plugin3:discover',
    'plugin2:discover',
  ])
})

test('triggers error cleanup handlers in reverse onion order when a phase hook throws', async () => {
  const executionOrder: string[] = []
  const rollback1 = vi.fn((err) => executionOrder.push('rollback1'))
  const rollback2 = vi.fn((err) => executionOrder.push('rollback2'))

  plugin.configure.mockImplementation(async (ctx, next) => {
    try {
      return await next(ctx)
    } catch (err) {
      rollback1(err)
      throw err
    }
  })

  plugin.discover.mockImplementation(async (ctx, next) => {
    try {
      return await next(ctx)
    } catch (err) {
      rollback2(err)
      throw err
    }
  })

  plugin.write.mockImplementation((ctx, next) => {
    throw new Error('Something went wrong')
  })

  await expect(executeReleaseWorkflow(context, plugins)).rejects.toThrow(
    'Something went wrong'
  )

  expect(plugin.configure).toHaveBeenCalledTimes(1)
  expect(plugin.discover).toHaveBeenCalledTimes(1)
  expect(plugin.analyze).toHaveBeenCalledTimes(1)
  expect(plugin.build).toHaveBeenCalledTimes(1)
  expect(plugin.write).toHaveBeenCalledTimes(1)
  expect(plugin.publish).toHaveBeenCalledTimes(0)
  expect(plugin.finalize).toHaveBeenCalledTimes(0)
  expect(executedHooks).toEqual([
    'configure',
    'discover',
    'analyze',
    'build',
    'write',
  ])
  expect(rollback1).toHaveBeenCalledTimes(1)
  expect(rollback1).toHaveBeenCalledWith(new Error('Something went wrong'))
  expect(rollback2).toHaveBeenCalledTimes(1)
  expect(rollback2).toHaveBeenCalledWith(new Error('Something went wrong'))
  expect(executionOrder).toEqual(['rollback2', 'rollback1'])
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [31mFAILURE[39m",
      ],
      [
        "Release complete: [31mSomething went wrong[39m",
      ],
    ]
  `)
})

test('logs hook execution duration when environment mode is set to development', async () => {
  using _ = vi
    .spyOn(process, 'env', 'get')
    .mockReturnValue({ MODE: 'development' })

  const plugin: ReleasePlugin = {
    name: 'plugin',
    version: '1.0.0',
    configure: async (ctx, next) => {
      await wait(3000)
      await next(ctx)
      await wait(4000)
    },
    discover: async (ctx, next) => {
      await wait(1000)
      await next(ctx)
      await wait(2000)
    },
  }

  await expect(
    executeReleaseWorkflow(context, [plugin])
  ).resolves.toBeUndefined()

  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[90m[configure][39m plugin",
      ],
      [
        "[90m[discover][39m plugin",
      ],
      [
        "[90m[discover][39m plugin [36m3.00s[39m",
      ],
      [
        "[90m[configure][39m plugin [33m7.00s[39m",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [33mNo packages are scheduled for release.[39m",
      ],
    ]
  `)
})

test('logs failed duration and error status when a hook throws in development mode', async () => {
  using _ = vi
    .spyOn(process, 'env', 'get')
    .mockReturnValue({ MODE: 'development' })

  const plugin: ReleasePlugin = {
    name: 'plugin',
    version: '1.0.0',
    configure: async () => {
      await wait(5500)
      throw new Error('Failed loudly')
    },
  }

  await expect(executeReleaseWorkflow(context, [plugin])).rejects.toThrow(
    'Failed loudly'
  )

  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[90m[configure][39m plugin",
      ],
      [
        "[90m[configure][39m plugin [33m5.50s[39m",
      ],
      [
        "Status: [31mFAILURE[39m",
      ],
      [
        "Release complete: [31mFailed loudly[39m",
      ],
    ]
  `)
})
