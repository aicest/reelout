// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { defaultConfig, resolveConfig } from '@reelout/config'
import { createContext, type CreateContextOptions } from '@reelout/context'
import {
  compact,
  execCommand,
  execGit,
  normalizeReleaseRule,
  type ResolvedReleaseConfig,
} from '@reelout/core'
import { writePackageJson } from '@reelout/npm'
import { Consola, createConsola, LogLevels } from 'consola/core'
import { Writable } from 'node:stream'
import { temporaryDirectoryTask } from 'tempy'
import { beforeAll, beforeEach, expect, test, vi } from 'vitest'
import { initializeGitRepository } from '../../../test/mock/git'

let config: ResolvedReleaseConfig

let options: CreateContextOptions

beforeAll(async () => {
  vi.useFakeTimers({
    now: new Date('2026-01-01T12:34:56Z'),
  })

  await temporaryDirectoryTask(
    async (cwd) => (config = await resolveConfig(cwd))
  )
})

beforeEach(() => {
  vi.resetAllMocks()

  options = {
    ...config,
    cwd: '/repo',
    env: {},
    logger: undefined,
    stdout: process.stdout,
    stderr: process.stderr,
  }
})

test('throws error when repository contains no commits', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await initializeGitRepository(cwd)

    await expect(createContext(options)).rejects.toMatchInlineSnapshot(
      `[Error: Initialize a Git repository with at least one commit before running this command.]`
    )

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    const context = await createContext(options)

    expect({
      repository: context.repository,
      ref: context.ref,
      commit: context.commit,
    }).toMatchInlineSnapshot(`
      {
        "commit": {
          "authorDate": "2026-01-01T00:00:00.000Z",
          "body": null,
          "committerDate": "2026-01-01T00:00:00.000Z",
          "files": [],
          "footer": null,
          "hash": "f168a6b79de374e3a0b8b418fd1d9cbafad0a163",
          "header": "Initial commit",
          "mentions": [],
          "merge": null,
          "notes": [],
          "parent": [],
          "references": [],
          "revert": null,
          "scope": null,
          "subject": null,
          "trailers": [],
          "type": null,
        },
        "ref": {
          "name": "main",
          "type": "branch",
        },
        "repository": null,
      }
    `)
  })
})

test('throws error when checked out on a detached HEAD or tag instead of a branch', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    await execGit(cwd, ['tag', 'v1.0.0', '-a', '-m', 'Annotated tag'])

    await execGit(cwd, [
      'checkout',
      (await execGit(cwd, ['rev-parse', 'HEAD'])).trim(),
    ])

    await expect(createContext(options)).rejects.toMatchInlineSnapshot(
      `[Error: Check out a Git branch in your repository before proceeding.]`
    )

    await execGit(cwd, ['checkout', 'main'])

    expect(await createContext(options)).toMatchObject({
      ref: { type: 'branch', name: 'main' },
      versionQualifier: undefined,
      releaseChannel: undefined,
    })

    await execGit(cwd, ['branch', '-m', 'alpha'])

    expect(await createContext(options)).toMatchObject({
      ref: { type: 'branch', name: 'alpha' },
      versionQualifier: 'alpha',
      releaseChannel: 'alpha',
    })

    await execGit(cwd, ['checkout', 'v1.0.0'])

    await expect(createContext(options)).rejects.toMatchInlineSnapshot(
      `[Error: Check out a Git branch in your repository before proceeding.]`
    )
  })
})

test('populates context with default configuration, plugins, and metadata upon successful initialization', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await initializeGitRepository(cwd)

    await writePackageJson(cwd, {})
    await execCommand('corepack', ['use', 'pnpm@10.30.1'], options)
    await execCommand('pnpm', ['add', process.cwd()], options)
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: init'])

    const context = await createContext(options)

    expect(context).toEqual({
      cwd,
      env: {},
      today: '2026-01-01',
      signal: undefined,
      stdout: expect.any(Writable),
      stderr: expect.any(Writable),
      logger: expect.any(Consola),
      repository: null,
      ref: { type: 'branch', name: 'main' },
      commit: expect.objectContaining({
        hash: expect.stringMatching(/^[0-9a-f]{40}$/),
      }),
      author: defaultConfig.author,
      classifier: expect.any(Function),
      rules: [
        {
          type: 'branch',
          pattern: 'alpha',
          versionQualifier: 'alpha',
          releaseChannel: 'alpha',
        },
        {
          type: 'branch',
          pattern: 'beta',
          versionQualifier: 'beta',
          releaseChannel: 'beta',
        },
        {
          type: 'branch',
          pattern: 'next',
          versionQualifier: 'next',
          releaseChannel: 'next',
        },
      ],
      type: 'auto',
      versionQualifier: undefined,
      releaseChannel: undefined,
      allowEmpty: false,
      dryRun: false,
      packages: [],
      plans: [],
      status: null,
      phase: null,
      error: null,
    })
  })
}, 15_000)

test('uses custom logger instance when provided in options', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    const logger = createConsola({ mockFn: vi.fn() })

    const context = await createContext({ ...options, logger })

    expect(context).toMatchObject({
      logger,
    })
  })
})

test('uses custom stdout and stderr streams when provided in options', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    const stdout = new Writable({
      write(chunk, encoding, callback) {
        callback()
      },
    })
    const stderr = new Writable({
      write(chunk, encoding, callback) {
        callback()
      },
    })

    const context = await createContext({ ...options, stdout, stderr })

    expect(context).toMatchObject({
      stdout,
      stderr,
    })
  })
})

test('sets dryRun to true when dryRun option is enabled', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    const context = await createContext({ ...options, dryRun: true })

    expect(context.dryRun).toBe(true)
  })
})

test('enables verbose logging level when debug option is enabled', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    const context = await createContext({ ...options, debug: true })

    expect(context.logger.level).toBe(LogLevels.verbose)
  })
})

test('interpolates date and time tokens into prerelease label and channel when rules match', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await initializeGitRepository(cwd, undefined, 'dev')

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    options = {
      ...options,
      rules: compact([
        normalizeReleaseRule({
          pattern: 'dev',
          qualifier: 'dev.{date}{time}',
          channel: 'dev.{date}{time}',
        }),
      ]),
    }

    const context = await createContext(options)

    expect(context.today).toBe('2026-01-01')
    expect(context.versionQualifier).toBe('dev.20260101123456')
    expect(context.releaseChannel).toBe('dev.20260101123456')
  })
})

test('overrides matched release rules with custom option values when provided', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await initializeGitRepository(cwd, undefined, 'alpha')

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    options = {
      ...options,
      rules: compact([
        normalizeReleaseRule({
          pattern: 'alpha',
          qualifier: true,
          channel: true,
        }),
        normalizeReleaseRule({
          pattern: 'beta',
          qualifier: true,
          channel: true,
        }),
      ]),
    }

    let context = await createContext(options)

    expect(context.versionQualifier).toBe('alpha')
    expect(context.releaseChannel).toBe('alpha')

    context = await createContext({
      ...options,
      qualifier: 'custom-pre',
      channel: 'custom-chan',
    })

    expect(context.versionQualifier).toBe('custom-pre')
    expect(context.releaseChannel).toBe('custom-chan')

    context = await createContext({
      ...options,
      qualifier: false,
      channel: false,
    })

    expect(context.versionQualifier).toBeUndefined()
    expect(context.releaseChannel).toBeUndefined()

    context = await createContext({
      ...options,
      qualifier: true,
      channel: true,
    })

    expect(context.versionQualifier).toBe('alpha')
    expect(context.releaseChannel).toBe('alpha')
  })
})
