// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  execGit,
  getParsedGitCommit,
  parseGitCommit,
  pushGitChanges,
  restoreFullGitHistory,
} from '@reelout/core'
import { updatePackageJson, writePackageJson } from '@reelout/npm'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { afterEach, beforeAll, expect, test, vi } from 'vitest'
import {
  cloneGitRepository,
  initializeGitRepository,
} from '../../../../../test/mock/git'

vi.mock(
  import('@reelout/core/git/commit/parseGitCommit'),
  async (importActual) => ({
    parseGitCommit: vi.fn((await importActual()).parseGitCommit),
  })
)

beforeAll(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runAllTimers()
  vi.resetAllMocks()
})

test('parses commit details when reference is valid and throws error when ref is invalid', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    await execGit(cwd, [
      'commit',
      '--allow-empty',
      '--allow-empty-message',
      '-m',
      '',
    ])

    await writePackageJson(cwd, { name: 'foo', version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: add package.json'])
    await execGit(cwd, ['tag', 'v1.0.0'])

    await writeFile(path.join(cwd, 'index.js'), 'export const foo = 42;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'feat: add index.js',
      '-m',
      'Detailed description of the change',
    ])

    await writeFile(path.join(cwd, 'index.js'), 'export {};')
    await updatePackageJson(cwd, { version: '2.0.0' })
    await writeFile(path.join(cwd, 'README.md'), '# Hello World')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'feat: add breaking change',
      '-m',
      'BREAKING CHANGE: Removed support for Node.js 20 and earlier',
    ])
    await execGit(cwd, ['tag', 'v2.0.0', '-a', '-m', 'v2.0.0'])

    await expect(getParsedGitCommit(cwd, 'HEAD~99')).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      [Error: Command 'git log -1 HEAD~99 --name-only --pretty=format:%H%P%aI%cI%s%b' failed (exit code 128)
      fatal: ambiguous argument 'HEAD~99': unknown revision or path not in the working tree.
      Use '--' to separate paths from revisions, like this:
      'git <command> [<revision>...] -- [<file>...]']
    `)

    expect(await getParsedGitCommit(cwd, 'HEAD~4')).toMatchInlineSnapshot(`
      {
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
      }
    `)

    await expect(
      getParsedGitCommit(cwd, 'HEAD~3')
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[TypeError: Expected a raw commit]`
    )

    expect(await getParsedGitCommit(cwd, 'HEAD~2')).toMatchInlineSnapshot(`
      {
        "authorDate": "2026-01-01T00:00:02.000Z",
        "body": null,
        "committerDate": "2026-01-01T00:00:02.000Z",
        "files": [
          "package.json",
        ],
        "footer": null,
        "hash": "c13d02e067172f5e8afbe2f11899ae14da640ab2",
        "header": "chore: add package.json",
        "mentions": [],
        "merge": null,
        "notes": [],
        "parent": [
          "6fed5a6e79091bc791bea2627ad487f5517f1525",
        ],
        "references": [],
        "revert": null,
        "scope": null,
        "subject": "add package.json",
        "trailers": [],
        "type": "chore",
      }
    `)

    expect(await getParsedGitCommit(cwd, 'HEAD^')).toMatchInlineSnapshot(`
      {
        "authorDate": "2026-01-01T00:00:04.000Z",
        "body": "Detailed description of the change",
        "committerDate": "2026-01-01T00:00:04.000Z",
        "files": [
          "index.js",
        ],
        "footer": null,
        "hash": "1d0899401c85268c2f7e9ddabd6d97fe38fca957",
        "header": "feat: add index.js",
        "mentions": [],
        "merge": null,
        "notes": [],
        "parent": [
          "c13d02e067172f5e8afbe2f11899ae14da640ab2",
        ],
        "references": [],
        "revert": null,
        "scope": null,
        "subject": "add index.js",
        "trailers": [],
        "type": "feat",
      }
    `)

    expect(await getParsedGitCommit(cwd, 'HEAD')).toMatchInlineSnapshot(`
      {
        "authorDate": "2026-01-01T00:00:05.000Z",
        "body": "",
        "committerDate": "2026-01-01T00:00:05.000Z",
        "files": [
          "README.md",
          "index.js",
          "package.json",
        ],
        "footer": "BREAKING CHANGE: Removed support for Node.js 20 and earlier",
        "hash": "ed029d69935f187c2bf5a34a0890a3b3864e4a86",
        "header": "feat: add breaking change",
        "mentions": [],
        "merge": null,
        "notes": [
          {
            "text": "Removed support for Node.js 20 and earlier",
            "title": "BREAKING CHANGE",
          },
        ],
        "parent": [
          "1d0899401c85268c2f7e9ddabd6d97fe38fca957",
        ],
        "references": [],
        "revert": null,
        "scope": null,
        "subject": "add breaking change",
        "trailers": [
          {
            "key": "BREAKING CHANGE",
            "value": "Removed support for Node.js 20 and earlier",
          },
        ],
        "type": "feat",
      }
    `)

    expect(await getParsedGitCommit(cwd, 'v1.0.0')).toMatchInlineSnapshot(`
      {
        "authorDate": "2026-01-01T00:00:02.000Z",
        "body": null,
        "committerDate": "2026-01-01T00:00:02.000Z",
        "files": [
          "package.json",
        ],
        "footer": null,
        "hash": "c13d02e067172f5e8afbe2f11899ae14da640ab2",
        "header": "chore: add package.json",
        "mentions": [],
        "merge": null,
        "notes": [],
        "parent": [
          "6fed5a6e79091bc791bea2627ad487f5517f1525",
        ],
        "references": [],
        "revert": null,
        "scope": null,
        "subject": "add package.json",
        "trailers": [],
        "type": "chore",
      }
    `)

    expect(await getParsedGitCommit(cwd, 'v2.0.0')).toMatchInlineSnapshot(`
      {
        "authorDate": "2026-01-01T00:00:05.000Z",
        "body": "",
        "committerDate": "2026-01-01T00:00:05.000Z",
        "files": [
          "README.md",
          "index.js",
          "package.json",
        ],
        "footer": "BREAKING CHANGE: Removed support for Node.js 20 and earlier",
        "hash": "ed029d69935f187c2bf5a34a0890a3b3864e4a86",
        "header": "feat: add breaking change",
        "mentions": [],
        "merge": null,
        "notes": [
          {
            "text": "Removed support for Node.js 20 and earlier",
            "title": "BREAKING CHANGE",
          },
        ],
        "parent": [
          "1d0899401c85268c2f7e9ddabd6d97fe38fca957",
        ],
        "references": [],
        "revert": null,
        "scope": null,
        "subject": "add breaking change",
        "trailers": [
          {
            "key": "BREAKING CHANGE",
            "value": "Removed support for Node.js 20 and earlier",
          },
        ],
        "type": "feat",
      }
    `)

    expect(await getParsedGitCommit(cwd, 'refs/tags/v1.0.0'))
      .toMatchInlineSnapshot(`
      {
        "authorDate": "2026-01-01T00:00:02.000Z",
        "body": null,
        "committerDate": "2026-01-01T00:00:02.000Z",
        "files": [
          "package.json",
        ],
        "footer": null,
        "hash": "c13d02e067172f5e8afbe2f11899ae14da640ab2",
        "header": "chore: add package.json",
        "mentions": [],
        "merge": null,
        "notes": [],
        "parent": [
          "6fed5a6e79091bc791bea2627ad487f5517f1525",
        ],
        "references": [],
        "revert": null,
        "scope": null,
        "subject": "add package.json",
        "trailers": [],
        "type": "chore",
      }
    `)

    expect(await getParsedGitCommit(cwd, 'refs/tags/v2.0.0'))
      .toMatchInlineSnapshot(`
      {
        "authorDate": "2026-01-01T00:00:05.000Z",
        "body": "",
        "committerDate": "2026-01-01T00:00:05.000Z",
        "files": [
          "README.md",
          "index.js",
          "package.json",
        ],
        "footer": "BREAKING CHANGE: Removed support for Node.js 20 and earlier",
        "hash": "ed029d69935f187c2bf5a34a0890a3b3864e4a86",
        "header": "feat: add breaking change",
        "mentions": [],
        "merge": null,
        "notes": [
          {
            "text": "Removed support for Node.js 20 and earlier",
            "title": "BREAKING CHANGE",
          },
        ],
        "parent": [
          "1d0899401c85268c2f7e9ddabd6d97fe38fca957",
        ],
        "references": [],
        "revert": null,
        "scope": null,
        "subject": "add breaking change",
        "trailers": [
          {
            "key": "BREAKING CHANGE",
            "value": "Removed support for Node.js 20 and earlier",
          },
        ],
        "type": "feat",
      }
    `)
  })
})

