// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  execGit,
  isGitAncestor,
  pushGitChanges,
  restoreFullGitHistory,
  showGitHistory,
} from '@reelout/core'
import {
  removePackageJson,
  updatePackageJson,
  writePackageJson,
} from '@reelout/npm'
import { fromAsync } from 'from-async'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import {
  cloneGitRepository,
  getGitCommitSubjects,
  getGitTags,
  initializeGitRepository,
} from '../../../../../test/mock/git'

async function showCommits(
  cwd: string,
  from?: string,
  pageSize?: number | string,
  until?: string
): Promise<string[]> {
  if (typeof pageSize === 'string') {
    until = pageSize
    pageSize = undefined
  }

  return Promise.all(
    (
      await fromAsync(
        showGitHistory(
          cwd,
          from !== undefined || until !== undefined || pageSize !== undefined
            ? { from, until, pageSize }
            : undefined
        )
      )
    )
      .toReversed()
      .map(async (commit) =>
        (await execGit(cwd, ['log', '-1', '--format=%s', commit])).trim()
      )
  )
}

async function showFileCommits(
  cwd: string,
  filePath: string | readonly string[],
  pageSize?: number | string,
  until?: string
) {
  if (typeof pageSize === 'string') {
    until = pageSize
    pageSize = undefined
  }

  return Promise.all(
    (await fromAsync(showGitHistory(cwd, { filePath, until, pageSize })))
      .toReversed()
      .map(async (commit) =>
        (await execGit(cwd, ['log', '-1', '--format=%s', commit])).trim()
      )
  )
}

test('automatically expands shallow clones during traversal to expose the full repository history', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
      await execGit(cwd, ['tag', 'v3.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])
      await execGit(cwd, ['tag', 'v4.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')

      expect(await getGitCommitSubjects(remote)).toEqual([
        'Initial commit',
        'Second commit',
        'Third commit',
        'Fourth commit',
      ])

      expect(await getGitTags(remote)).toEqual([
        'v1.0.0',
        'v2.0.0',
        'v3.0.0',
        'v4.0.0',
      ])
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await showCommits(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
        ]
      `)
    })
  })
})

test('correctly paginates commit enumeration across varied page size values', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
      await execGit(cwd, ['tag', 'v3.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])
      await execGit(cwd, ['tag', 'v4.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await showCommits(cwd, undefined, 1)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
        ]
      `)
      expect(await showCommits(cwd, undefined, 2)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
        ]
      `)
      expect(await showCommits(cwd, undefined, 4)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
        ]
      `)
      expect(await showCommits(cwd, undefined, 99)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
        ]
      `)
    })
  })
})

test('limits commit enumeration to history reachable from the current checkout target', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
      await execGit(cwd, ['tag', 'v3.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])
      await execGit(cwd, ['tag', 'v4.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'v1.0.0')

      expect(await showCommits(cwd, undefined, 1)).toMatchInlineSnapshot(`
        [
          "Initial commit",
        ]
      `)
      expect(await showCommits(cwd, undefined, 99)).toMatchInlineSnapshot(`
        [
          "Initial commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'v2.0.0')

      expect(await showCommits(cwd, undefined, 1)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
        ]
      `)
      expect(await showCommits(cwd, undefined, 99)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
        ]
      `)

      await temporaryDirectoryTask(async (cwd) => {
        await cloneGitRepository(cwd, remote, 'v3.0.0')

        expect(await showCommits(cwd, undefined, 1)).toMatchInlineSnapshot(`
          [
            "Initial commit",
            "Second commit",
            "Third commit",
          ]
        `)
        expect(await showCommits(cwd, undefined, 99)).toMatchInlineSnapshot(`
          [
            "Initial commit",
            "Second commit",
            "Third commit",
          ]
        `)
      })

      await temporaryDirectoryTask(async (cwd) => {
        await cloneGitRepository(cwd, remote, 'v4.0.0')

        expect(await showCommits(cwd, undefined, 1)).toMatchInlineSnapshot(`
          [
            "Initial commit",
            "Second commit",
            "Third commit",
            "Fourth commit",
          ]
        `)
        expect(await showCommits(cwd, undefined, 99)).toMatchInlineSnapshot(`
          [
            "Initial commit",
            "Second commit",
            "Third commit",
            "Fourth commit",
          ]
        `)
      })
    })
  })
}, 15_000)

