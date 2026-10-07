// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleasePlan } from '@reelout/core'
import { bumpVersion, deriveTransitionReleases } from '@reelout/core'
import { expect, test } from 'vitest'

function getBumpedVersions(
  ...args: Parameters<typeof deriveTransitionReleases>
) {
  return deriveTransitionReleases(...args).map((plan) => ({
    from: plan.package.version,
    to: bumpVersion({
      version: plan.package.version,
      private: plan.package.private,
      release: plan.release?.type,
      transition: plan.release?.transition,
      identifier: args[1],
    }),
    type: plan.release?.type,
    transition: plan.release?.transition,
  }))
}

const plans = Object.freeze([
  { package: { version: '0.0.0' }, release: null },
  { package: { version: '0.1.2-alpha.1' }, release: null },
  { package: { version: '0.1.2' }, release: null },
  { package: { version: '1.0.0-alpha.5' }, release: null },
  { package: { version: '1.0.0' }, release: null },
  { package: { version: '1.0.3-alpha.2' }, release: null },
  { package: { version: '1.0.3' }, release: null },
  { package: { version: '1.4.0-alpha.8' }, release: null },
  { package: { version: '1.4.0' }, release: null },
] as ReleasePlan[])

test('derives major transition releases when release hint is major and target prerelease tag is undefined', () => {
  expect(getBumpedVersions('major', undefined, plans)).toMatchInlineSnapshot(`
    [
      {
        "from": "0.0.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "0.1.2-alpha.1",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "0.1.2",
        "to": "1.0.0",
        "transition": "advance",
        "type": "major",
      },
      {
        "from": "1.0.0-alpha.5",
        "to": "1.0.0",
        "transition": "continue",
        "type": "major",
      },
      {
        "from": "1.0.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.3-alpha.2",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.3",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.4.0-alpha.8",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.4.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
    ]
  `)
})

test('derives minor transition releases when release hint is minor and target prerelease tag is undefined', () => {
  expect(getBumpedVersions('minor', undefined, plans)).toMatchInlineSnapshot(`
    [
      {
        "from": "0.0.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "0.1.2-alpha.1",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "0.1.2",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.0-alpha.5",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.3-alpha.2",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.3",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.4.0-alpha.8",
        "to": "1.4.0",
        "transition": "continue",
        "type": "minor",
      },
      {
        "from": "1.4.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
    ]
  `)
})

test('derives patch transition releases when release hint is patch and target prerelease tag is undefined', () => {
  expect(getBumpedVersions('patch', undefined, plans)).toMatchInlineSnapshot(`
    [
      {
        "from": "0.0.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "0.1.2-alpha.1",
        "to": "0.1.2",
        "transition": "continue",
        "type": "patch",
      },
      {
        "from": "0.1.2",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.0-alpha.5",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.3-alpha.2",
        "to": "1.0.3",
        "transition": "continue",
        "type": "patch",
      },
      {
        "from": "1.0.3",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.4.0-alpha.8",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.4.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
    ]
  `)
})

test('infers transition releases automatically when release hint is auto and target prerelease tag is undefined', () => {
  expect(getBumpedVersions('auto', undefined, plans)).toMatchInlineSnapshot(`
    [
      {
        "from": "0.0.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "0.1.2-alpha.1",
        "to": "0.1.2",
        "transition": "continue",
        "type": "patch",
      },
      {
        "from": "0.1.2",
        "to": "1.0.0",
        "transition": "advance",
        "type": "major",
      },
      {
        "from": "1.0.0-alpha.5",
        "to": "1.0.0",
        "transition": "continue",
        "type": "major",
      },
      {
        "from": "1.0.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.3-alpha.2",
        "to": "1.0.3",
        "transition": "continue",
        "type": "patch",
      },
      {
        "from": "1.0.3",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.4.0-alpha.8",
        "to": "1.4.0",
        "transition": "continue",
        "type": "minor",
      },
      {
        "from": "1.4.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
    ]
  `)
})

test('derives major transition releases when target prerelease tag matches existing tag', () => {
  expect(getBumpedVersions('major', 'alpha', plans)).toMatchInlineSnapshot(`
    [
      {
        "from": "0.0.0",
        "to": "1.0.0-alpha.0",
        "transition": "advance",
        "type": "major",
      },
      {
        "from": "0.1.2-alpha.1",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "0.1.2",
        "to": "1.0.0-alpha.0",
        "transition": "advance",
        "type": "major",
      },
      {
        "from": "1.0.0-alpha.5",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.0",
        "to": "2.0.0-alpha.0",
        "transition": "advance",
        "type": "major",
      },
      {
        "from": "1.0.3-alpha.2",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.3",
        "to": "2.0.0-alpha.0",
        "transition": "advance",
        "type": "major",
      },
      {
        "from": "1.4.0-alpha.8",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.4.0",
        "to": "2.0.0-alpha.0",
        "transition": "advance",
        "type": "major",
      },
    ]
  `)
})

