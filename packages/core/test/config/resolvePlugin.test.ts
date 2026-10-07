// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { resolvePlugin } from '@reelout/core'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'

test('rejects when module file path does not exist', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await writeFile(
      path.join(cwd, 'package.json'),
      JSON.stringify({ type: 'module' })
    )

    const filePath = path.join(cwd, 'missing.js')

    await expect(resolvePlugin(cwd, filePath)).rejects.toThrow(
      'Cannot find module'
    )
  })
})

test('rejects when module file contains invalid JavaScript', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await writeFile(
      path.join(cwd, 'package.json'),
      JSON.stringify({ type: 'module' })
    )

    const filePath = path.join(cwd, 'index.js')

    await writeFile(filePath, 'not a js file')

    await expect(resolvePlugin(cwd, filePath)).rejects.toThrow()
  })
})

test('returns null when module lacks default export', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await writeFile(
      path.join(cwd, 'package.json'),
      JSON.stringify({ type: 'module' })
    )

    const filePath = path.join(cwd, 'index.js')

    await writeFile(filePath, 'export const a = 1')

    expect(await resolvePlugin(cwd, filePath)).toBeNull()
  })
})

test('returns null when default export is null', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await writeFile(
      path.join(cwd, 'package.json'),
      JSON.stringify({ type: 'module' })
    )

    const filePath = path.join(cwd, 'index.js')

    await writeFile(filePath, 'export default null')

    expect(await resolvePlugin(cwd, filePath)).toBeNull()
  })
})

test('returns null when default export object lacks a string name property', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await writeFile(
      path.join(cwd, 'package.json'),
      JSON.stringify({ type: 'module' })
    )

    const filePath = path.join(cwd, 'index.js')

    await writeFile(filePath, 'export default {}')

    expect(await resolvePlugin(cwd, filePath)).toBeNull()
  })
})

test('returns exact object reference when given direct plugin object', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await writeFile(
      path.join(cwd, 'package.json'),
      JSON.stringify({ type: 'module' })
    )

    const filePath = path.join(cwd, 'index.js')

    await writeFile(filePath, `export const plugin = { name: 'plugin' }`)

    const { plugin } = await import(filePath)

    expect(await resolvePlugin(cwd, plugin)).toBe(plugin)
  })
})

test('returns plugin object when default export is a valid plugin object', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await writeFile(
      path.join(cwd, 'package.json'),
      JSON.stringify({ type: 'module' })
    )

    const filePath = path.join(cwd, 'index.js')

    await writeFile(filePath, 'export default { name: "test" }')

    expect(await resolvePlugin(cwd, filePath)).toEqual({ name: 'test' })
  })
})

test('returns factory tuple when default export is a function', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await writeFile(
      path.join(cwd, 'package.json'),
      JSON.stringify({ type: 'module' })
    )

    const filePath = path.join(cwd, 'index.js')

    await writeFile(filePath, 'export default () => ({ name: "test" })')

    expect(await resolvePlugin(cwd, filePath)).toEqual([
      expect.any(Function),
      undefined,
    ])
  })
})

test('returns factory tuple with options when given options tuple with function export', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await writeFile(
      path.join(cwd, 'package.json'),
      JSON.stringify({ type: 'module' })
    )

    const filePath = path.join(cwd, 'index.js')

    await writeFile(filePath, `export default () => ({ name: 'plugin' })`)

    const plugin1 = await resolvePlugin(cwd, [filePath, { debug: true }])
    const plugin2 = await resolvePlugin(cwd, [filePath])

    expect(plugin1).toEqual([expect.any(Function), { debug: true }])
    expect(plugin2).toEqual([expect.any(Function), undefined])
  })
})

test('returns plugin object when given options tuple with plain object export', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await writeFile(
      path.join(cwd, 'package.json'),
      JSON.stringify({ type: 'module' })
    )

    const filePath = path.join(cwd, 'index.js')

    await writeFile(filePath, `export default { name: 'plugin' }`)

    const plugin = await resolvePlugin(cwd, [filePath, { debug: true }])

    expect(plugin).toEqual({ name: 'plugin' })
  })
})