test('uses a designated tag reference as the starting boundary for history traversal', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
      await execGit(cwd, ['tag', 'v3.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])
      await execGit(cwd, ['tag', 'v4.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v1.0.0:refs/tags/v1.0.0',
        '--depth=1',
      ])

      expect(await showCommits(cwd, 'v1.0.0', 1)).toMatchInlineSnapshot(`
        [
          "Initial commit",
        ]
      `)
      expect(await showCommits(cwd, 'v1.0.0', 99)).toMatchInlineSnapshot(`
        [
          "Initial commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v2.0.0:refs/tags/v2.0.0',
        '--depth=1',
      ])

      expect(await showCommits(cwd, 'v2.0.0', 1)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
        ]
      `)
      expect(await showCommits(cwd, 'v2.0.0', 99)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v3.0.0:refs/tags/v3.0.0',
        '--depth=1',
      ])

      expect(await showCommits(cwd, 'v3.0.0', 1)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
        ]
      `)
      expect(await showCommits(cwd, 'v3.0.0', 99)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v4.0.0:refs/tags/v4.0.0',
        '--depth=1',
      ])

      expect(await showCommits(cwd, 'v4.0.0', 1)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
        ]
      `)
      expect(await showCommits(cwd, 'v4.0.0', 99)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
          "Fourth commit",
        ]
      `)
    })
  })
}, 15_000)

test('correctly resolves bounded commit ranges while honoring annotated tags', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2.0.0', '-a', '-m', 'Annotated tag'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
      await execGit(cwd, ['tag', 'v3.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])
      await execGit(cwd, ['tag', 'v4.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v2.0.0:refs/tags/v2.0.0',
        '--depth=1',
      ])

      expect(await showCommits(cwd, 'HEAD', 'v2.0.0')).toMatchInlineSnapshot(`
        [
          "Third commit",
          "Fourth commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v3.0.0:refs/tags/v3.0.0',
        '--depth=1',
      ])

      expect(await showCommits(cwd, 'HEAD', 'v3.0.0')).toMatchInlineSnapshot(`
        [
          "Fourth commit",
        ]
      `)
    })
  })
})

test('accepts a raw commit hash as the terminating boundary for history traversal', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
      await execGit(cwd, ['tag', 'v3.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])
      await execGit(cwd, ['tag', 'v4.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v2.0.0:refs/tags/v2.0.0',
        '--depth=1',
      ])

      const hash = (await execGit(cwd, ['rev-parse', 'v2.0.0'])).trim()

      expect(await showCommits(cwd, 'HEAD', hash)).toMatchInlineSnapshot(`
        [
          "Third commit",
          "Fourth commit",
        ]
      `)
    })
  })
})

