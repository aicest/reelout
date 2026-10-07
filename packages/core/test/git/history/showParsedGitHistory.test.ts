// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../../../test/mock/git'

import {
  execGit,
  getParsedGitCommit,
  pushGitChanges,
  showParsedGitHistory,
} from '@reelout/core'
import { updatePackageJson, writePackageJson } from '@reelout/npm'
import { fromAsync } from 'from-async'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import {
  cloneGitRepository,
  getGitCommitHashes,
  getGitCommitSubjects,
  getGitTags,
  initializeGitRepository,
} from '../../../../../test/mock/git'

async function fetchCommits(
  cwd: string,
  from?: string,
  until?: string | number
) {
  let limit = Number.POSITIVE_INFINITY

  if (typeof until === 'number') {
    limit = until
    until = undefined
  }

  return (
    await fromAsync(
      (async function* () {
        for await (const commit of showParsedGitHistory(
          cwd,
          from !== undefined || until !== undefined
            ? { from, until }
            : undefined
        )) {
          yield commit
          if (--limit <= 0) break
        }
      })()
    )
  )
    .toReversed()
    .map((commit) => ({
      hash: commit.hash,
      header: commit.header,
      notes: commit.notes,
      files: commit.files,
    }))
}

async function fetchFileCommits(cwd: string, filePath: string, limit: number) {
  return (
    await fromAsync(
      (async function* () {
        for await (const commit of showParsedGitHistory(cwd, { filePath })) {
          yield commit
          if (--limit <= 0) break
        }
      })()
    )
  )
    .toReversed()
    .map((commit) => ({
      hash: commit.hash,
      header: commit.header,
      notes: commit.notes,
      files: commit.files,
    }))
}

async function showCommits(cwd: string, ref?: string) {
  return Promise.all(
    (await getGitCommitHashes(cwd, ref)).map(async (commit) => {
      try {
        const parsed = await getParsedGitCommit(cwd, commit)

        return {
          hash: parsed.hash,
          header: parsed.header,
          notes: parsed.notes,
          files: parsed.files,
        }
      } catch {
        return {
          commit,
          subject: JSON.stringify(
            await execGit(cwd, ['log', '-1', '--format=%s', commit])
          ),
        }
      }
    })
  )
}

