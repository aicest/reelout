// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/env'

import { executeReleaseWorkflow, type ReleasePlan } from '@reelout/core'
import plugin from '@reelout/github'
import { beforeEach, expect, test, vi } from 'vitest'
import { context, logger, repository } from '../../../test/mock/context'

const createRelease = vi.hoisted(() => vi.fn())

const deleteRelease = vi.hoisted(() => vi.fn())

vi.mock(import('@reelout/github/createRelease'), () => ({
  createRelease,
}))

vi.mock(import('@reelout/github/deleteRelease'), () => ({
  deleteRelease,
}))

const plans = [
  {
    package: { entry: false, location: 'b', name: 'b', dependencies: [] },
    release: null,
  },
  {
    package: { entry: true, location: '.', dependencies: ['a', 'b'] },
    release: null,
  },
  {
    package: { entry: false, location: 'a', name: 'a', dependencies: ['b'] },
    release: null,
  },
] as ReleasePlan[]

beforeEach(() => {
  vi.resetAllMocks()
})

test('fails workflow execution when GITHUB_TOKEN environment variable is missing', async () => {
  vi.stubEnv('GITHUB_TOKEN', undefined)

  context.repository = repository

  context.plans = plans

  await expect(
    executeReleaseWorkflow(context, [plugin()])
  ).rejects.toMatchInlineSnapshot(
    `[Error: The GITHUB_TOKEN environment variable is required.]`
  )

  expect(createRelease).not.toHaveBeenCalled()
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [31mFAILURE[39m",
      ],
      [
        "Release complete: [31mThe GITHUB_TOKEN environment variable is required.[39m",
      ],
    ]
  `)
})

test('fails workflow execution when repository context is unavailable', async () => {
  vi.stubEnv('GITHUB_TOKEN', 'token')

  context.repository = null

  context.plans = plans

  await expect(
    executeReleaseWorkflow(context, [plugin()])
  ).rejects.toMatchInlineSnapshot(
    `[Error: A Git repository is required to create a GitHub release.]`
  )

  expect(createRelease).not.toHaveBeenCalled()
  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [31mFAILURE[39m",
      ],
      [
        "Release complete: [31mA Git repository is required to create a GitHub release.[39m",
      ],
    ]
  `)
})

test('skips creating github releases during dry-run mode', async () => {
  context.env = { GITHUB_TOKEN: 'token' }

  context.dryRun = true

  context.repository = repository

  context.plans = plans

  await executeReleaseWorkflow(context, [plugin()])

  expect(createRelease).toHaveBeenCalledTimes(0)
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

test('creates github releases for packages in reverse alphabetical order', async () => {
  context.env = { GITHUB_TOKEN: 'token' }

  context.repository = repository

  context.plans = plans

  await executeReleaseWorkflow(context, [plugin()])

  expect(createRelease).toHaveBeenCalledTimes(3)
  expect(createRelease).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ cwd: '/repo' }),
    expect.objectContaining({
      package: expect.objectContaining({ entry: false, name: 'b' }),
    }),
    'token',
    repository
  )
  expect(createRelease).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ cwd: '/repo' }),
    expect.objectContaining({
      package: expect.objectContaining({ entry: false, name: 'a' }),
    }),
    'token',
    repository
  )
  expect(createRelease).toHaveBeenNthCalledWith(
    3,
    expect.objectContaining({ cwd: '/repo' }),
    expect.objectContaining({
      package: expect.objectContaining({ entry: true }),
    }),
    'token',
    repository
  )
})

test('rolls back published github releases when a subsequent plugin fails', async () => {
  context.env = { GITHUB_TOKEN: 'token' }

  context.repository = repository

  context.plans = plans

  const plugins = [
    plugin(),
    {
      name: 'test',
      version: '1.0.0',
      publish: () => {
        throw new Error('Something went wrong')
      },
    },
  ]

  await expect(executeReleaseWorkflow(context, plugins)).rejects.toThrow(
    'Something went wrong'
  )

  expect(deleteRelease.mock.calls).toMatchInlineSnapshot(`
    [
      [
        {
          "package": {
            "dependencies": [
              "a",
              "b",
            ],
            "entry": true,
            "location": ".",
          },
          "release": null,
        },
        "token",
        {
          "host": "github",
          "owner": "mock-owner",
          "repo": "mock-repo",
          "url": "https://github.com/mock-owner/mock-repo",
        },
      ],
      [
        {
          "package": {
            "dependencies": [
              "b",
            ],
            "entry": false,
            "location": "a",
            "name": "a",
          },
          "release": null,
        },
        "token",
        {
          "host": "github",
          "owner": "mock-owner",
          "repo": "mock-repo",
          "url": "https://github.com/mock-owner/mock-repo",
        },
      ],
      [
        {
          "package": {
            "dependencies": [],
            "entry": false,
            "location": "b",
            "name": "b",
          },
          "release": null,
        },
        "token",
        {
          "host": "github",
          "owner": "mock-owner",
          "repo": "mock-repo",
          "url": "https://github.com/mock-owner/mock-repo",
        },
      ],
    ]
  `)
})
