// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { createProgram, type CreateProgramOptions } from '@reelout/cli'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { context } from '../../../test/mock/context'

const resolveConfig = vi.hoisted(() => vi.fn())
const createContext = vi.hoisted(() => vi.fn())
const executeReleaseWorkflow = vi.hoisted(() => vi.fn())

vi.mock(import('@reelout/config/resolveConfig'), () => ({
  resolveConfig,
}))

vi.mock(import('@reelout/context/createContext'), () => ({
  createContext,
}))

vi.mock(import('@reelout/core/workflow/executeReleaseWorkflow'), () => ({
  executeReleaseWorkflow,
}))

let options: CreateProgramOptions

beforeEach(() => {
  options = {
    name: 'test',
    version: undefined,
    description: undefined,
    cwd: context.cwd,
    env: context.env,
    stdout: context.stdout,
    stderr: context.stderr,
  }
})

afterEach(() => {
  vi.resetAllMocks()
})

test('sets program name when name option is provided', async () => {
  resolveConfig.mockResolvedValue({ plugins: [] })
  const program = await createProgram(options)
  expect(program.name()).toBe('test')
})

test('defaults description to empty string when description option is omitted', async () => {
  resolveConfig.mockResolvedValue({ plugins: [] })
  const program = await createProgram(options)
  expect(program.description()).toBe('')
})

test('sets program description when description option is provided', async () => {
  resolveConfig.mockResolvedValue({ plugins: [] })
  options.description = 'A modern release tool'
  const program = await createProgram(options)
  expect(program.description()).toBe('A modern release tool')
})

test('defaults version to undefined when version option is omitted', async () => {
  resolveConfig.mockResolvedValue({ plugins: [] })
  const program = await createProgram(options)
  expect(program.version()).toBe(undefined)
})

test('sets program version when version option is provided', async () => {
  resolveConfig.mockResolvedValue({ plugins: [] })
  options.version = '1.0.0'
  const program = await createProgram(options)
  expect(program.version()).toBe('1.0.0')
})

test('renders formatted help output when options are configured', async () => {
  resolveConfig.mockResolvedValue({ plugins: [] })

  options.name = 'release'
  options.version = '1.0.0'
  options.description = 'A modern release tool'

  const program = await createProgram(options)

  expect(program.helpInformation()).toMatchInlineSnapshot(`
    "Usage: release [options]

    A modern release tool

    Options:
      --type <string>                  Specify the release type, bypassing automatic
                                       commit analysis. (choices: "auto", "major",
                                       "minor", "patch")
      --qualifier <boolean or string>  Set or override the version qualifier (e.g.,
                                       \`alpha\`, \`beta\`); pass \`false\` to disable.
      --channel <boolean or string>    Set or override the release channel (e.g.,
                                       \`stable\`, \`canary\`); pass \`false\` to disable.
      --allow-empty                    Proceed with the release workflow even if no
                                       qualifying changes are detected.
      --dry-run                        Simulate the release workflow without
                                       modifying files or publishing artifacts.
      --debug                          Enable verbose logging for detailed
                                       troubleshooting. (default: false)
      -v, --version                    Display the version number.
      -h, --help                       Display command usage and options.
    "
  `)
})

test('registers default release options when program is created', async () => {
  resolveConfig.mockResolvedValue({ plugins: [] })

  const program = await createProgram(options)

  expect(
    program.options.map((option) => [
      option.flags,
      option.description,
      option.argChoices,
    ])
  ).toMatchInlineSnapshot(`
    [
      [
        "--type <string>",
        "Specify the release type, bypassing automatic commit analysis.",
        [
          "auto",
          "major",
          "minor",
          "patch",
        ],
      ],
      [
        "--qualifier <boolean or string>",
        "Set or override the version qualifier (e.g., \`alpha\`, \`beta\`); pass \`false\` to disable.",
        undefined,
      ],
      [
        "--channel <boolean or string>",
        "Set or override the release channel (e.g., \`stable\`, \`canary\`); pass \`false\` to disable.",
        undefined,
      ],
      [
        "--allow-empty",
        "Proceed with the release workflow even if no qualifying changes are detected.",
        undefined,
      ],
      [
        "--dry-run",
        "Simulate the release workflow without modifying files or publishing artifacts.",
        undefined,
      ],
      [
        "--debug",
        "Enable verbose logging for detailed troubleshooting.",
        undefined,
      ],
    ]
  `)
})

test('parses target release type when --type flag is provided', async () => {
  resolveConfig.mockResolvedValue({ plugins: [] })

  const program = await createProgram(options)

  await program.parseAsync(['node', 'test'])
  expect(program.opts().type).toBe(undefined)

  await program.parseAsync(['node', 'test', '--type', 'auto'])
  expect(program.opts().type).toBe('auto')

  await program.parseAsync(['node', 'test', '--type', 'major'])
  expect(program.opts().type).toBe('major')

  await program.parseAsync(['node', 'test', '--type', 'minor'])
  expect(program.opts().type).toBe('minor')

  await program.parseAsync(['node', 'test', '--type', 'patch'])
  expect(program.opts().type).toBe('patch')
})