test('yields parsed commits when querying repository history', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, [
        'commit',
        '--allow-empty',
        '--allow-empty-message',
        '-m',
        '',
      ])

      const pkgDir1 = path.join(cwd, 'packages/pkg1')
      const pkgDir2 = path.join(cwd, 'packages/pkg2')

      await mkdir(pkgDir1, { recursive: true })
      await mkdir(pkgDir2, { recursive: true })

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

      await writePackageJson(cwd, { version: '0.0.0' })
      await writePackageJson(pkgDir1, { version: '0.0.0' })
      await writePackageJson(pkgDir2, { version: '0.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: set up project'])
      await execGit(cwd, ['tag', 'v0.0.0'])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const a = 1;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg1): add index.js'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 2;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg2): add index.js'])

      await updatePackageJson(cwd, { version: '0.1.0' })
      await updatePackageJson(pkgDir1, { version: '0.1.0' })
      await updatePackageJson(pkgDir2, { version: '0.1.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: release v0.1.0'])
      await execGit(cwd, ['tag', 'v0.1.0'])
      await execGit(cwd, ['tag', 'pkg1@0.1.0', '-a', '-m', 'v0.1.0'])
      await execGit(cwd, ['tag', 'pkg2@0.1.0', '-a', '-m', 'v0.1.0'])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const a = 3;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'fix(pkg1): update a to 3\n\nBREAKING CHANGE: a is now 3',
      ])

      await updatePackageJson(pkgDir1, { version: '0.2.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg1): release pkg1@0.2.0'])
      await execGit(cwd, ['tag', 'pkg1@0.2.0'])

      await writeFile(path.join(cwd, 'README.md'), '# README')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'docs: add README file'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 4;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'fix(pkg2): update b to 4'])

      await updatePackageJson(pkgDir2, { version: '0.2.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg2): release pkg2@0.2.0'])
      await execGit(cwd, ['tag', 'pkg2@0.2.0'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 5;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'fix(pkg2): update b to 5'])

      await updatePackageJson(pkgDir2, { version: '0.3.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg2): release pkg2@0.3.0'])
      await execGit(cwd, ['tag', 'pkg2@0.3.0'])

      await execGit(cwd, [
        'commit',
        '--allow-empty',
        '--allow-empty-message',
        '-m',
        '',
      ])

      await pushGitChanges(cwd, 'main', '--tags')

      expect(await getGitTags(remote)).toMatchInlineSnapshot(`
        [
          "pkg1@0.1.0 v0.1.0",
          "pkg1@0.2.0",
          "pkg2@0.1.0 v0.1.0",
          "pkg2@0.2.0",
          "pkg2@0.3.0",
          "v0.0.0",
          "v0.1.0",
        ]
      `)
      expect(await getGitCommitSubjects(remote)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "chore: set up project",
          "feat(pkg1): add index.js",
          "feat(pkg2): add index.js",
          "chore: release v0.1.0",
          "fix(pkg1): update a to 3",
          "chore(pkg1): release pkg1@0.2.0",
          "docs: add README file",
          "fix(pkg2): update b to 4",
          "chore(pkg2): release pkg2@0.2.0",
          "fix(pkg2): update b to 5",
          "chore(pkg2): release pkg2@0.3.0",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await fetchCommits(cwd, undefined, 1)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "packages/pkg2/package.json",
            ],
            "hash": "2bfa7e2b29fb9b2a0b1650f9fff43b1d8f6afde5",
            "header": "chore(pkg2): release pkg2@0.3.0",
            "notes": [],
          },
        ]
      `)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "pkg2@0.3.0",
        ]
      `)
      expect(await showCommits(cwd)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "README.md",
              "package.json",
              "packages/pkg1/index.js",
              "packages/pkg1/package.json",
              "packages/pkg2/index.js",
              "packages/pkg2/package.json",
            ],
            "hash": "59359d224e5038ce673426e553b539ac0a7f003a",
            "header": "fix(pkg2): update b to 5",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/package.json",
            ],
            "hash": "2bfa7e2b29fb9b2a0b1650f9fff43b1d8f6afde5",
            "header": "chore(pkg2): release pkg2@0.3.0",
            "notes": [],
          },
          {
            "commit": "e701dbe553d85e505d679d7c0dbaba67ece4e4d4",
            "subject": ""\\n"",
          },
        ]
      `)

      expect(await fetchCommits(cwd, undefined, 2)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "packages/pkg2/index.js",
            ],
            "hash": "59359d224e5038ce673426e553b539ac0a7f003a",
            "header": "fix(pkg2): update b to 5",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/package.json",
            ],
            "hash": "2bfa7e2b29fb9b2a0b1650f9fff43b1d8f6afde5",
            "header": "chore(pkg2): release pkg2@0.3.0",
            "notes": [],
          },
        ]
      `)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "pkg2@0.2.0",
          "pkg2@0.3.0",
        ]
      `)
      expect(await showCommits(cwd)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "README.md",
              "package.json",
              "packages/pkg1/index.js",
              "packages/pkg1/package.json",
              "packages/pkg2/index.js",
              "packages/pkg2/package.json",
            ],
            "hash": "cde0d06652313194ac7042acec5163c13f2d4eb0",
            "header": "chore(pkg2): release pkg2@0.2.0",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/index.js",
            ],
            "hash": "59359d224e5038ce673426e553b539ac0a7f003a",
            "header": "fix(pkg2): update b to 5",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/package.json",
            ],
            "hash": "2bfa7e2b29fb9b2a0b1650f9fff43b1d8f6afde5",
            "header": "chore(pkg2): release pkg2@0.3.0",
            "notes": [],
          },
          {
            "commit": "e701dbe553d85e505d679d7c0dbaba67ece4e4d4",
            "subject": ""\\n"",
          },
        ]
      `)
    })
  })
})

