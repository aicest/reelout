// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { formatFile } from '@reelout/core'
import fs from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'

test('formats with default parser', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await fs.writeFile(
      path.join(cwd, '.prettierrc.json'),
      JSON.stringify({ parser: undefined })
    )

    const filePath = path.join(cwd, 'file.json')
    const content = await formatFile(filePath, `{'foo':'bar'}`)

    expect(content).toBe(`{ "foo": "bar" }\n`)
  })
})

test('formats with custom parser', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await fs.writeFile(
      path.join(cwd, '.prettierrc.json'),
      JSON.stringify({ parser: 'json5' })
    )

    const filePath = path.join(cwd, 'file.json')
    const content = await formatFile(filePath, `{'foo':'bar'}`)

    expect(content).toBe(`{ foo: "bar" }\n`)
  })
})

test('formats with unknown parser', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await fs.writeFile(
      path.join(cwd, '.prettierrc.json'),
      JSON.stringify({ parser: 'unknown' })
    )

    const filePath = path.join(cwd, 'file.json')
    const content = await formatFile(filePath, `{'foo':'bar'}`)

    expect(content).toBe(`{'foo':'bar'}`)
  })
})

test('throws when parser cannot be inferred', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await fs.writeFile(
      path.join(cwd, '.prettierrc.json'),
      JSON.stringify({ parser: undefined })
    )

    const filePath = path.join(cwd, 'file')
    const content = await formatFile(filePath, `{'foo':'bar'}`)

    expect(content).toBe(`{'foo':'bar'}`)
  })
})
