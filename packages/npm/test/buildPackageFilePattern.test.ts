// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { Package, Workspace } from '@reelout/core'
import { buildPackageFilePattern } from '@reelout/npm'
import path from 'node:path'
import { beforeEach, expect, test } from 'vitest'

let workspace: Workspace

beforeEach(() => {
  workspace = { entry: '.', members: null }
})

test('returns default pattern for root', () => {
  const info = { location: '.', root: true } as Package
  const files = buildPackageFilePattern(workspace, info.root, info.location)

  expect(files).toBe('**/*')
})

test('returns workspace pattern when configured', () => {
  workspace.entry = '.'
  workspace.members = ['packages/*', 'docs']

  const info = { location: '.', root: true } as Package
  const files = buildPackageFilePattern(workspace, info.root, info.location)

  expect(files).toBe(
    `!{package-lock.json,npm-shrinkwrap.json,pnpm-lock.yaml,yarn.lock,packages/*/**/*,docs/**/*}`
  )
})

test('returns package-specific pattern', () => {
  workspace.entry = '.'
  workspace.members = ['packages/*']

  const dir = path.join('packages', 'foo')
  const info = { location: dir, root: false } as Package
  const files = buildPackageFilePattern(workspace, info.root, info.location)

  expect(files).toBe('packages/foo/**/*')
})
