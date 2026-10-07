// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleasePlan } from '@reelout/core'
import { buildDependencyGraph } from '@reelout/core'
import { expect, test } from 'vitest'

test('maps packages to their dependents', () => {
  const plans = [
    {
      package: {
        location: '.',
        name: undefined,
        dependencies: Object.keys({ b: '*' }),
      },
    },
    {
      package: {
        location: 'a',
        name: 'a',
        dependencies: Object.keys({ b: '*' }),
      },
    },
    {
      package: {
        location: 'b',
        name: 'b',
        dependencies: Object.keys({ a: '*', c: '*' }),
      },
    },
    {
      package: {
        location: 'c',
        name: 'c',
        dependencies: Object.keys({ unknown: '*' }),
      },
    },
    {
      package: {
        location: 'd',
        name: 'd',
        dependencies: Object.keys({}),
      },
    },
    {
      package: {
        location: 'x',
        name: '',
        dependencies: Object.keys({ a: '*' }),
      },
    },
  ] as ReleasePlan[]

  const graph = buildDependencyGraph(plans)

  expect(
    Array.from(graph.entries()).map(([name, dependents]) => ({
      name,
      dependents: Array.from(dependents).map(
        (dependent) => dependent.package.location
      ),
    }))
  ).toEqual([
    { name: 'b', dependents: ['.', 'a'] },
    { name: 'a', dependents: ['b', 'x'] },
    { name: 'c', dependents: ['b'] },
  ])
})