test('returns cached commit reference on repeated calls without re-parsing', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { name: 'foo', version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'chore: add package.json'])
    await execGit(cwd, ['tag', 'v1.0.0'])

    await writeFile(path.join(cwd, 'index.js'), 'export const foo = 42;')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, [
      'commit',
      '-m',
      'feat: add index.js',
      '-m',
      'Detailed description of the change',
    ])

    const commit = await getParsedGitCommit(cwd, 'HEAD')

    expect(await getParsedGitCommit(cwd, 'HEAD')).toBe(commit)
    expect(await getParsedGitCommit(cwd, 'HEAD')).toBe(commit)
    expect(await getParsedGitCommit(cwd, 'HEAD')).toBe(commit)
    expect(parseGitCommit).toHaveBeenCalledTimes(1)
    expect(commit).toMatchInlineSnapshot(`
      {
        "authorDate": "2026-01-01T00:00:09.000Z",
        "body": "Detailed description of the change",
        "committerDate": "2026-01-01T00:00:09.000Z",
        "files": [
          "index.js",
        ],
        "footer": null,
        "hash": "d12fad5eda7bab66e03db2c5722d25386b045ea9",
        "header": "feat: add index.js",
        "mentions": [],
        "merge": null,
        "notes": [],
        "parent": [
          "965d7ce9547dffb1cc1de0c75424ed93d4b4e139",
        ],
        "references": [],
        "revert": null,
        "scope": null,
        "subject": "add index.js",
        "trailers": [],
        "type": "feat",
      }
    `)
  })
})