test('derives minor transition releases when target prerelease tag matches existing tag', () => {
  expect(getBumpedVersions('minor', 'alpha', plans)).toMatchInlineSnapshot(`
    [
      {
        "from": "0.0.0",
        "to": "0.1.0-alpha.0",
        "transition": "advance",
        "type": "minor",
      },
      {
        "from": "0.1.2-alpha.1",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "0.1.2",
        "to": "0.2.0-alpha.0",
        "transition": "advance",
        "type": "minor",
      },
      {
        "from": "1.0.0-alpha.5",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.0",
        "to": "1.1.0-alpha.0",
        "transition": "advance",
        "type": "minor",
      },
      {
        "from": "1.0.3-alpha.2",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.3",
        "to": "1.1.0-alpha.0",
        "transition": "advance",
        "type": "minor",
      },
      {
        "from": "1.4.0-alpha.8",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.4.0",
        "to": "1.5.0-alpha.0",
        "transition": "advance",
        "type": "minor",
      },
    ]
  `)
})

test('derives patch transition releases when target prerelease tag matches existing tag', () => {
  expect(getBumpedVersions('patch', 'alpha', plans)).toMatchInlineSnapshot(`
    [
      {
        "from": "0.0.0",
        "to": "0.0.1-alpha.0",
        "transition": "advance",
        "type": "patch",
      },
      {
        "from": "0.1.2-alpha.1",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "0.1.2",
        "to": "0.1.3-alpha.0",
        "transition": "advance",
        "type": "patch",
      },
      {
        "from": "1.0.0-alpha.5",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.0",
        "to": "1.0.1-alpha.0",
        "transition": "advance",
        "type": "patch",
      },
      {
        "from": "1.0.3-alpha.2",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.3",
        "to": "1.0.4-alpha.0",
        "transition": "advance",
        "type": "patch",
      },
      {
        "from": "1.4.0-alpha.8",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.4.0",
        "to": "1.4.1-alpha.0",
        "transition": "advance",
        "type": "patch",
      },
    ]
  `)
})

test('infers transition releases automatically when release hint is auto and target prerelease tag matches existing tag', () => {
  expect(getBumpedVersions('auto', 'alpha', plans)).toMatchInlineSnapshot(`
    [
      {
        "from": "0.0.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "0.1.2-alpha.1",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "0.1.2",
        "to": "1.0.0-alpha.0",
        "transition": "advance",
        "type": "major",
      },
      {
        "from": "1.0.0-alpha.5",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.3-alpha.2",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.3",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.4.0-alpha.8",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.4.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
    ]
  `)
})

test('derives major transition releases when target prerelease tag differs from existing tag', () => {
  expect(getBumpedVersions('major', 'beta', plans)).toMatchInlineSnapshot(`
    [
      {
        "from": "0.0.0",
        "to": "1.0.0-beta.0",
        "transition": "advance",
        "type": "major",
      },
      {
        "from": "0.1.2-alpha.1",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "0.1.2",
        "to": "1.0.0-beta.0",
        "transition": "advance",
        "type": "major",
      },
      {
        "from": "1.0.0-alpha.5",
        "to": "1.0.0-beta.0",
        "transition": "continue",
        "type": "major",
      },
      {
        "from": "1.0.0",
        "to": "2.0.0-beta.0",
        "transition": "advance",
        "type": "major",
      },
      {
        "from": "1.0.3-alpha.2",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.3",
        "to": "2.0.0-beta.0",
        "transition": "advance",
        "type": "major",
      },
      {
        "from": "1.4.0-alpha.8",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.4.0",
        "to": "2.0.0-beta.0",
        "transition": "advance",
        "type": "major",
      },
    ]
  `)
})

test('derives minor transition releases when target prerelease tag differs from existing tag', () => {
  expect(getBumpedVersions('minor', 'beta', plans)).toMatchInlineSnapshot(`
    [
      {
        "from": "0.0.0",
        "to": "0.1.0-beta.0",
        "transition": "advance",
        "type": "minor",
      },
      {
        "from": "0.1.2-alpha.1",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "0.1.2",
        "to": "0.2.0-beta.0",
        "transition": "advance",
        "type": "minor",
      },
      {
        "from": "1.0.0-alpha.5",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.0",
        "to": "1.1.0-beta.0",
        "transition": "advance",
        "type": "minor",
      },
      {
        "from": "1.0.3-alpha.2",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.3",
        "to": "1.1.0-beta.0",
        "transition": "advance",
        "type": "minor",
      },
      {
        "from": "1.4.0-alpha.8",
        "to": "1.4.0-beta.0",
        "transition": "continue",
        "type": "minor",
      },
      {
        "from": "1.4.0",
        "to": "1.5.0-beta.0",
        "transition": "advance",
        "type": "minor",
      },
    ]
  `)
})