test('yields parsed commits when bounded by revision range', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, [
        'commit',
        '--allow-empty',
        '--allow-empty-message',
        '-m',
        '',
      ])

      const pkgDir1 = path.join(cwd, 'packages/pkg1')
      const pkgDir2 = path.join(cwd, 'packages/pkg2')

      await mkdir(pkgDir1, { recursive: true })
      await mkdir(pkgDir2, { recursive: true })

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

      await writePackageJson(cwd, { version: '0.0.0' })
      await writePackageJson(pkgDir1, { version: '0.0.0' })
      await writePackageJson(pkgDir2, { version: '0.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: set up project'])
      await execGit(cwd, ['tag', 'v0.0.0'])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const a = 1;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg1): add index.js'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 2;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg2): add index.js'])

      await updatePackageJson(cwd, { version: '0.1.0' })
      await updatePackageJson(pkgDir1, { version: '0.1.0' })
      await updatePackageJson(pkgDir2, { version: '0.1.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: release v0.1.0'])
      await execGit(cwd, ['tag', 'v0.1.0'])
      await execGit(cwd, ['tag', 'pkg1@0.1.0', '-a', '-m', 'v0.1.0'])
      await execGit(cwd, ['tag', 'pkg2@0.1.0', '-a', '-m', 'v0.1.0'])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const a = 3;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'fix(pkg1): update a to 3\n\nBREAKING CHANGE: a is now 3',
      ])

      await updatePackageJson(pkgDir1, { version: '0.2.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg1): release pkg1@0.2.0'])
      await execGit(cwd, ['tag', 'pkg1@0.2.0'])

      await writeFile(path.join(cwd, 'README.md'), '# README')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'docs: add README file'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 4;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'fix(pkg2): update b to 4'])

      await updatePackageJson(pkgDir2, { version: '0.2.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg2): release pkg2@0.2.0'])
      await execGit(cwd, ['tag', 'pkg2@0.2.0'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 5;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'fix(pkg2): update b to 5'])

      await updatePackageJson(pkgDir2, { version: '0.3.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg2): release pkg2@0.3.0'])
      await execGit(cwd, ['tag', 'pkg2@0.3.0'])

      await execGit(cwd, [
        'commit',
        '--allow-empty',
        '--allow-empty-message',
        '-m',
        '',
      ])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      const from = 'pkg1@0.2.0'
      const until = 'v0.1.0'

      await execGit(cwd, [
        'fetch',
        'origin',
        `refs/tags/${from}:refs/tags/${from}`,
        `refs/tags/${until}:refs/tags/${until}`,
        '--depth=1',
      ])

      expect(await fetchCommits(cwd, from, until)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "packages/pkg1/index.js",
            ],
            "hash": "9ab926d29ce0539847563fc426f2ce6e93d6b0b0",
            "header": "fix(pkg1): update a to 3",
            "notes": [
              {
                "text": "a is now 3",
                "title": "BREAKING CHANGE",
              },
            ],
          },
          {
            "files": [
              "packages/pkg1/package.json",
            ],
            "hash": "b1df15c16d762256ffe7765eae7e13dd15af562d",
            "header": "chore(pkg1): release pkg1@0.2.0",
            "notes": [],
          },
        ]
      `)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "pkg1@0.1.0 v0.1.0",
          "pkg1@0.2.0",
          "pkg2@0.1.0 v0.1.0",
          "pkg2@0.2.0",
          "pkg2@0.3.0",
          "v0.1.0",
        ]
      `)
      expect(await showCommits(cwd, until)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "package.json",
              "packages/pkg1/index.js",
              "packages/pkg1/package.json",
              "packages/pkg2/index.js",
              "packages/pkg2/package.json",
            ],
            "hash": "452a846f1e38d2284b419e2c4bf6f3acf5f8d7b7",
            "header": "chore: release v0.1.0",
            "notes": [],
          },
        ]
      `)
      expect(await showCommits(cwd, from)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "package.json",
              "packages/pkg1/index.js",
              "packages/pkg1/package.json",
              "packages/pkg2/index.js",
              "packages/pkg2/package.json",
            ],
            "hash": "452a846f1e38d2284b419e2c4bf6f3acf5f8d7b7",
            "header": "chore: release v0.1.0",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg1/index.js",
            ],
            "hash": "9ab926d29ce0539847563fc426f2ce6e93d6b0b0",
            "header": "fix(pkg1): update a to 3",
            "notes": [
              {
                "text": "a is now 3",
                "title": "BREAKING CHANGE",
              },
            ],
          },
          {
            "files": [
              "packages/pkg1/package.json",
            ],
            "hash": "b1df15c16d762256ffe7765eae7e13dd15af562d",
            "header": "chore(pkg1): release pkg1@0.2.0",
            "notes": [],
          },
        ]
      `)
    })
  })
})

