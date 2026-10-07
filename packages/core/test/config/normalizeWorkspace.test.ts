// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { normalizeWorkspace } from '@reelout/core'
import { expect, test } from 'vitest'
import { context } from '../../../../test/mock/context'

test('normalizes workspace', () => {
  expect(normalizeWorkspace(context.cwd)).toMatchInlineSnapshot(`
    {
      "entry": ".",
      "members": null,
    }
  `)

  expect(normalizeWorkspace(context.cwd, {})).toMatchInlineSnapshot(`
    {
      "entry": ".",
      "members": null,
    }
  `)

  expect(normalizeWorkspace(context.cwd, { entry: '' })).toMatchInlineSnapshot(`
    {
      "entry": ".",
      "members": null,
    }
  `)

  expect(normalizeWorkspace(context.cwd, { entry: './apps/web' }))
    .toMatchInlineSnapshot(`
    {
      "entry": "apps/web",
      "members": null,
    }
  `)

  expect(normalizeWorkspace(context.cwd, { entry: '.', members: [] }))
    .toMatchInlineSnapshot(`
    {
      "entry": ".",
      "members": [],
    }
  `)

  expect(normalizeWorkspace(context.cwd, { members: ['packages/*'] }))
    .toMatchInlineSnapshot(`
    {
      "entry": ".",
      "members": [
        "packages/*",
      ],
    }
  `)

  expect(
    normalizeWorkspace(context.cwd, { entry: 'apps/web', members: ['apps/*'] })
  ).toMatchInlineSnapshot(`
    {
      "entry": "apps/web",
      "members": [
        "apps/*",
      ],
    }
  `)
})
