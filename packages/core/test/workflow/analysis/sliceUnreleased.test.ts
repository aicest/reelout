// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  execGit,
  sliceUnreleased,
  type SliceUnreleasedOptions,
} from '@reelout/core'
import { updatePackageJson, writePackageJson } from '@reelout/npm'
import { fromAsync } from 'from-async'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { initializeGitRepository } from '../../../../../test/mock/git'

async function showCommits(
  cwd: string,
  options?: SliceUnreleasedOptions
): Promise<string[]> {
  return (await fromAsync(sliceUnreleased(cwd, options)))
    .toReversed()
    .map((commit) => commit.header)
}

test('yields all commits when repository contains no release markers', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '0.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'feat: initialize root workspace metadata [a81b-99]',
    ])

    await writeFile(path.join(cwd, 'index.js'), 'console.log("hello")')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'fix: resolve module resolution entrypoint [c34f-12]',
    ])

    expect(await showCommits(cwd)).toMatchInlineSnapshot(`
      [
        "feat: initialize root workspace metadata [a81b-99]",
        "fix: resolve module resolution entrypoint [c34f-12]",
      ]
    `)
  })
})

test('halts iteration upon encountering a release commit or tag boundary', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { workspaces: ['packages/*'] })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'chore: set up monorepo workspace structure [k89z-01]',
    ])

    const pkg1Dir = path.join(cwd, 'packages/foo')
    const pkg2Dir = path.join(cwd, 'packages/bar')

    await writePackageJson(pkg1Dir, { name: 'foo', version: '0.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'style: align formatting across foo package [m77a-11]',
    ])

    await writeFile(path.join(pkg1Dir, 'index.js'), 'export const foo = 1;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'refactor: simplify export declarations [x43d-22]',
    ])

    expect(await showCommits(cwd)).toMatchInlineSnapshot(`
      [
        "chore: set up monorepo workspace structure [k89z-01]",
        "style: align formatting across foo package [m77a-11]",
        "refactor: simplify export declarations [x43d-22]",
      ]
    `)

    await updatePackageJson(pkg1Dir, { version: '0.0.1' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'chore(release): publish foo@0.0.1 [v91c-33]',
    ])
    await execGit(cwd, ['tag', 'foo@0.0.1'])

    expect(await showCommits(cwd)).toEqual([])

    await writePackageJson(pkg2Dir, { name: 'bar', version: '0.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'test: add integration test cases for bar package [t55q-44]',
    ])

    await writeFile(path.join(pkg2Dir, 'index.js'), 'export const bar = 1;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'docs: update package API usage guides [d20e-55]',
    ])

    await writeFile(path.join(pkg2Dir, 'index.js'), 'export const bar = 2;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'perf: optimize internal state evaluation [p88s-66]',
    ])

    await execGit(cwd, [
      'commit',
      '--allow-empty',
      '-m',
      'build: update build target ECMAScript version [b31m-77]',
    ])

    await execGit(cwd, [
      'commit',
      '--allow-empty',
      '--allow-empty-message',
      '-m',
      '',
    ])

    await writeFile(path.join(pkg1Dir, 'index.js'), 'export const foo = 2;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'ci: upgrade GitHub Actions runner workflow [c14r-88]',
    ])

    expect(await showCommits(cwd)).toMatchInlineSnapshot(`
      [
        "test: add integration test cases for bar package [t55q-44]",
        "docs: update package API usage guides [d20e-55]",
        "perf: optimize internal state evaluation [p88s-66]",
        "build: update build target ECMAScript version [b31m-77]",
        "ci: upgrade GitHub Actions runner workflow [c14r-88]",
      ]
    `)
  })
})

test('respects custom release marker option instead of falling back to default', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writeFile(path.join(cwd, 'a.txt'), 'a')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'chore: create initial configuration file [q101-aa]\n\nSigned-off-by: Dev <dev@example.com>',
    ])

    await writeFile(path.join(cwd, 'b.txt'), 'b')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'feat: add custom marker parser strategy [r202-bb]\n\nRelease-As: v1.0.0',
    ])

    await writeFile(path.join(cwd, 'c.txt'), 'c')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'fix: patch edge case in empty options handling [s303-cc]\n\nReviewed-by: Lead <lead@example.com>',
    ])

    const unreleasedWithCustomMarker = await showCommits(cwd, {
      marker: 'Release-As',
    })

    expect(unreleasedWithCustomMarker).toMatchInlineSnapshot(`
      [
        "fix: patch edge case in empty options handling [s303-cc]",
      ]
    `)
  })
})
