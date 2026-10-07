// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { createPlugin } from '@reelout/core'
import { expect, test, vi } from 'vitest'

test('returns null when plugin input is null or undefined', async () => {
  expect(await createPlugin(null)).toBeNull()
  expect(await createPlugin(undefined)).toBeNull()
})

test('returns null when plugin object lacks a string name property', async () => {
  expect(await createPlugin({})).toBeNull()
  expect(await createPlugin({ name: 123 })).toBeNull()
})

test('returns null when factory function resolves to an invalid plugin', async () => {
  expect(await createPlugin(() => ({}))).toBeNull()
  expect(await createPlugin(() => null)).toBeNull()
})

test('returns exact object reference when given direct plugin object', async () => {
  const plugin = { name: 'test' }

  expect(await createPlugin(plugin)).toBe(plugin)
})

test('invokes factory function and returns created plugin object', async () => {
  const factory = async () => ({ name: 'test' })

  expect(await createPlugin(factory)).toEqual({ name: 'test' })
})

test('instantiates class constructor and returns plugin instance', async () => {
  class TestPlugin {
    name = 'test'
  }

  expect(await createPlugin(TestPlugin)).toEqual({ name: 'test' })
})

test('passes options to factory function when given tuple configuration', async () => {
  const factory = vi.fn((options: unknown) => ({ name: 'plugin', options }))

  const plugin1 = await createPlugin([factory, { debug: true }])
  const plugin2 = await createPlugin([factory])

  expect(plugin1).toEqual({ name: 'plugin', options: { debug: true } })
  expect(plugin2).toEqual({ name: 'plugin', options: undefined })
  expect(factory.mock.calls).toEqual([[{ debug: true }], [undefined]])
})

test('passes options to class constructor when given tuple configuration', async () => {
  class TestPlugin {
    name = 'plugin'
    options: unknown

    constructor(options: unknown) {
      this.options = options
    }
  }

  const plugin1 = await createPlugin([TestPlugin, { debug: true }])
  const plugin2 = await createPlugin([TestPlugin])

  expect(plugin1).toEqual({ name: 'plugin', options: { debug: true } })
  expect(plugin2).toEqual({ name: 'plugin', options: undefined })
})

test('ignores options and returns plugin object when plain object is provided in tuple', async () => {
  const plugin = { name: 'plugin' }

  expect(await createPlugin([plugin, { debug: true }])).toBe(plugin)
})
