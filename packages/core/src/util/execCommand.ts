// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { spawn, type ChildProcessByStdio } from 'node:child_process'
import type { Stream } from 'node:stream'

export interface PromiseWithChild<T> extends Promise<T> {
  child: ChildProcessByStdio<null, Stream.Readable, Stream.Readable>
}

const MUTATING_GIT_COMMANDS = new Set([
  'commit',
  'tag',
  'cherry-pick',
  'rebase',
  'merge',
  'revert',
  'commit-tree',
  'mktag',
])

let deterministicCounter = 0

export interface ExecCommandOptions {
  cwd: string
  env?: Readonly<NodeJS.ProcessEnv> | undefined
  signal?: AbortSignal | undefined
  stdout?: NodeJS.WritableStream | undefined
  stderr?: NodeJS.WritableStream | undefined
}

/**
 * Execute a system command with arguments as a child process.
 *
 * Spawns the target process, collects output streams, and intercepts mutating
 * `git` operations in test mode to inject deterministic commit timestamps.
 *
 * @param command Executable command name or path to spawn
 * @param args Array of string arguments passed to the command
 * @param options Execution environment, streaming, and signal options
 * @returns Promise attached to the child process resolving to standard output
 * @throws If process execution fails or exits with a non-zero status
 */
export function execCommand(
  command: string,
  args: readonly string[],
  options: ExecCommandOptions
): PromiseWithChild<string> {
  const { cwd, signal } = options

  const env: NodeJS.ProcessEnv = {
    HOME: process.env.HOME,
    PATH: process.env.PATH,
    ...options.env,
  }

  if (import.meta.env.MODE === 'test' && command === 'git') {
    const primaryArg = args.find((arg) => MUTATING_GIT_COMMANDS.has(arg))

    if (primaryArg) {
      const base = Date.parse('2026-01-01T00:00:00Z')
      const date = new Date(base + deterministicCounter * 1000).toISOString()
      deterministicCounter += 1
      env.GIT_AUTHOR_DATE = date
      env.GIT_COMMITTER_DATE = date
    }
  }

  const child = spawn(command, args, {
    cwd,
    env,
    signal,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const promise = new Promise<string>((resolve, reject) => {
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let settled = false

    function safeResolve(value: string) {
      /* istanbul ignore next */
      if (settled) return
      settled = true
      cleanup()
      resolve(value)
    }

    function safeReject(err: Error) {
      /* istanbul ignore next */
      if (settled) return
      settled = true
      cleanup()
      reject(err)
    }

    function cleanup() {
      child.off('error', onError)
      child.off('close', onClose)

      child.stdout.removeAllListeners('data')
      child.stderr.removeAllListeners('data')

      if (options.stdout) {
        child.stdout.unpipe(options.stdout)
        options.stdout.off('error', onError)
      }

      if (options.stderr) {
        child.stderr.unpipe(options.stderr)
        options.stderr.off('error', onError)
      }
    }

    function onError(err: Error) {
      safeReject(err)
    }

    function onClose(code: number | null, signal: NodeJS.Signals | null) {
      /* istanbul ignore next */
      if (settled) return

      if (code === 0) {
        return safeResolve(bufferArrayToString(stdout))
      }

      const quotedCommand = quoteCommandForMessage([command, ...args].join(' '))

      /* istanbul ignore next */
      const exitStatus =
        code !== null
          ? `exit code ${code}`
          : signal
            ? `signal ${signal}`
            : 'unknown status'

      const errorDiagnostics =
        bufferArrayToString(stderr).trim() || bufferArrayToString(stdout).trim()

      const errorMessage = [
        `Command ${quotedCommand} failed (${exitStatus})`,
        errorDiagnostics,
      ]
        .filter(Boolean)
        .join('\n')

      const err = new Error(errorMessage, {
        cause: { code, signal, diagnostics: errorDiagnostics },
      })

      /* istanbul ignore else */
      if (code != null) {
        Object.defineProperty(err, 'code', { value: code })
      }

      safeReject(err)
    }

    child.on('error', onError)
    child.on('close', onClose)

    if (options.stdout) {
      options.stdout.on('error', onError)
      child.stdout.pipe(options.stdout)
    } else {
      child.stdout.on('data', (chunk) => stdout.push(chunk))
    }

    if (options.stderr) {
      options.stderr.on('error', onError)
      child.stderr.pipe(options.stderr)
    } else {
      child.stderr.on('data', (chunk) => stderr.push(chunk))
    }
  }) as PromiseWithChild<string>

  promise.child = child

  return promise
}

function bufferArrayToString(chunks: Buffer[]): string {
  return Buffer.concat(chunks).toString('utf-8')
}

function quoteCommandForMessage(command: string): string {
  if (!command.includes("'")) {
    return `'${command}'`
  }

  if (!command.includes('"')) {
    return `"${command}"`
  }

  return JSON.stringify(command)
}
