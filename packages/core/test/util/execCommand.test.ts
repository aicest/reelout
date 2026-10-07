// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execCommand, type ExecCommandOptions } from '@reelout/core'
import { Writable } from 'node:stream'
import { temporaryDirectoryTask } from 'tempy'
import { beforeEach, expect, test } from 'vitest'

let options: ExecCommandOptions

beforeEach(() => {
  options = {
    cwd: '/repo',
    env: undefined,
  }
})

test('returns standard output string when executable finishes successfully', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    expect(await execCommand('git', ['--version'], options)).toMatch(
      /git version \d+\.\d+\.\d+/
    )
    expect(await execCommand('node', ['--version'], options)).toMatch(
      /\d+\.\d+\.\d+/
    )
    expect(await execCommand('npm', ['--version'], options)).toMatch(
      /\d+\.\d+\.\d+/
    )
  })
})

test('attaches child process reference and process id to returned promise object', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    const promise = execCommand('node', ['--version'], options)

    expect(promise.child).toBeDefined()
    expect(promise.child.pid).toBeTypeOf('number')

    await promise
  })
})

test('injects custom environment variables into spawned process environment when provided in options', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    const result = await execCommand(
      'node',
      ['-e', 'console.log(process.env.CUSTOM_VAR)'],
      { ...options, env: { CUSTOM_VAR: 'custom-value' } }
    )

    expect(result).toMatchInlineSnapshot(`
      "custom-value
      "
    `)
  })
})

test('pipes process standard streams to custom writable streams when provided in options', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    const stdout = new Writable({
      write(chunk, encoding, callback) {
        stdoutChunks.push(Buffer.from(chunk))
        callback()
      },
    })

    const stderr = new Writable({
      write(chunk, encoding, callback) {
        stderrChunks.push(Buffer.from(chunk))
        callback()
      },
    })

    const result = await execCommand(
      'node',
      ['-e', 'console.log("hello stdout"); console.error("hello stderr");'],
      { ...options, stdout, stderr }
    )

    expect(result).toBe('')
    expect(Buffer.concat(stdoutChunks).toString('utf-8')).toBe('hello stdout\n')
    expect(Buffer.concat(stderrChunks).toString('utf-8')).toBe('hello stderr\n')
  })
})

test('injects deterministic author and committer dates when executing mutating git commands in test mode', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await execCommand('git', ['init'], options)
    await execCommand('git', ['config', 'user.name', 'Test User'], options)
    await execCommand(
      'git',
      ['config', 'user.email', 'test@example.com'],
      options
    )

    const stdout = await execCommand(
      'git',
      ['commit', '--allow-empty', '-m', 'Initial commit'],
      options
    )

    expect(stdout).toMatchInlineSnapshot(`
      "[master (root-commit) f168a6b] Initial commit
      "
    `)
  })
})

test('rejects with AbortError when abort signal triggers during execution', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    options = {
      ...options,
      signal: AbortSignal.abort(),
    }

    await expect(
      execCommand('node', ['-e', 'setTimeout(() => {}, 10000)'], options)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[AbortError: The operation was aborted]`
    )
  })
})

test('rejects with error when custom writable stream emits an error event during execution', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    const stdout = new Writable({
      write(chunk, encoding, callback) {
        callback(new Error('custom stdout stream error'))
      },
    })

    const stderr = new Writable({
      write(chunk, encoding, callback) {
        callback(new Error('custom stderr stream error'))
      },
    })

    await expect(
      execCommand('node', ['-e', 'console.log("data")'], {
        ...options,
        stdout,
      })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: custom stdout stream error]`
    )

    await expect(
      execCommand('node', ['-e', 'console.error("error")'], {
        ...options,
        stderr,
      })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: custom stderr stream error]`
    )
  })
})

test('rejects with error when error and close events fire concurrently on child process', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    const promise = execCommand(
      'node',
      ['-e', 'setTimeout(() => {}, 500)'],
      options
    )

    promise.child.emit('error', new Error('forced concurrent error'))

    await expect(promise).rejects.toMatchInlineSnapshot(
      `[Error: forced concurrent error]`
    )
  })
})

test('rejects with detailed diagnostic output and exit code when command execution fails', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await expect(execCommand('invalid', ['--help'], options)).rejects.toThrow(
      'spawn invalid ENOENT'
    )

    await expect(execCommand('git', ['commit'], options)).rejects
      .toMatchInlineSnapshot(`
      [Error: Command 'git commit' failed (exit code 128)
      fatal: not a git repository (or any of the parent directories): .git]
    `)

    await execCommand('git', ['init'], options)
    await execCommand('git', ['config', 'user.name', 'Test User'], options)
    await execCommand(
      'git',
      ['config', 'user.email', 'test@example.com'],
      options
    )

    await expect(execCommand('git', ['rev-parse', 'HEAD'], options)).rejects
      .toMatchInlineSnapshot(`
      [Error: Command 'git rev-parse HEAD' failed (exit code 128)
      fatal: ambiguous argument 'HEAD': unknown revision or path not in the working tree.
      Use '--' to separate paths from revisions, like this:
      'git <command> [<revision>...] -- [<file>...]']
    `)

    await expect(
      execCommand('git', ['symbolic-ref', '-q', '--short', 'v1.0.0'], options)
    ).rejects.toMatchInlineSnapshot(
      `[Error: Command 'git symbolic-ref -q --short v1.0.0' failed (exit code 1)]`
    )
  })
})

test('falls back to standard output in error message diagnostics when standard error stream is empty on failure', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await expect(
      execCommand(
        'node',
        ['-e', 'console.log("stdout error message"); process.exit(42);'],
        options
      )
    ).rejects.toMatchInlineSnapshot(`
      [Error: Command 'node -e console.log("stdout error message"); process.exit(42);' failed (exit code 42)
      stdout error message]
    `)
  })
})

test('quotes and escapes command arguments with mixed quote types correctly in error messages', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    options.cwd = cwd

    await expect(
      execCommand('node', ['-e', 'process.exit(1)', "'single-quoted'"], options)
    ).rejects.toMatchInlineSnapshot(
      `[Error: Command "node -e process.exit(1) 'single-quoted'" failed (exit code 1)]`
    )

    await expect(
      execCommand('node', ['-e', 'process.exit(1)', '"double-quoted"'], options)
    ).rejects.toMatchInlineSnapshot(
      `[Error: Command 'node -e process.exit(1) "double-quoted"' failed (exit code 1)]`
    )

    await expect(
      execCommand('node', ['-e', 'process.exit(1)', `'"mixed"'`], options)
    ).rejects.toMatchInlineSnapshot(
      `[Error: Command "node -e process.exit(1) '\\"mixed\\"'" failed (exit code 1)]`
    )
  })
})