test('enumerates the precise commit range bounded between two separate tag references', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
      await execGit(cwd, ['tag', 'v3.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])
      await execGit(cwd, ['tag', 'v4.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v1.0.0:refs/tags/v1.0.0',
        '--depth=1',
      ])

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v3.0.0:refs/tags/v3.0.0',
        '--depth=1',
      ])

      expect(await showCommits(cwd, 'v3.0.0', 'v1.0.0')).toMatchInlineSnapshot(`
        [
          "Second commit",
          "Third commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v2.0.0:refs/tags/v2.0.0',
        '--depth=1',
      ])

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v4.0.0:refs/tags/v4.0.0',
        '--depth=4',
      ])

      expect(await showCommits(cwd, 'v4.0.0', 'v2.0.0')).toMatchInlineSnapshot(`
        [
          "Third commit",
          "Fourth commit",
        ]
      `)
    })
  })
})

test('terminates traversal cleanly without bleeding into unrelated branch histories when a target boundary tag is on a parallel branch', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'v1 release'])
      await execGit(cwd, ['tag', 'v1.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'v2 release'])
      await execGit(cwd, ['tag', 'v2.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'v3 release'])
      await execGit(cwd, ['tag', 'v3.0.0'])

      await execGit(cwd, ['checkout', '-b', 'feature/v3-patches'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'v3.0.1 patch'])
      await execGit(cwd, ['tag', 'v3.0.1'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'v3.0.2 patch'])
      await execGit(cwd, ['tag', 'v3.0.2'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'v3.0.3 patch'])
      await execGit(cwd, ['tag', 'v3.0.3'])

      await execGit(cwd, ['checkout', 'main'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'v4 release'])
      await execGit(cwd, ['tag', 'v4.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'v5 release'])
      await execGit(cwd, ['tag', 'v5.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'v6 release'])
      await execGit(cwd, ['tag', 'v6.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')
      await pushGitChanges(cwd, 'feature/v3-patches', '--tags')

      expect(await showCommits(cwd, 'v5.0.0', 'v3.0.2')).toMatchInlineSnapshot(`
        [
          "v4 release",
          "v5 release",
        ]
      `)
      expect(await showCommits(cwd, 'v6.0.0', 'v3.0.2')).toMatchInlineSnapshot(`
        [
          "v4 release",
          "v5 release",
          "v6 release",
        ]
      `)
      expect(await showCommits(cwd, 'v3.0.2', 'v5.0.0')).toMatchInlineSnapshot(`
        [
          "v3.0.1 patch",
          "v3.0.2 patch",
        ]
      `)
      expect(await showCommits(cwd, 'v3.0.2', 'v6.0.0')).toMatchInlineSnapshot(`
        [
          "v3.0.1 patch",
          "v3.0.2 patch",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v3.0.2:refs/tags/v3.0.2',
        'refs/tags/v5.0.0:refs/tags/v5.0.0',
        '--depth=1',
      ])

      expect(await showCommits(cwd, 'v5.0.0', 'v3.0.2')).toMatchInlineSnapshot(`
        [
          "v4 release",
          "v5 release",
        ]
      `)
      expect(await showCommits(cwd, 'v6.0.0', 'v3.0.2')).toMatchInlineSnapshot(`
        [
          "v4 release",
          "v5 release",
          "v6 release",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/v3.0.2:refs/tags/v3.0.2',
        'refs/tags/v5.0.0:refs/tags/v5.0.0',
        '--depth=1',
      ])

      expect(await showCommits(cwd, 'v3.0.2', 'v5.0.0')).toMatchInlineSnapshot(`
        [
          "v3.0.2 patch",
        ]
      `)
      expect(await showCommits(cwd, 'v3.0.2', 'v6.0.0')).toMatchInlineSnapshot(`
        [
          "v3.0.2 patch",
        ]
      `)
    })
  })
})

test('safely returns an empty collection when given an unresolvable or invalid end reference', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['tag', 'v1.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['tag', 'v2.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
      await execGit(cwd, ['tag', 'v3.0.0'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])
      await execGit(cwd, ['tag', 'v4.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await showCommits(cwd, 'HEAD', 'non-existent')).toEqual([])
      expect(await showCommits(cwd, 'HEAD', '--invalid-flag')).toEqual([])
    })
  })
})

test('filters history logs accurately when targeting specific file path patterns or glob exclusions', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    const pkgDir1 = path.join(cwd, 'packages/foo')
    const pkgDir2 = path.join(cwd, 'packages/bar')

    await writePackageJson(cwd, { private: true })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Add root package - 1'])

    await writePackageJson(pkgDir1, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Add foo package v1.0.0 - 2'])
    await execGit(cwd, ['tag', 'foo@1.0.0'])

    await writePackageJson(pkgDir2, { version: '2.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Add bar package v2.0.0 - 3'])
    await execGit(cwd, ['tag', 'bar@2.0.0'])

    await writeFile(path.join(pkgDir1, 'index.js'), 'export const a = 1')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Add foo index.js - 4'])

    await updatePackageJson(pkgDir1, { version: '1.1.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Bump foo to v1.1.0 - 5'])
    await execGit(cwd, ['tag', 'foo@1.1.0'])

    await removePackageJson(pkgDir2)
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Remove bar package - 6'])

    await writePackageJson(pkgDir2, { version: '2.1.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Re-add bar package v2.1.0 - 7'])
    await execGit(cwd, ['tag', 'bar@2.1.0'])

    await writeFile(path.join(cwd, 'README.md'), '')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Add README - 8'])

    await writeFile(path.join(cwd, 'CHANGELOG.md'), '')
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Add CHANGELOG - 9'])

    const pkgFile1 = 'packages/foo/package.json'
    const pkgFile2 = 'packages/bar/package.json'
    const allPkgFiles1 = ':(glob)packages/**/*/package.json'
    const allPkgFiles2 = ':(glob)**/*.json'
    const allPkgFiles3 = ':(exclude,glob)**/*.json'
    const allPkgFiles4 = [':(glob)**/*.js', ':(glob)**/*.json']
    const allFiles = ':(glob)**/*'

    expect(
      await showFileCommits(cwd, 'packages/non-existent/package.json')
    ).toEqual([])

    expect(
      await showFileCommits(cwd, ':(glob)packages/non-existent/*')
    ).toEqual([])

    expect(await showFileCommits(cwd, pkgFile1)).toMatchInlineSnapshot(`
      [
        "Add foo package v1.0.0 - 2",
        "Bump foo to v1.1.0 - 5",
      ]
    `)

    expect(await showFileCommits(cwd, pkgFile2)).toMatchInlineSnapshot(`
      [
        "Add bar package v2.0.0 - 3",
        "Remove bar package - 6",
        "Re-add bar package v2.1.0 - 7",
      ]
    `)

    expect(await showFileCommits(cwd, [pkgFile1, pkgFile2]))
      .toMatchInlineSnapshot(`
      [
        "Add foo package v1.0.0 - 2",
        "Add bar package v2.0.0 - 3",
        "Bump foo to v1.1.0 - 5",
        "Remove bar package - 6",
        "Re-add bar package v2.1.0 - 7",
      ]
    `)

    expect(await showFileCommits(cwd, allPkgFiles1)).toMatchInlineSnapshot(`
      [
        "Add foo package v1.0.0 - 2",
        "Add bar package v2.0.0 - 3",
        "Bump foo to v1.1.0 - 5",
        "Remove bar package - 6",
        "Re-add bar package v2.1.0 - 7",
      ]
    `)

    expect(await showFileCommits(cwd, allPkgFiles2)).toMatchInlineSnapshot(`
      [
        "Add root package - 1",
        "Add foo package v1.0.0 - 2",
        "Add bar package v2.0.0 - 3",
        "Bump foo to v1.1.0 - 5",
        "Remove bar package - 6",
        "Re-add bar package v2.1.0 - 7",
      ]
    `)

    expect(await showFileCommits(cwd, allPkgFiles3)).toMatchInlineSnapshot(`
      [
        "Add foo index.js - 4",
        "Add README - 8",
        "Add CHANGELOG - 9",
      ]
    `)

    expect(await showFileCommits(cwd, allPkgFiles4)).toMatchInlineSnapshot(`
      [
        "Add root package - 1",
        "Add foo package v1.0.0 - 2",
        "Add bar package v2.0.0 - 3",
        "Add foo index.js - 4",
        "Bump foo to v1.1.0 - 5",
        "Remove bar package - 6",
        "Re-add bar package v2.1.0 - 7",
      ]
    `)

    expect(await showFileCommits(cwd, allFiles)).toMatchInlineSnapshot(`
      [
        "Add root package - 1",
        "Add foo package v1.0.0 - 2",
        "Add bar package v2.0.0 - 3",
        "Add foo index.js - 4",
        "Bump foo to v1.1.0 - 5",
        "Remove bar package - 6",
        "Re-add bar package v2.1.0 - 7",
        "Add README - 8",
        "Add CHANGELOG - 9",
      ]
    `)

    expect(await showFileCommits(cwd, allFiles, 1)).toMatchInlineSnapshot(`
      [
        "Add root package - 1",
        "Add foo package v1.0.0 - 2",
        "Add bar package v2.0.0 - 3",
        "Add foo index.js - 4",
        "Bump foo to v1.1.0 - 5",
        "Remove bar package - 6",
        "Re-add bar package v2.1.0 - 7",
        "Add README - 8",
        "Add CHANGELOG - 9",
      ]
    `)

    expect(await showFileCommits(cwd, allFiles, 2)).toMatchInlineSnapshot(`
      [
        "Add root package - 1",
        "Add foo package v1.0.0 - 2",
        "Add bar package v2.0.0 - 3",
        "Add foo index.js - 4",
        "Bump foo to v1.1.0 - 5",
        "Remove bar package - 6",
        "Re-add bar package v2.1.0 - 7",
        "Add README - 8",
        "Add CHANGELOG - 9",
      ]
    `)

    expect(await showFileCommits(cwd, allFiles, 3)).toMatchInlineSnapshot(`
      [
        "Add root package - 1",
        "Add foo package v1.0.0 - 2",
        "Add bar package v2.0.0 - 3",
        "Add foo index.js - 4",
        "Bump foo to v1.1.0 - 5",
        "Remove bar package - 6",
        "Re-add bar package v2.1.0 - 7",
        "Add README - 8",
        "Add CHANGELOG - 9",
      ]
    `)

    expect(await showFileCommits(cwd, allFiles, 4)).toMatchInlineSnapshot(`
      [
        "Add root package - 1",
        "Add foo package v1.0.0 - 2",
        "Add bar package v2.0.0 - 3",
        "Add foo index.js - 4",
        "Bump foo to v1.1.0 - 5",
        "Remove bar package - 6",
        "Re-add bar package v2.1.0 - 7",
        "Add README - 8",
        "Add CHANGELOG - 9",
      ]
    `)
  })
}, 15_000)

test('dynamically resolves and restores file-specific history records inside shallow clones', async () => {
  await temporaryDirectoryTask(async (remote) => {
    const pkgFile1 = 'packages/foo/package.json'
    const pkgFile2 = 'packages/bar/package.json'

    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      const pkgDir1 = path.join(cwd, 'packages/foo')
      const pkgDir2 = path.join(cwd, 'packages/bar')

      await writePackageJson(pkgDir1, { version: '0.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(foo): initialize package - 1'])
      await execGit(cwd, ['tag', 'foo@0.0.0'])

      await writePackageJson(pkgDir2, { version: '0.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(bar): initialize package - 2'])
      await execGit(cwd, ['tag', 'bar@0.0.0'])

      await updatePackageJson(pkgDir2, { version: '2.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(bar): bump to v2.0.0 - 3'])
      await execGit(cwd, ['tag', 'bar@2.0.0'])

      await updatePackageJson(pkgDir2, { version: '2.1.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(bar): bump to v2.1.0 - 4'])
      await execGit(cwd, ['tag', 'bar@2.1.0'])

      await updatePackageJson(pkgDir1, { version: '1.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(foo): bump to v1.0.0 - 5'])
      await execGit(cwd, ['tag', 'foo@1.0.0'])

      await updatePackageJson(pkgDir1, { version: '1.1.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(foo): bump to v1.1.0 - 6'])
      await execGit(cwd, ['tag', 'foo@1.1.0'])

      await updatePackageJson(pkgDir2, { version: '2.2.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(bar): bump to v2.2.0 - 7'])
      await execGit(cwd, ['tag', 'bar@2.2.0'])

      await updatePackageJson(pkgDir1, { version: '1.2.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'chore(foo): bump to v1.2.0 - 8'])
      await execGit(cwd, ['tag', 'foo@1.2.0'])

      await pushGitChanges(cwd, 'main', '--tags')

      expect(await showFileCommits(cwd, pkgFile1, 1)).toMatchInlineSnapshot(`
        [
          "chore(foo): initialize package - 1",
          "chore(foo): bump to v1.0.0 - 5",
          "chore(foo): bump to v1.1.0 - 6",
          "chore(foo): bump to v1.2.0 - 8",
        ]
      `)
      expect(await showFileCommits(cwd, pkgFile2, 1)).toMatchInlineSnapshot(`
        [
          "chore(bar): initialize package - 2",
          "chore(bar): bump to v2.0.0 - 3",
          "chore(bar): bump to v2.1.0 - 4",
          "chore(bar): bump to v2.2.0 - 7",
        ]
      `)
      expect(await getGitCommitSubjects(remote)).toMatchInlineSnapshot(`
        [
          "chore(foo): initialize package - 1",
          "chore(bar): initialize package - 2",
          "chore(bar): bump to v2.0.0 - 3",
          "chore(bar): bump to v2.1.0 - 4",
          "chore(foo): bump to v1.0.0 - 5",
          "chore(foo): bump to v1.1.0 - 6",
          "chore(bar): bump to v2.2.0 - 7",
          "chore(foo): bump to v1.2.0 - 8",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "chore(foo): bump to v1.2.0 - 8",
        ]
      `)

      expect(await showFileCommits(cwd, pkgFile1, 1)).toMatchInlineSnapshot(`
        [
          "chore(foo): initialize package - 1",
          "chore(foo): bump to v1.0.0 - 5",
          "chore(foo): bump to v1.1.0 - 6",
          "chore(foo): bump to v1.2.0 - 8",
        ]
      `)

      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "chore(foo): initialize package - 1",
          "chore(bar): initialize package - 2",
          "chore(bar): bump to v2.0.0 - 3",
          "chore(bar): bump to v2.1.0 - 4",
          "chore(foo): bump to v1.0.0 - 5",
          "chore(foo): bump to v1.1.0 - 6",
          "chore(bar): bump to v2.2.0 - 7",
          "chore(foo): bump to v1.2.0 - 8",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "chore(foo): bump to v1.2.0 - 8",
        ]
      `)

      expect(await showFileCommits(cwd, pkgFile2, 1)).toMatchInlineSnapshot(`
        [
          "chore(bar): initialize package - 2",
          "chore(bar): bump to v2.0.0 - 3",
          "chore(bar): bump to v2.1.0 - 4",
          "chore(bar): bump to v2.2.0 - 7",
        ]
      `)

      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "chore(foo): initialize package - 1",
          "chore(bar): initialize package - 2",
          "chore(bar): bump to v2.0.0 - 3",
          "chore(bar): bump to v2.1.0 - 4",
          "chore(foo): bump to v1.0.0 - 5",
          "chore(foo): bump to v1.1.0 - 6",
          "chore(bar): bump to v2.2.0 - 7",
          "chore(foo): bump to v1.2.0 - 8",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await showFileCommits(cwd, pkgFile1)).toMatchInlineSnapshot(`
        [
          "chore(foo): initialize package - 1",
          "chore(foo): bump to v1.0.0 - 5",
          "chore(foo): bump to v1.1.0 - 6",
          "chore(foo): bump to v1.2.0 - 8",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await showFileCommits(cwd, pkgFile2)).toMatchInlineSnapshot(`
        [
          "chore(bar): initialize package - 2",
          "chore(bar): bump to v2.0.0 - 3",
          "chore(bar): bump to v2.1.0 - 4",
          "chore(bar): bump to v2.2.0 - 7",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await restoreFullGitHistory(cwd)

      expect(await showFileCommits(cwd, pkgFile1, 'foo@1.0.0'))
        .toMatchInlineSnapshot(`
        [
          "chore(foo): bump to v1.1.0 - 6",
          "chore(foo): bump to v1.2.0 - 8",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await restoreFullGitHistory(cwd)

      expect(await showFileCommits(cwd, pkgFile1, 'bar@2.1.0'))
        .toMatchInlineSnapshot(`
        [
          "chore(foo): bump to v1.0.0 - 5",
          "chore(foo): bump to v1.1.0 - 6",
          "chore(foo): bump to v1.2.0 - 8",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      await execGit(cwd, ['fetch', 'origin', 'HEAD', '--depth=99'])

      await execGit(cwd, [
        'fetch',
        'origin',
        'refs/tags/foo@1.1.0:refs/tags/foo@1.1.0',
        '--depth=2',
      ])

      expect(await isGitAncestor(cwd, 'foo@1.1.0', 'HEAD')).toBe(true)

      expect(await showFileCommits(cwd, pkgFile2, 'foo@1.1.0'))
        .toMatchInlineSnapshot(`
        [
          "chore(bar): bump to v2.2.0 - 7",
        ]
      `)

      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "chore(foo): initialize package - 1",
          "chore(bar): initialize package - 2",
          "chore(bar): bump to v2.0.0 - 3",
          "chore(bar): bump to v2.1.0 - 4",
          "chore(foo): bump to v1.0.0 - 5",
          "chore(foo): bump to v1.1.0 - 6",
          "chore(bar): bump to v2.2.0 - 7",
          "chore(foo): bump to v1.2.0 - 8",
        ]
      `)
    })
  })
}, 30_000)

test('respects historical checkout boundaries when filtering file history within shallow environments', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await writePackageJson(cwd, {})
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'Add package.json - 1'])

      await updatePackageJson(cwd, { version: '1.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'Update package.json to 1.0.0 - 2'])
      await execGit(cwd, ['tag', 'v1.0.0'])

      await updatePackageJson(cwd, { version: '2.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'Update package.json to 2.0.0 - 3'])
      await execGit(cwd, ['tag', 'v2.0.0'])

      await updatePackageJson(cwd, { version: '3.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'Update package.json to 3.0.0 - 4'])
      await execGit(cwd, ['tag', 'v3.0.0'])

      await updatePackageJson(cwd, { version: '4.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'Update package.json to 4.0.0 - 5'])
      await execGit(cwd, ['tag', 'v4.0.0'])

      await pushGitChanges(cwd, 'main', '--tags')

      expect(await getGitCommitSubjects(remote)).toMatchInlineSnapshot(`
        [
          "Add package.json - 1",
          "Update package.json to 1.0.0 - 2",
          "Update package.json to 2.0.0 - 3",
          "Update package.json to 3.0.0 - 4",
          "Update package.json to 4.0.0 - 5",
        ]
      `)
      expect(await getGitTags(remote)).toMatchInlineSnapshot(`
        [
          "v1.0.0",
          "v2.0.0",
          "v3.0.0",
          "v4.0.0",
        ]
      `)
    })

    const filePath = 'package.json'

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await showFileCommits(cwd, filePath, 1)).toMatchInlineSnapshot(`
        [
          "Add package.json - 1",
          "Update package.json to 1.0.0 - 2",
          "Update package.json to 2.0.0 - 3",
          "Update package.json to 3.0.0 - 4",
          "Update package.json to 4.0.0 - 5",
        ]
      `)
      expect(await showFileCommits(cwd, filePath, 2)).toMatchInlineSnapshot(`
        [
          "Add package.json - 1",
          "Update package.json to 1.0.0 - 2",
          "Update package.json to 2.0.0 - 3",
          "Update package.json to 3.0.0 - 4",
          "Update package.json to 4.0.0 - 5",
        ]
      `)
      expect(await showFileCommits(cwd, filePath, 4)).toMatchInlineSnapshot(`
        [
          "Add package.json - 1",
          "Update package.json to 1.0.0 - 2",
          "Update package.json to 2.0.0 - 3",
          "Update package.json to 3.0.0 - 4",
          "Update package.json to 4.0.0 - 5",
        ]
      `)
      expect(await showFileCommits(cwd, filePath, 8)).toMatchInlineSnapshot(`
        [
          "Add package.json - 1",
          "Update package.json to 1.0.0 - 2",
          "Update package.json to 2.0.0 - 3",
          "Update package.json to 3.0.0 - 4",
          "Update package.json to 4.0.0 - 5",
        ]
      `)
      expect(await showFileCommits(cwd, filePath)).toMatchInlineSnapshot(`
        [
          "Add package.json - 1",
          "Update package.json to 1.0.0 - 2",
          "Update package.json to 2.0.0 - 3",
          "Update package.json to 3.0.0 - 4",
          "Update package.json to 4.0.0 - 5",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'v3.0.0')

      expect(await showFileCommits(cwd, filePath, 1)).toMatchInlineSnapshot(`
        [
          "Add package.json - 1",
          "Update package.json to 1.0.0 - 2",
          "Update package.json to 2.0.0 - 3",
          "Update package.json to 3.0.0 - 4",
        ]
      `)
      expect(await showFileCommits(cwd, filePath)).toMatchInlineSnapshot(`
        [
          "Add package.json - 1",
          "Update package.json to 1.0.0 - 2",
          "Update package.json to 2.0.0 - 3",
          "Update package.json to 3.0.0 - 4",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'v2.0.0')

      expect(await showFileCommits(cwd, filePath, 1)).toMatchInlineSnapshot(`
        [
          "Add package.json - 1",
          "Update package.json to 1.0.0 - 2",
          "Update package.json to 2.0.0 - 3",
        ]
      `)
      expect(await showFileCommits(cwd, filePath)).toMatchInlineSnapshot(`
        [
          "Add package.json - 1",
          "Update package.json to 1.0.0 - 2",
          "Update package.json to 2.0.0 - 3",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'v1.0.0')

      expect(await showFileCommits(cwd, filePath, 1)).toMatchInlineSnapshot(`
        [
          "Add package.json - 1",
          "Update package.json to 1.0.0 - 2",
        ]
      `)
      expect(await showFileCommits(cwd, filePath)).toMatchInlineSnapshot(`
        [
          "Add package.json - 1",
          "Update package.json to 1.0.0 - 2",
        ]
      `)
    })
  })
}, 15_000)
