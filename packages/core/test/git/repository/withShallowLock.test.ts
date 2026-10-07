// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { withShallowLock } from '@reelout/core'
import { beforeEach, expect, test, vi } from 'vitest'

const isGitShallowRepository = vi.hoisted(() => vi.fn(async () => true))

vi.mock(import('@reelout/core/git/repository/isGitShallowRepository'), () => ({
  isGitShallowRepository,
}))

function wait(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay))
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

test('returns immediately when repository is not shallow', async () => {
  isGitShallowRepository.mockResolvedValue(false)

  const cwd = '/mock/workspace/non-shallow'

  const result = await withShallowLock(cwd, () => 1)

  expect(result).toBe(1)
})

test('resolves pending waiters concurrently when a running task unshallows the repo', async () => {
  const executionOrder: string[] = []
  const cwd = '/mock/workspace/a'

  const fn1 = async () => {
    await wait(0)
    await withShallowLock(cwd, async () => {
      await wait(200)
      executionOrder.push('task-1-unshallow')
      isGitShallowRepository.mockResolvedValue(false)
    })
  }

  const fn2 = async () => {
    await wait(0)
    await withShallowLock(cwd, async () => {
      await wait(150)
      executionOrder.push('task-2')
    })
  }

  const fn3 = async () => {
    await wait(100)
    await withShallowLock(cwd, async () => {
      executionOrder.push('task-3')
    })
  }

  await Promise.all([fn1(), fn2(), fn3()])

  expect(executionOrder).toMatchInlineSnapshot(`
    [
      "task-1-unshallow",
      "task-3",
      "task-2",
    ]
  `)
})

test('serializes concurrent operations for the same workspace path', async () => {
  const executionOrder: string[] = []
  const cwd = '/mock/workspace/a'

  const fn1 = async () => {
    await wait(0)
    await withShallowLock(cwd, async () => {
      await wait(200)
      executionOrder.push('first')
    })
  }

  const fn2 = async () => {
    await wait(0)
    await withShallowLock(cwd, async () => {
      await wait(150)
      executionOrder.push('second')
    })
  }

  const fn3 = async () => {
    await wait(100)
    await withShallowLock(cwd, async () => {
      executionOrder.push('third')
    })
  }

  await Promise.all([fn1(), fn2(), fn3()])

  expect(executionOrder).toMatchInlineSnapshot(`
    [
      "first",
      "second",
      "third",
    ]
  `)
})

test('permits parallel execution for distinct workspace paths', async () => {
  const executionOrder: string[] = []
  const cwdA = '/mock/workspace/a'
  const cwdB = '/mock/workspace/b'
  const cwdC = '/mock/workspace/c'

  const fn1 = async () => {
    await wait(0)
    await withShallowLock(cwdA, async () => {
      await wait(200)
      executionOrder.push('workspace-a')
    })
  }

  const fn2 = async () => {
    await wait(0)
    await withShallowLock(cwdB, async () => {
      await wait(150)
      executionOrder.push('workspace-b')
    })
  }

  const fn3 = async () => {
    await wait(100)
    await withShallowLock(cwdC, async () => {
      executionOrder.push('workspace-c')
    })
  }

  await Promise.all([fn1(), fn2(), fn3()])

  expect(executionOrder).toMatchInlineSnapshot(`
    [
      "workspace-c",
      "workspace-b",
      "workspace-a",
    ]
  `)
})

test('continues processing subsequent tasks after a failure', async () => {
  const executionOrder: string[] = []
  const cwd = '/mock/workspace/a'

  const fn1 = async () => {
    await withShallowLock(cwd, async () => {
      throw new Error('Operational failure')
    })
  }

  const fn2 = async () => {
    await withShallowLock(cwd, async () => {
      executionOrder.push('subsequent-task-1')
    })
  }

  const fn3 = async () => {
    await withShallowLock(cwd, async () => {
      executionOrder.push('subsequent-task-2')
    })
  }

  await Promise.allSettled([fn1(), fn2(), fn3()])

  expect(executionOrder).toMatchInlineSnapshot(`
    [
      "subsequent-task-1",
      "subsequent-task-2",
    ]
  `)
})

test('supports immediate reentrant acquisition across interleaved workspace paths', async () => {
  const executionOrder: string[] = []
  const cwd1 = '/mock/workspace/a'
  const cwd2 = '/mock/workspace/b'

  const fn1 = async () => {
    await withShallowLock(cwd1, async () => {
      executionOrder.push('fn1-lock-cwd1')
    })
  }

  const fn2 = async () => {
    await withShallowLock(cwd2, async () => {
      await fn1()
      executionOrder.push('fn2-lock-cwd2')
    })
  }

  const fn3 = async () => {
    await withShallowLock(cwd1, async () => {
      await fn2()
      executionOrder.push('fn3-lock-cwd1')
    })
  }

  const fn4 = async () => {
    await withShallowLock(cwd2, async () => {
      await fn3()
      executionOrder.push('fn4-lock-cwd2')
    })
  }

  await fn4()

  expect(executionOrder).toMatchInlineSnapshot(`
    [
      "fn1-lock-cwd1",
      "fn2-lock-cwd2",
      "fn3-lock-cwd1",
      "fn4-lock-cwd2",
    ]
  `)
})
