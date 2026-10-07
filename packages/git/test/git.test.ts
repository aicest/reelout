// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  execGit,
  executeReleaseWorkflow,
  getGitConfigValue,
  pushGitChanges,
  type GitCommit,
  type ReleasePlan,
} from '@reelout/core'
import plugin from '@reelout/git'
import { writePackageJson } from '@reelout/npm'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { beforeEach, expect, test, vi } from 'vitest'
import { context, logger, repository } from '../../../test/mock/context'
import {
  cloneGitRepository,
  getGitCommitSubjects,
  getGitTags,
  initializeGitRepository,
} from '../../../test/mock/git'

vi.mock(
  import('@reelout/core/git/repository/pushGitChanges'),
  async (importActual) => ({
    pushGitChanges: vi.fn((await importActual()).pushGitChanges),
  })
)

beforeEach(() => {
  vi.resetAllMocks()
})

test('preserves existing git history depth without full history restoration', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])

      await pushGitChanges(cwd, 'main')
    })

    await temporaryDirectoryTask(async (cwd) => {
      using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)

      await cloneGitRepository(cwd, remote)

      expect(await getGitCommitSubjects(cwd)).toEqual(['Third commit'])

      context.repository = repository

      await executeReleaseWorkflow(context, [plugin()])

      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Third commit",
        ]
      `)
    })
  })
})

test('configures git user identity and creates release commit', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)

      await initializeGitRepository(cwd, remote, undefined, false)
      expect(await getGitConfigValue(cwd, 'user.name')).toBeUndefined()
      expect(await getGitConfigValue(cwd, 'user.email')).toBeUndefined()

      await writePackageJson(cwd, { version: '1.0.0' })

      context.repository = repository

      context.plans = [
        {
          package: { entry: true, location: '.', name: undefined },
          history: [] as GitCommit[],
          release: { version: '1.0.0', tag: { name: 'v1.0.0' } },
        },
      ] as ReleasePlan[]

      await executeReleaseWorkflow(context, [plugin()])

      expect(await getGitConfigValue(cwd, 'user.name')).toBeUndefined()
      expect(await getGitConfigValue(cwd, 'user.email')).toBeUndefined()
      expect(
        await execGit(cwd, [
          'log',
          '-1',
          '--format="Hash: %H%nAuthor: %an <%ae>%nDate: %ad%nMessage: %s"',
        ])
      ).toMatchInlineSnapshot(`
        ""Hash: 44dc08ef9a1b638263da6f8be19de487ddd832f5
        Author: Test User <test@example.com>
        Date: Thu Jan 1 00:00:03 2026 +0000
        Message: chore: release 1.0.0"
        "
      `)
    })
  })
})

test('skips creating release commit during dry-run mode', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)
    using _dryRun = vi.spyOn(context, 'dryRun', 'get').mockReturnValue(true)

    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })

    context.repository = repository

    context.plans = [
      {
        package: { entry: true },
        release: { tag: { name: 'v1.0.0' } },
      },
    ] as ReleasePlan[]

    await executeReleaseWorkflow(context, [plugin()])

    await expect(execGit(cwd, ['log', '-1', '--pretty=%s'])).rejects.toThrow(
      "your current branch 'main' does not have any commits yet"
    )
  })
})

test('fails workflow execution when git remote is not configured', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)

    await initializeGitRepository(cwd)

    await writePackageJson(path.join(cwd, 'foo'), { version: '1.0.0' })
    await writePackageJson(path.join(cwd, 'bar'), { version: '2.0.0' })

    context.repository = null

    context.plans = [
      {
        package: { entry: true },
        history: [] as GitCommit[],
        release: null,
      },
      {
        package: {},
        history: [] as GitCommit[],
        release: { tag: { name: 'foo@1.0.0' } },
      },
      {
        package: {},
        history: [] as GitCommit[],
        release: { tag: { name: 'bar@2.0.0' } },
      },
      {
        package: {},
        history: [] as GitCommit[],
        release: { tag: { name: 'baz@3.0.0', message: 'baz@3.0.0' } },
      },
    ] as ReleasePlan[]

    await expect(
      executeReleaseWorkflow(context, [plugin()])
    ).rejects.toMatchInlineSnapshot(
      `[Error: A Git remote must be configured to push tags.]`
    )

    expect(await getGitTags(cwd)).toEqual([])
    expect(logger.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "Status: [31mFAILURE[39m",
        ],
        [
          "Release complete: [31mA Git remote must be configured to push tags.[39m",
        ],
      ]
    `)
  })
})

test('skips user identity configuration and release commit creation during dry-run mode', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)
      using _dryRun = vi.spyOn(context, 'dryRun', 'get').mockReturnValue(true)

      await initializeGitRepository(cwd, remote, undefined, false)

      await writePackageJson(path.join(cwd, 'foo'), { version: '1.0.0' })
      await writePackageJson(path.join(cwd, 'bar'), { version: '2.0.0' })

      context.repository = repository

      context.plans = [
        { package: { entry: true }, release: null },
        { package: {}, release: { tag: { name: 'foo@1.0.0' } } },
        { package: {}, release: { tag: { name: 'bar@2.0.0' } } },
      ] as ReleasePlan[]

      await executeReleaseWorkflow(context, [plugin()])

      expect(await getGitConfigValue(cwd, 'user.name')).toBeUndefined()
      expect(await getGitConfigValue(cwd, 'user.email')).toBeUndefined()
      await expect(getGitCommitSubjects(cwd)).rejects.toMatchInlineSnapshot(`
        [Error: Command 'git log --pretty=format:%s' failed (exit code 128)
        fatal: your current branch 'main' does not have any commits yet]
      `)
      await expect(getGitCommitSubjects(remote)).rejects.toMatchInlineSnapshot(`
        [Error: Command 'git log --pretty=format:%s' failed (exit code 128)
        fatal: your current branch 'main' does not have any commits yet]
      `)
    })
  })
})

