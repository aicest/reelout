// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  HookManager,
  HookPriority,
  type HookHandler,
  type NextFunction,
} from '@reelout/core'
import { beforeEach, expect, test, vi } from 'vitest'

interface TestContext {
  value: string
  steps: string[]
}

let context: TestContext
let manager: HookManager<Record<string, HookHandler<TestContext>>>

beforeEach(() => {
  context = { value: 'test', steps: [] }
  manager = new HookManager<Record<string, HookHandler<TestContext>>>()
})

test('executes handlers in registration order when priority is omitted', async () => {
  manager.on('run', (ctx, next) => {
    ctx.steps.push('first')
    return next(ctx)
  })

  manager.on('run', (ctx, next) => {
    ctx.steps.push('second')
    return next(ctx)
  })

  await manager.emit('run', context)

  expect(context.steps).toEqual(['first', 'second'])
})

test('executes handlers in descending priority order when priorities differ', async () => {
  manager.on(
    'run',
    (ctx, next) => {
      ctx.steps.push('normal')
      return next(ctx)
    },
    HookPriority.Normal
  )

  manager.on(
    'run',
    (ctx, next) => {
      ctx.steps.push('high')
      return next(ctx)
    },
    HookPriority.High
  )

  manager.on(
    'run',
    (ctx, next) => {
      ctx.steps.push('low')
      return next(ctx)
    },
    HookPriority.Low
  )

  await manager.emit('run', context)

  expect(context.steps).toEqual(['high', 'normal', 'low'])
})

test('preserves registration order when handlers share equal priorities', async () => {
  manager.on(
    'run',
    (ctx, next) => {
      ctx.steps.push('a')
      return next(ctx)
    },
    HookPriority.Normal
  )

  manager.on(
    'run',
    (ctx, next) => {
      ctx.steps.push('b')
      return next(ctx)
    },
    HookPriority.Normal
  )

  await manager.emit('run', context)

  expect(context.steps).toEqual(['a', 'b'])
})

test('does not execute handler when unregistered before emit', async () => {
  const handler = async (ctx: TestContext, next: NextFunction<TestContext>) => {
    ctx.steps.push('removed')
    return next(ctx)
  }

  manager.on('run', handler)
  manager.off('run', handler)

  await manager.emit('run', context)

  expect(context.steps).toEqual([])
})

test('does not throw when unregistering non-existent hook or handler', async () => {
  const handler = (ctx: TestContext) => {}

  expect(() => manager.off('unknown', handler)).not.toThrow()

  manager.on('run', handler)

  expect(() => manager.off('other', handler)).not.toThrow()

  await manager.emit('run', context)

  expect(context.steps).toEqual([])
})

test('does not mutate context when emitting unregistered hook', async () => {
  await manager.emit('unknown', context)

  expect(context.value).toBe('test')
  expect(context.steps).toEqual([])
})

test('retains context modifications when pipeline execution completes', async () => {
  manager.on('run', async (ctx, next) => {
    await next(ctx)
    ctx.value = `${ctx.value}-outer`
  })

  manager.on('run', async (ctx, next) => {
    await next(ctx)
    ctx.value = `${ctx.value}-inner`
  })

  await manager.emit('run', context)

  expect(context.value).toBe('test-inner-outer')
})

test('halts downstream execution when next callback is omitted', async () => {
  manager.on('run', async (ctx) => {
    ctx.steps.push('stopped')
    return
  })

  manager.on('run', (ctx, next) => {
    ctx.steps.push('never-reached')
    return next(ctx)
  })

  await manager.emit('run', context)

  expect(context.steps).toEqual(['stopped'])
})

test('prevents duplicate downstream execution when next callback is called multiple times', async () => {
  manager.on('run', async (ctx, next) => {
    ctx.steps.push('first-call')
    await next(ctx)
    return next(ctx)
  })

  manager.on('run', (ctx, next) => {
    ctx.steps.push('second')
    return next(ctx)
  })

  await manager.emit('run', context)

  expect(context.steps).toEqual(['first-call', 'second'])
})

test('invokes done callback with final context when pipeline completes', async () => {
  const terminalCallback = vi.fn(async (ctx: TestContext) => {
    ctx.value = 'modified-by-terminal'
  })

  manager.on('run', (ctx, next) => {
    ctx.steps.push('step')
    return next(ctx)
  })

  await manager.emit('run', context, terminalCallback)

  expect(context.steps).toEqual(['step'])
  expect(context.value).toBe('modified-by-terminal')
  expect(terminalCallback).toHaveBeenCalledOnce()
  expect(terminalCallback).toHaveBeenCalledWith(context)
})

test('invokes done callback when emitting unregistered hook', async () => {
  const terminalCallback = vi.fn(async (ctx: TestContext) => {})

  await manager.emit('unknown', context, terminalCallback)

  expect(terminalCallback).toHaveBeenCalledOnce()
  expect(terminalCallback).toHaveBeenCalledWith(context)
})

test('rethrows error when handler throws exception during execution', async () => {
  manager.on('run', (ctx, next) => {
    return next(ctx)
  })

  manager.on('run', () => {
    throw new Error('Handler execution failed')
  })

  await expect(manager.emit('run', context)).rejects.toThrow(
    'Handler execution failed'
  )
})