test('re-parses commit after restoring full history in shallow repository clone', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await writePackageJson(cwd, { name: 'foo', version: '1.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: add package.json'])
      await execGit(cwd, ['tag', 'v1.0.0'])

      await writeFile(path.join(cwd, 'index.js'), 'export const foo = 42;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'feat: add index.js',
        '-m',
        'Detailed description of the change',
      ])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      let commit = await getParsedGitCommit(cwd, 'HEAD')

      expect(await getParsedGitCommit(cwd, 'HEAD')).toBe(commit)
      expect(await getParsedGitCommit(cwd, 'HEAD')).toBe(commit)
      expect(parseGitCommit).toHaveBeenCalledTimes(1)
      expect(commit).toMatchInlineSnapshot(`
        {
          "authorDate": "2026-01-01T00:00:12.000Z",
          "body": "Detailed description of the change",
          "committerDate": "2026-01-01T00:00:12.000Z",
          "files": [
            "index.js",
            "package.json",
          ],
          "footer": null,
          "hash": "ddb51dfce787366ce1d515bd0fdeffaa7c34a2f4",
          "header": "feat: add index.js",
          "mentions": [],
          "merge": null,
          "notes": [],
          "parent": [],
          "references": [],
          "revert": null,
          "scope": null,
          "subject": "add index.js",
          "trailers": [],
          "type": "feat",
        }
      `)

      await restoreFullGitHistory(cwd)

      commit = await getParsedGitCommit(cwd, 'HEAD')

      expect(await getParsedGitCommit(cwd, 'HEAD')).toBe(commit)
      expect(await getParsedGitCommit(cwd, 'HEAD')).toBe(commit)
      expect(parseGitCommit).toHaveBeenCalledTimes(2)
      expect(commit).toMatchInlineSnapshot(`
        {
          "authorDate": "2026-01-01T00:00:12.000Z",
          "body": "Detailed description of the change",
          "committerDate": "2026-01-01T00:00:12.000Z",
          "files": [
            "index.js",
          ],
          "footer": null,
          "hash": "ddb51dfce787366ce1d515bd0fdeffaa7c34a2f4",
          "header": "feat: add index.js",
          "mentions": [],
          "merge": null,
          "notes": [],
          "parent": [
            "01510b9d8431aba623a0b97e021105adfc8c7051",
          ],
          "references": [],
          "revert": null,
          "scope": null,
          "subject": "add index.js",
          "trailers": [],
          "type": "feat",
        }
      `)
    })
  })
})