test('yields limited parsed commits when starting from tag reference', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, [
        'commit',
        '--allow-empty',
        '--allow-empty-message',
        '-m',
        '',
      ])

      const pkgDir1 = path.join(cwd, 'packages/pkg1')
      const pkgDir2 = path.join(cwd, 'packages/pkg2')

      await mkdir(pkgDir1, { recursive: true })
      await mkdir(pkgDir2, { recursive: true })

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

      await writePackageJson(cwd, { version: '0.0.0' })
      await writePackageJson(pkgDir1, { version: '0.0.0' })
      await writePackageJson(pkgDir2, { version: '0.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: set up project'])
      await execGit(cwd, ['tag', 'v0.0.0'])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const a = 1;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg1): add index.js'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 2;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg2): add index.js'])

      await updatePackageJson(cwd, { version: '0.1.0' })
      await updatePackageJson(pkgDir1, { version: '0.1.0' })
      await updatePackageJson(pkgDir2, { version: '0.1.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: release v0.1.0'])
      await execGit(cwd, ['tag', 'v0.1.0'])
      await execGit(cwd, ['tag', 'pkg1@0.1.0', '-a', '-m', 'v0.1.0'])
      await execGit(cwd, ['tag', 'pkg2@0.1.0', '-a', '-m', 'v0.1.0'])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const a = 3;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'fix(pkg1): update a to 3\n\nBREAKING CHANGE: a is now 3',
      ])

      await updatePackageJson(pkgDir1, { version: '0.2.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg1): release pkg1@0.2.0'])
      await execGit(cwd, ['tag', 'pkg1@0.2.0'])

      await writeFile(path.join(cwd, 'README.md'), '# README')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'docs: add README file'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 4;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'fix(pkg2): update b to 4'])

      await updatePackageJson(pkgDir2, { version: '0.2.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg2): release pkg2@0.2.0'])
      await execGit(cwd, ['tag', 'pkg2@0.2.0'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 5;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'fix(pkg2): update b to 5'])

      await updatePackageJson(pkgDir2, { version: '0.3.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg2): release pkg2@0.3.0'])
      await execGit(cwd, ['tag', 'pkg2@0.3.0'])

      await execGit(cwd, [
        'commit',
        '--allow-empty',
        '--allow-empty-message',
        '-m',
        '',
      ])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/pkg1@0.2.0:refs/tags/pkg1@0.2.0',
        '--depth=1',
      ])

      expect(await fetchCommits(cwd, 'pkg1@0.2.0', 2)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "packages/pkg1/index.js",
            ],
            "hash": "e65e5b94a46a006aaac475046de595c05c1c34ea",
            "header": "fix(pkg1): update a to 3",
            "notes": [
              {
                "text": "a is now 3",
                "title": "BREAKING CHANGE",
              },
            ],
          },
          {
            "files": [
              "packages/pkg1/package.json",
            ],
            "hash": "9db3511fbc90fab7f02802b538e94cd2fa391f00",
            "header": "chore(pkg1): release pkg1@0.2.0",
            "notes": [],
          },
        ]
      `)
      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "pkg1@0.2.0",
        ]
      `)
      expect(await showCommits(cwd, 'pkg1@0.2.0')).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "package.json",
              "packages/pkg1/index.js",
              "packages/pkg1/package.json",
              "packages/pkg2/index.js",
              "packages/pkg2/package.json",
            ],
            "hash": "6b4557ad5046354f653bb36ff98909888bfb1667",
            "header": "chore: release v0.1.0",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg1/index.js",
            ],
            "hash": "e65e5b94a46a006aaac475046de595c05c1c34ea",
            "header": "fix(pkg1): update a to 3",
            "notes": [
              {
                "text": "a is now 3",
                "title": "BREAKING CHANGE",
              },
            ],
          },
          {
            "files": [
              "packages/pkg1/package.json",
            ],
            "hash": "9db3511fbc90fab7f02802b538e94cd2fa391f00",
            "header": "chore(pkg1): release pkg1@0.2.0",
            "notes": [],
          },
        ]
      `)
    })
  })
})

test('yields parsed commits when filtered by file path', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, [
        'commit',
        '--allow-empty',
        '--allow-empty-message',
        '-m',
        '',
      ])

      const pkgDir1 = path.join(cwd, 'packages/pkg1')
      const pkgDir2 = path.join(cwd, 'packages/pkg2')

      await mkdir(pkgDir1, { recursive: true })
      await mkdir(pkgDir2, { recursive: true })

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

      await writePackageJson(cwd, { version: '0.0.0' })
      await writePackageJson(pkgDir1, { version: '0.0.0' })
      await writePackageJson(pkgDir2, { version: '0.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: set up project'])
      await execGit(cwd, ['tag', 'v0.0.0'])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const a = 1;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg1): add index.js'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 2;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'feat(pkg2): add index.js'])

      await updatePackageJson(cwd, { version: '0.1.0' })
      await updatePackageJson(pkgDir1, { version: '0.1.0' })
      await updatePackageJson(pkgDir2, { version: '0.1.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore: release v0.1.0'])
      await execGit(cwd, ['tag', 'v0.1.0'])

      await writeFile(path.join(pkgDir1, 'index.js'), 'export const a = 3;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, [
        'commit',
        '-m',
        'fix(pkg1): update a to 3\n\nBREAKING CHANGE: a is now 3',
      ])

      await updatePackageJson(pkgDir1, { version: '0.2.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg1): release v0.2.0'])
      await execGit(cwd, ['tag', 'pkg1@0.2.0'])

      await writeFile(path.join(cwd, 'README.md'), '# README')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'docs: add README file'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 4;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'fix(pkg2): update b to 4'])

      await updatePackageJson(pkgDir2, { version: '0.2.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg2): release v0.2.0'])
      await execGit(cwd, ['tag', 'pkg2@0.2.0'])

      await writeFile(path.join(pkgDir2, 'index.js'), 'export const b = 5;')
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'fix(pkg2): update b to 5'])

      await updatePackageJson(pkgDir2, { version: '0.3.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(pkg2): release v0.3.0'])
      await execGit(cwd, ['tag', 'pkg2@0.3.0'])

      await execGit(cwd, [
        'commit',
        '--allow-empty',
        '--allow-empty-message',
        '-m',
        '',
      ])

      await pushGitChanges(cwd, 'main', '--tags')

      expect(await getGitTags(remote)).toMatchInlineSnapshot(`
        [
          "pkg1@0.2.0",
          "pkg2@0.2.0",
          "pkg2@0.3.0",
          "v0.0.0",
          "v0.1.0",
        ]
      `)
      expect(await getGitCommitSubjects(remote)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "chore: set up project",
          "feat(pkg1): add index.js",
          "feat(pkg2): add index.js",
          "chore: release v0.1.0",
          "fix(pkg1): update a to 3",
          "chore(pkg1): release v0.2.0",
          "docs: add README file",
          "fix(pkg2): update b to 4",
          "chore(pkg2): release v0.2.0",
          "fix(pkg2): update b to 5",
          "chore(pkg2): release v0.3.0",
        ]
      `)
    })

    const pkgDir1 = 'packages/pkg1'
    const pkgDir2 = 'packages/pkg2'

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await fetchFileCommits(cwd, pkgDir1, 1)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "packages/pkg1/package.json",
            ],
            "hash": "0229141b4c9698903ec90f3155c9dc0381b1f923",
            "header": "chore(pkg1): release v0.2.0",
            "notes": [],
          },
        ]
      `)
      expect(await showCommits(cwd)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "package.json",
              "packages/pkg1/index.js",
              "packages/pkg1/package.json",
              "packages/pkg2/index.js",
              "packages/pkg2/package.json",
            ],
            "hash": "b48cbbb71840bf960ea8fed46a445c9d34c3b3fb",
            "header": "fix(pkg1): update a to 3",
            "notes": [
              {
                "text": "a is now 3",
                "title": "BREAKING CHANGE",
              },
            ],
          },
          {
            "files": [
              "packages/pkg1/package.json",
            ],
            "hash": "0229141b4c9698903ec90f3155c9dc0381b1f923",
            "header": "chore(pkg1): release v0.2.0",
            "notes": [],
          },
          {
            "files": [
              "README.md",
            ],
            "hash": "83a0e43076967318e9f4708b3b5508d24b292580",
            "header": "docs: add README file",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/index.js",
            ],
            "hash": "1242fb3ba4ba5cd2fb16cdd3bbaa2a0c417029c2",
            "header": "fix(pkg2): update b to 4",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/package.json",
            ],
            "hash": "96675c79a4634a02d818c7100063a1b91ce61b50",
            "header": "chore(pkg2): release v0.2.0",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/index.js",
            ],
            "hash": "e755363880c09345d3a23e0b00758748e6144367",
            "header": "fix(pkg2): update b to 5",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/package.json",
            ],
            "hash": "cc0f2bec87ef40e833b8157c5e383555a2777697",
            "header": "chore(pkg2): release v0.3.0",
            "notes": [],
          },
          {
            "commit": "57f7c32697f3bb366fe382099eab329be4125f45",
            "subject": ""\\n"",
          },
        ]
      `)

      expect(await fetchFileCommits(cwd, pkgDir1, 2)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "packages/pkg1/index.js",
            ],
            "hash": "b48cbbb71840bf960ea8fed46a445c9d34c3b3fb",
            "header": "fix(pkg1): update a to 3",
            "notes": [
              {
                "text": "a is now 3",
                "title": "BREAKING CHANGE",
              },
            ],
          },
          {
            "files": [
              "packages/pkg1/package.json",
            ],
            "hash": "0229141b4c9698903ec90f3155c9dc0381b1f923",
            "header": "chore(pkg1): release v0.2.0",
            "notes": [],
          },
        ]
      `)
      expect(await showCommits(cwd)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "package.json",
              "packages/pkg1/index.js",
              "packages/pkg1/package.json",
              "packages/pkg2/index.js",
              "packages/pkg2/package.json",
            ],
            "hash": "ebc6fc33457122ff1561627462d205c2a401b396",
            "header": "chore: release v0.1.0",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg1/index.js",
            ],
            "hash": "b48cbbb71840bf960ea8fed46a445c9d34c3b3fb",
            "header": "fix(pkg1): update a to 3",
            "notes": [
              {
                "text": "a is now 3",
                "title": "BREAKING CHANGE",
              },
            ],
          },
          {
            "files": [
              "packages/pkg1/package.json",
            ],
            "hash": "0229141b4c9698903ec90f3155c9dc0381b1f923",
            "header": "chore(pkg1): release v0.2.0",
            "notes": [],
          },
          {
            "files": [
              "README.md",
            ],
            "hash": "83a0e43076967318e9f4708b3b5508d24b292580",
            "header": "docs: add README file",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/index.js",
            ],
            "hash": "1242fb3ba4ba5cd2fb16cdd3bbaa2a0c417029c2",
            "header": "fix(pkg2): update b to 4",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/package.json",
            ],
            "hash": "96675c79a4634a02d818c7100063a1b91ce61b50",
            "header": "chore(pkg2): release v0.2.0",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/index.js",
            ],
            "hash": "e755363880c09345d3a23e0b00758748e6144367",
            "header": "fix(pkg2): update b to 5",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/package.json",
            ],
            "hash": "cc0f2bec87ef40e833b8157c5e383555a2777697",
            "header": "chore(pkg2): release v0.3.0",
            "notes": [],
          },
          {
            "commit": "57f7c32697f3bb366fe382099eab329be4125f45",
            "subject": ""\\n"",
          },
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await fetchFileCommits(cwd, pkgDir2, 1)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "packages/pkg2/package.json",
            ],
            "hash": "cc0f2bec87ef40e833b8157c5e383555a2777697",
            "header": "chore(pkg2): release v0.3.0",
            "notes": [],
          },
        ]
      `)
      expect(await showCommits(cwd)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "README.md",
              "package.json",
              "packages/pkg1/index.js",
              "packages/pkg1/package.json",
              "packages/pkg2/index.js",
              "packages/pkg2/package.json",
            ],
            "hash": "e755363880c09345d3a23e0b00758748e6144367",
            "header": "fix(pkg2): update b to 5",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/package.json",
            ],
            "hash": "cc0f2bec87ef40e833b8157c5e383555a2777697",
            "header": "chore(pkg2): release v0.3.0",
            "notes": [],
          },
          {
            "commit": "57f7c32697f3bb366fe382099eab329be4125f45",
            "subject": ""\\n"",
          },
        ]
      `)

      expect(await fetchFileCommits(cwd, pkgDir2, 2)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "packages/pkg2/index.js",
            ],
            "hash": "e755363880c09345d3a23e0b00758748e6144367",
            "header": "fix(pkg2): update b to 5",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/package.json",
            ],
            "hash": "cc0f2bec87ef40e833b8157c5e383555a2777697",
            "header": "chore(pkg2): release v0.3.0",
            "notes": [],
          },
        ]
      `)
      expect(await showCommits(cwd)).toMatchInlineSnapshot(`
        [
          {
            "files": [
              "README.md",
              "package.json",
              "packages/pkg1/index.js",
              "packages/pkg1/package.json",
              "packages/pkg2/index.js",
              "packages/pkg2/package.json",
            ],
            "hash": "96675c79a4634a02d818c7100063a1b91ce61b50",
            "header": "chore(pkg2): release v0.2.0",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/index.js",
            ],
            "hash": "e755363880c09345d3a23e0b00758748e6144367",
            "header": "fix(pkg2): update b to 5",
            "notes": [],
          },
          {
            "files": [
              "packages/pkg2/package.json",
            ],
            "hash": "cc0f2bec87ef40e833b8157c5e383555a2777697",
            "header": "chore(pkg2): release v0.3.0",
            "notes": [],
          },
          {
            "commit": "57f7c32697f3bb366fe382099eab329be4125f45",
            "subject": ""\\n"",
          },
        ]
      `)
    })
  })
}, 15_000)