test('derives patch transition releases when target prerelease tag differs from existing tag', () => {
  expect(getBumpedVersions('patch', 'beta', plans)).toMatchInlineSnapshot(`
    [
      {
        "from": "0.0.0",
        "to": "0.0.1-beta.0",
        "transition": "advance",
        "type": "patch",
      },
      {
        "from": "0.1.2-alpha.1",
        "to": "0.1.2-beta.0",
        "transition": "continue",
        "type": "patch",
      },
      {
        "from": "0.1.2",
        "to": "0.1.3-beta.0",
        "transition": "advance",
        "type": "patch",
      },
      {
        "from": "1.0.0-alpha.5",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.0",
        "to": "1.0.1-beta.0",
        "transition": "advance",
        "type": "patch",
      },
      {
        "from": "1.0.3-alpha.2",
        "to": "1.0.3-beta.0",
        "transition": "continue",
        "type": "patch",
      },
      {
        "from": "1.0.3",
        "to": "1.0.4-beta.0",
        "transition": "advance",
        "type": "patch",
      },
      {
        "from": "1.4.0-alpha.8",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.4.0",
        "to": "1.4.1-beta.0",
        "transition": "advance",
        "type": "patch",
      },
    ]
  `)
})

test('infers transition releases automatically when release hint is auto and target prerelease tag differs from existing tag', () => {
  expect(getBumpedVersions('auto', 'beta', plans)).toMatchInlineSnapshot(`
    [
      {
        "from": "0.0.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "0.1.2-alpha.1",
        "to": "0.1.2-beta.0",
        "transition": "continue",
        "type": "patch",
      },
      {
        "from": "0.1.2",
        "to": "1.0.0-beta.0",
        "transition": "advance",
        "type": "major",
      },
      {
        "from": "1.0.0-alpha.5",
        "to": "1.0.0-beta.0",
        "transition": "continue",
        "type": "major",
      },
      {
        "from": "1.0.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.0.3-alpha.2",
        "to": "1.0.3-beta.0",
        "transition": "continue",
        "type": "patch",
      },
      {
        "from": "1.0.3",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
      {
        "from": "1.4.0-alpha.8",
        "to": "1.4.0-beta.0",
        "transition": "continue",
        "type": "minor",
      },
      {
        "from": "1.4.0",
        "to": null,
        "transition": undefined,
        "type": undefined,
      },
    ]
  `)
})

test('preserves existing release plans when release is already assigned', () => {
  const plans = [
    { package: { version: '1.0.0' }, release: { type: 'minor' } },
  ] as ReleasePlan[]

  expect(deriveTransitionReleases('major', 'dev', plans)).toEqual([
    expect.objectContaining({ release: { type: 'minor' } }),
  ])
})

test('strips trailing numeric counter when comparing multi-segment prerelease tags', () => {
  const plans = [
    { package: { version: '1.0.0-rc.experimental.105' }, release: null },
  ] as ReleasePlan[]

  expect(deriveTransitionReleases('major', 'rc.experimental', plans)).toEqual([
    expect.objectContaining({ release: null }),
  ])

  expect(deriveTransitionReleases('major', 'rc', plans)).toMatchInlineSnapshot(`
    [
      {
        "package": {
          "version": "1.0.0-rc.experimental.105",
        },
        "release": {
          "transition": "continue",
          "type": "major",
        },
      },
    ]
  `)
})

test('compares non-numeric prerelease tags as single-segment qualifiers', () => {
  const plans = [
    { package: { version: '1.0.0-dev' }, release: null },
  ] as ReleasePlan[]

  expect(deriveTransitionReleases('major', 'dev', plans)).toEqual([
    expect.objectContaining({ release: null }),
  ])

  expect(deriveTransitionReleases('major', 'rc', plans)).toMatchInlineSnapshot(`
    [
      {
        "package": {
          "version": "1.0.0-dev",
        },
        "release": {
          "transition": "continue",
          "type": "major",
        },
      },
    ]
  `)
})

test('evaluates numeric-only prerelease tags against empty qualifier context', () => {
  const plans = [
    { package: { version: '1.0.0-1' }, release: null },
  ] as ReleasePlan[]

  expect(deriveTransitionReleases('major', '', plans)).toEqual([
    expect.objectContaining({ release: null }),
  ])

  expect(deriveTransitionReleases('major', 'rc', plans)).toMatchInlineSnapshot(`
    [
      {
        "package": {
          "version": "1.0.0-1",
        },
        "release": {
          "transition": "continue",
          "type": "major",
        },
      },
    ]
  `)
})

test('returns unmodified plan when version string is missing or invalid', () => {
  const plans = [
    { package: { version: 'invalid' }, release: null },
    { package: { version: null }, release: null },
    { package: {}, release: null },
  ] as ReleasePlan[]

  expect(deriveTransitionReleases('major', 'alpha', plans)).toEqual([
    expect.objectContaining({ release: null }),
    expect.objectContaining({ release: null }),
    expect.objectContaining({ release: null }),
  ])
})