test('skips tag creation and pushing during dry-run mode', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)
      using _dryRun = vi.spyOn(context, 'dryRun', 'get').mockReturnValue(true)

      await initializeGitRepository(cwd, remote)

      await writePackageJson(path.join(cwd, 'foo'), { version: '1.0.0' })
      await writePackageJson(path.join(cwd, 'bar'), { version: '2.0.0' })

      context.repository = repository

      context.plans = [
        { package: { entry: true }, release: null },
        { package: {}, release: { tag: { name: 'foo@1.0.0' } } },
        { package: {}, release: { tag: { name: 'bar@2.0.0' } } },
      ] as ReleasePlan[]

      await executeReleaseWorkflow(context, [plugin()])

      expect(await getGitTags(cwd)).toEqual([])

      expect(await getGitTags(remote)).toEqual([])
    })
  })
})

test('creates local git tags and pushes them to remote repository', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)

      await initializeGitRepository(cwd, remote)

      await writePackageJson(path.join(cwd, 'foo'), { version: '1.0.0' })
      await writePackageJson(path.join(cwd, 'bar'), { version: '2.0.0' })

      context.repository = repository

      context.plans = [
        {
          package: { entry: true, location: '.', name: undefined },
          history: [] as GitCommit[],
          release: null,
        },
        {
          package: { location: 'foo', name: 'foo' },
          history: [] as GitCommit[],
          release: { version: '1.0.0', tag: { name: 'foo@1.0.0' } },
        },
        {
          package: { location: 'bar', name: 'bar' },
          history: [] as GitCommit[],
          release: { version: '2.0.0', tag: { name: 'bar@2.0.0' } },
        },
      ] as ReleasePlan[]

      await executeReleaseWorkflow(context, [plugin()])

      expect(await getGitTags(cwd)).toEqual(['bar@2.0.0', 'foo@1.0.0'])

      expect(await getGitTags(remote)).toEqual(['bar@2.0.0', 'foo@1.0.0'])
    })
  })
})

test('removes local tags when pushing to remote repository fails', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)

      vi.mocked(pushGitChanges).mockImplementation(async () => {
        expect(await getGitTags(cwd)).toEqual(['bar@2.0.0', 'foo@1.0.0'])

        expect(await getGitTags(remote)).toEqual([])

        throw new Error('Failed to push Git tags')
      })

      await initializeGitRepository(cwd, remote)

      await writePackageJson(path.join(cwd, 'foo'), { version: '1.0.0' })
      await writePackageJson(path.join(cwd, 'bar'), { version: '2.0.0' })

      context.repository = repository

      context.plans = [
        {
          package: { entry: true, location: '.', name: undefined },
          history: [] as GitCommit[],
          release: null,
        },
        {
          package: { location: 'foo', name: 'foo' },
          history: [] as GitCommit[],
          release: { version: '1.0.0', tag: { name: 'foo@1.0.0' } },
        },
        {
          package: { location: 'bar', name: 'bar' },
          history: [] as GitCommit[],
          release: { version: '2.0.0', tag: { name: 'bar@2.0.0' } },
        },
      ] as ReleasePlan[]

      await expect(executeReleaseWorkflow(context, [plugin()])).rejects.toThrow(
        'Failed to push Git tags'
      )

      expect(await getGitTags(cwd)).toEqual([])

      expect(await getGitTags(remote)).toEqual([])
    })
  })
})

test('rolls back local and remote tags when a subsequent plugin fails', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)

      await initializeGitRepository(cwd, remote)

      await writePackageJson(path.join(cwd, 'foo'), { version: '1.0.0' })
      await writePackageJson(path.join(cwd, 'bar'), { version: '2.0.0' })

      context.repository = repository

      context.plans = [
        {
          package: { location: 'foo', name: 'foo' },
          history: [] as GitCommit[],
          release: { version: '1.0.0', tag: { name: 'foo@1.0.0' } },
        },
        {
          package: { location: 'bar', name: 'bar' },
          history: [] as GitCommit[],
          release: { version: '2.0.0', tag: { name: 'bar@2.0.0' } },
        },
      ] as ReleasePlan[]

      const plugins = [
        plugin(),
        {
          name: 'test',
          version: '1.0.0',
          publish: async () => {
            expect(await getGitTags(cwd)).toEqual(['bar@2.0.0', 'foo@1.0.0'])

            expect(await getGitTags(remote)).toEqual(['bar@2.0.0', 'foo@1.0.0'])

            throw new Error('Something went wrong')
          },
        },
      ]

      await expect(executeReleaseWorkflow(context, plugins)).rejects.toThrow(
        'Something went wrong'
      )

      expect(await getGitTags(cwd)).toEqual([])

      expect(await getGitTags(remote)).toEqual([])
    })
  })
})

test('skips tag creation when no release plans specify a tag', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      using _ = vi.spyOn(context, 'cwd', 'get').mockReturnValue(cwd)

      await initializeGitRepository(cwd, remote)

      context.repository = repository

      context.plans = [
        { package: { entry: true }, release: null },
        { package: { entry: false }, release: null },
      ] as ReleasePlan[]

      await executeReleaseWorkflow(context, [plugin()])

      expect(await getGitTags(cwd)).toEqual([])

      expect(await getGitTags(remote)).toEqual([])
    })
  })
})
