// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  generateReleaseReport,
  printReleaseReport,
  type ReleasePlan,
} from '@reelout/core'
import { expect, test, vi } from 'vitest'
import { context, logger } from '../../../../../test/mock/context'

test('outputs formatted release summary and changelogs when packages have scheduled releases', () => {
  using dryRun = vi.spyOn(context, 'dryRun', 'get')

  context.plans = [
    {
      package: {
        root: true,
        entry: true,
        location: '.',
        name: '',
        version: '3.0.0',
      },
      release: {
        type: 'major',
        version: '4.0.0',
        changelog: [
          '## 4.0.0',
          '',
          '### Breaking Changes',
          '',
          '- Require Node.js 24+',
          '',
        ].join('\n'),
      },
    },
    {
      package: { location: 'packages/foo', name: 'foo', version: '1.0.0' },
      release: {
        type: 'minor',
        version: '1.1.0',
        changelog: [
          '## 1.1.0',
          '',
          '### Features',
          '',
          '- Introduce new feature',
          '',
        ].join('\n'),
      },
    },
    {
      package: { location: 'packages/bar', name: '', version: '2.0.0' },
      release: {
        type: 'patch',
        version: '2.0.1',
        changelog: [
          '## 2.0.1',
          '',
          '### Bug Fixes',
          '',
          '- Fix critical bug',
          '',
        ].join('\n'),
      },
    },
    {
      package: { location: 'packages/baz', name: 'baz', version: '2.0.0' },
      release: {
        type: 'major',
        version: '3.0.0',
        changelog: [
          '## 3.0.0',
          '',
          '### Breaking Changes',
          '',
          '- Major update',
          '',
        ].join('\n'),
      },
    },
    {
      package: { entry: true, location: 'packages/qux', version: '1.0.0' },
      release: {
        type: 'minor',
        version: '1.1.0',
        changelog: [
          '## 1.1.0',
          '',
          '### Features',
          '',
          '- Introduce new feature',
          '',
        ].join('\n'),
      },
    },
  ] as ReleasePlan[]

  const report = generateReleaseReport(context)

  dryRun.mockReturnValue(true)
  printReleaseReport(context.logger, { ...report, status: 'success' })

  dryRun.mockReturnValue(false)
  printReleaseReport(context.logger, { ...report, status: 'success' })

  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m5 released[39m[22m [90m(0)[39m

    [41m 4.0.0 ← 3.0.0 [49m[90m major [39m

    [36m## 4.0.0[39m

    [36m### Breaking Changes[39m

    - Require Node.js 24+

    [90m ./packages/bar [39m[42m 2.0.1 ← 2.0.0 [49m[90m patch [39m

    [36m## 2.0.1[39m

    [36m### Bug Fixes[39m

    - Fix critical bug

    [42m 1.1.0 ← 1.0.0 [49m[90m minor [39m

    [36m## 1.1.0[39m

    [36m### Features[39m

    - Introduce new feature

    [44m baz [49m[41m 3.0.0 ← 2.0.0 [49m[90m major [39m

    [36m## 3.0.0[39m

    [36m### Breaking Changes[39m

    - Major update

    [44m foo [49m[42m 1.1.0 ← 1.0.0 [49m[90m minor [39m

    [36m## 1.1.0[39m

    [36m### Features[39m

    - Introduce new feature
    ",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [1m[32m5 released[39m[22m [90m(0)[39m

    [41m 4.0.0 ← 3.0.0 [49m[90m major [39m

    [36m## 4.0.0[39m

    [36m### Breaking Changes[39m

    - Require Node.js 24+

    [90m ./packages/bar [39m[42m 2.0.1 ← 2.0.0 [49m[90m patch [39m

    [36m## 2.0.1[39m

    [36m### Bug Fixes[39m

    - Fix critical bug

    [42m 1.1.0 ← 1.0.0 [49m[90m minor [39m

    [36m## 1.1.0[39m

    [36m### Features[39m

    - Introduce new feature

    [44m baz [49m[41m 3.0.0 ← 2.0.0 [49m[90m major [39m

    [36m## 3.0.0[39m

    [36m### Breaking Changes[39m

    - Major update

    [44m foo [49m[42m 1.1.0 ← 1.0.0 [49m[90m minor [39m

    [36m## 1.1.0[39m

    [36m### Features[39m

    - Introduce new feature
    ",
      ],
    ]
  `)
})

test('displays empty state message when no packages are scheduled for release', () => {
  using dryRun = vi.spyOn(context, 'dryRun', 'get')

  context.status = 'success'

  context.plans = [
    { package: { name: 'foo', version: '1.0.0' }, release: null },
    { package: { name: 'bar', version: '2.0.0' }, release: null },
  ] as ReleasePlan[]

  const report = generateReleaseReport(context)

  dryRun.mockReturnValue(true)
  printReleaseReport(context.logger, report)

  dryRun.mockReturnValue(false)
  printReleaseReport(context.logger, report)

  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [33mNo packages are scheduled for release.[39m",
      ],
      [
        "Status: [32mSUCCESS[39m",
      ],
      [
        "Release complete: [33mNo packages are scheduled for release.[39m",
      ],
    ]
  `)
})

test('logs error details when report status is failure', () => {
  context.plans = [] as ReleasePlan[]

  const report = generateReleaseReport(context)

  printReleaseReport(context.logger, {
    ...report,
    status: 'failure',
    error: 'Custom error reason',
  })

  printReleaseReport(context.logger, {
    ...report,
    status: 'failure',
    error: null,
  })

  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Status: [31mFAILURE[39m",
      ],
      [
        "Release complete: [31mCustom error reason[39m",
      ],
      [
        "Status: [31mFAILURE[39m",
      ],
      [
        "Release complete: [31mAn unexpected error occurred during the release process.[39m",
      ],
    ]
  `)
})

test('does not log status banner when status field is missing', () => {
  context.plans = [
    {
      package: { location: 'packages/foo', name: 'foo', version: '1.0.0' },
      release: {
        type: 'minor',
        version: '1.1.0',
        changelog: '## 1.1.0\n\n- Minor feature release',
      },
    },
  ] as ReleasePlan[]

  const report = generateReleaseReport(context)

  printReleaseReport(context.logger, { ...report, status: null })

  expect(logger.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "Release complete: [1m[32m1 released[39m[22m [90m(0)[39m

    [44m foo [49m[42m 1.1.0 ← 1.0.0 [49m[90m minor [39m

    [36m## 1.1.0[39m

    - Minor feature release
    ",
      ],
    ]
  `)
})