test('parses qualifier as boolean or string value when --qualifier flag is provided', async () => {
  resolveConfig.mockResolvedValue({ plugins: [] })

  const program = await createProgram(options)

  await program.parseAsync(['node', 'test'])
  expect(program.opts().qualifier).toBe(undefined)

  await program.parseAsync(['node', 'test', '--qualifier', 'true'])
  expect(program.opts().qualifier).toBe(true)

  await program.parseAsync(['node', 'test', '--qualifier', 'false'])
  expect(program.opts().qualifier).toBe(false)

  await program.parseAsync(['node', 'test', '--qualifier', 'alpha'])
  expect(program.opts().qualifier).toBe('alpha')

  await program.parseAsync(['node', 'test', '--qualifier', ''])
  expect(program.opts().qualifier).toBe('')
})

test('parses channel as boolean or string value when --channel flag is provided', async () => {
  resolveConfig.mockResolvedValue({ plugins: [] })

  const program = await createProgram(options)

  await program.parseAsync(['node', 'test'])
  expect(program.opts().channel).toBe(undefined)

  await program.parseAsync(['node', 'test', '--channel', 'true'])
  expect(program.opts().channel).toBe(true)

  await program.parseAsync(['node', 'test', '--channel', 'false'])
  expect(program.opts().channel).toBe(false)

  await program.parseAsync(['node', 'test', '--channel', 'next'])
  expect(program.opts().channel).toBe('next')
})

test('enables allowEmpty option when --allow-empty flag is provided', async () => {
  resolveConfig.mockResolvedValue({ plugins: [] })

  const program = await createProgram(options)

  await program.parseAsync(['node', 'test'])
  expect(program.opts().allowEmpty).toBe(undefined)

  await program.parseAsync(['node', 'test', '--allow-empty'])
  expect(program.opts().allowEmpty).toBe(true)
})

test('enables dryRun option when --dry-run flag is provided', async () => {
  resolveConfig.mockResolvedValue({ plugins: [] })

  const program = await createProgram(options)

  await program.parseAsync(['node', 'test'])
  expect(program.opts().dryRun).toBe(undefined)

  await program.parseAsync(['node', 'test', '--dry-run'])
  expect(program.opts().dryRun).toBe(true)
})

test('enables debug option when --debug flag is provided', async () => {
  resolveConfig.mockResolvedValue({ plugins: [] })

  const program = await createProgram(options)

  await program.parseAsync(['node', 'test'])
  expect(program.opts().debug).toBe(false)

  await program.parseAsync(['node', 'test', '--debug'])
  expect(program.opts().debug).toBe(true)
})

test('enables debug option by default when runner debug environment variables are present', async () => {
  resolveConfig.mockResolvedValue({ plugins: [] })

  {
    options.env = {}
    const program = await createProgram(options)
    await program.parseAsync(['node', 'test'])
    expect(program.opts().debug).toBe(false)
  }

  {
    options.env = { RUNNER_DEBUG: '1' }
    const program = await createProgram(options)
    await program.parseAsync(['node', 'test'])
    expect(program.opts().debug).toBe(true)
  }

  {
    options.env = { ACTIONS_STEP_DEBUG: '1' }
    const program = await createProgram(options)
    await program.parseAsync(['node', 'test'])
    expect(program.opts().debug).toBe(true)
  }
})

test('executes release workflow with resolved context and plugins when command action runs', async () => {
  resolveConfig.mockResolvedValue({
    custom: 'config',
    plugins: [{ name: 'mock-plugin' }],
  })

  createContext.mockResolvedValue({
    ctx: 'mock',
  })

  options.env = {
    FOO: 'bar',
  }

  options.stdout = {
    toJSON: () => 'mock-stdout',
  } as object as NodeJS.WriteStream

  options.stderr = {
    toJSON: () => 'mock-stderr',
  } as object as NodeJS.WriteStream

  options.signal = {
    [Symbol.dispose]: vi.fn(),
    toJSON: () => 'mock-signal',
  } as object as AbortSignal

  const program = await createProgram(options)

  await program.parseAsync([
    'node',
    'test',
    '--type=major',
    '--dry-run',
    '--debug',
  ])

  expect(resolveConfig.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "/repo",
        "test",
      ],
    ]
  `)
  expect(createContext.mock.calls).toMatchInlineSnapshot(`
    [
      [
        {
          "custom": "config",
          "cwd": "/repo",
          "debug": true,
          "description": undefined,
          "dryRun": true,
          "env": {
            "FOO": "bar",
          },
          "name": "test",
          "signal": "mock-signal",
          "stderr": "mock-stderr",
          "stdout": "mock-stdout",
          "type": "major",
          "version": undefined,
        },
      ],
    ]
  `)
  expect(executeReleaseWorkflow.mock.calls).toMatchInlineSnapshot(`
    [
      [
        {
          "ctx": "mock",
        },
        [
          {
            "name": "mock-plugin",
          },
        ],
      ],
    ]
  `)
})
