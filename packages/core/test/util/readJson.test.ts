// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../../test/mock/fs'

import { readJson } from '@reelout/core'
import { vol } from 'memfs'
import { expect, test } from 'vitest'

test('reads and parses JSON file', async () => {
  vol.fromJSON({
    '/repo/a/b/c.json': JSON.stringify({ a: 1, b: 'x' }),
  })

  expect(await readJson<{ a: number; b: string }>('/repo/a/b/c.json')).toEqual({
    a: 1,
    b: 'x',
  })
})

test('throws when JSON file cannot be read', async () => {
  vol.fromJSON({
    '/repo/a/b/c.json': null,
  })

  await expect(readJson('/repo/a/b/c.json')).rejects.toMatchInlineSnapshot(
    `[Error: JSON file at "[1m/repo/a/b/c.json[22m" could not be read.]`
  )
})

test('throws when the file contains invalid JSON', async () => {
  vol.fromJSON({
    '/repo/a/b/c.json': 'not a json',
  })

  await expect(readJson('/repo/a/b/c.json')).rejects.toMatchInlineSnapshot(
    `[Error: JSON file at "[1m/repo/a/b/c.json[22m" could not be parsed.]`
  )
})

test('throws when JSON content is null', async () => {
  vol.fromJSON({
    '/repo/a/b/c.json': 'null',
  })

  await expect(readJson('/repo/a/b/c.json')).rejects.toMatchInlineSnapshot(
    `[Error: JSON file at "[1m/repo/a/b/c.json[22m" does not contain a valid object.]`
  )
})
