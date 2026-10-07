// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleasePlan } from '#types'
import { bumpVersion, promotePrereleaseVersions } from '@reelout/core'
import { expect, test } from 'vitest'

async function promote(plans: readonly ReleasePlan[]): Promise<ReleasePlan[]> {
  return (await promotePrereleaseVersions(plans)).map((plan) => {
    if (plan.release?.type && !plan.release.version) {
      plan.release.version = bumpVersion({
        version: plan.package.version,
        private: plan.package.private,
        release: plan.release.type,
        identifier: null,
      })
    }

    return plan
  })
}

test('preserves the plan unchanged if an explicit release type is already defined', async () => {
  const plans = await promote([
    {
      package: { version: '0.0.0-dev.0', tag: { name: 'v0.0.0-dev.0' } },
      release: { type: 'minor' },
    },
    {
      package: { version: '0.1.0', tag: { name: 'v0.1.0' } },
      release: { type: 'minor' },
    },
    {
      package: { version: '0.5.1', tag: { name: 'v0.5.1' } },
      release: { type: 'minor' },
    },
    {
      package: { version: '1.0.0-rc.3', tag: { name: 'v1.0.0-rc.3' } },
      release: { type: 'patch' },
    },
    {
      package: { version: '1.2.3-alpha.0', tag: { name: 'v1.2.3-alpha.0' } },
      release: { type: 'minor' },
    },
    {
      package: { version: '1.2.0-beta.1', tag: { name: 'v1.2.0-beta.1' } },
      release: { type: 'patch' },
    },
    {
      package: { version: '1.4.2', tag: { name: 'v1.4.2' } },
      release: { type: 'patch' },
    },
  ] as ReleasePlan[])

  expect(plans).toMatchInlineSnapshot(`
    [
      {
        "package": {
          "tag": {
            "name": "v0.0.0-dev.0",
          },
          "version": "0.0.0-dev.0",
        },
        "release": {
          "type": "minor",
          "version": "0.0.0",
        },
      },
      {
        "package": {
          "tag": {
            "name": "v0.1.0",
          },
          "version": "0.1.0",
        },
        "release": {
          "type": "minor",
          "version": "0.2.0",
        },
      },
      {
        "package": {
          "tag": {
            "name": "v0.5.1",
          },
          "version": "0.5.1",
        },
        "release": {
          "type": "minor",
          "version": "0.6.0",
        },
      },
      {
        "package": {
          "tag": {
            "name": "v1.0.0-rc.3",
          },
          "version": "1.0.0-rc.3",
        },
        "release": {
          "type": "patch",
          "version": "1.0.0",
        },
      },
      {
        "package": {
          "tag": {
            "name": "v1.2.3-alpha.0",
          },
          "version": "1.2.3-alpha.0",
        },
        "release": {
          "type": "minor",
          "version": "1.3.0",
        },
      },
      {
        "package": {
          "tag": {
            "name": "v1.2.0-beta.1",
          },
          "version": "1.2.0-beta.1",
        },
        "release": {
          "type": "patch",
          "version": "1.2.0",
        },
      },
      {
        "package": {
          "tag": {
            "name": "v1.4.2",
          },
          "version": "1.4.2",
        },
        "release": {
          "type": "patch",
          "version": "1.4.3",
        },
      },
    ]
  `)
})

test('skips plan evaluation entirely if the package has no tag context', async () => {
  const plans = await promote([
    {
      package: { version: '0.0.0-dev.0', tag: undefined },
    },
    {
      package: { version: '1.2.3-alpha.1', tag: null },
    },
  ] as ReleasePlan[])

  expect(plans).toMatchInlineSnapshot(`
    [
      {
        "package": {
          "tag": undefined,
          "version": "0.0.0-dev.0",
        },
      },
      {
        "package": {
          "tag": null,
          "version": "1.2.3-alpha.1",
        },
      },
    ]
  `)
})

test('skips plan evaluation entirely if the version string is semver invalid', async () => {
  const plans = await promote([
    {
      package: { version: '1.2', tag: { name: '1.2' } },
    },
    {
      package: { version: 'v1.0.0', tag: { name: 'v1.0.0' } },
    },
  ] as ReleasePlan[])

  expect(plans).toMatchInlineSnapshot(`
    [
      {
        "package": {
          "tag": {
            "name": "1.2",
          },
          "version": "1.2",
        },
      },
      {
        "package": {
          "tag": {
            "name": "v1.0.0",
          },
          "version": "v1.0.0",
        },
      },
    ]
  `)
})

test('promotes prerelease components based on their highest non-zero tier', async () => {
  const plans = await promote([
    {
      package: { version: '0.0.0-dev.0', tag: { name: 'v0.0.0-dev.0' } },
    },
    {
      package: { version: '0.2.0-beta.1', tag: { name: 'v0.2.0-beta.1' } },
    },
    {
      package: { version: '0.3.3-rc.3', tag: { name: 'v0.3.3-rc.3' } },
    },
    {
      package: { version: '1.0.0-rc.3', tag: { name: 'v1.0.0-rc.3' } },
    },
    {
      package: { version: '1.2.0-beta.1', tag: { name: 'v1.2.0-beta.1' } },
    },
    {
      package: { version: '1.2.3-alpha.0', tag: { name: 'v1.2.3-alpha.0' } },
    },
  ] as ReleasePlan[])

  expect(plans).toMatchInlineSnapshot(`
    [
      {
        "package": {
          "tag": {
            "name": "v0.0.0-dev.0",
          },
          "version": "0.0.0-dev.0",
        },
        "release": {
          "type": "major",
          "version": "0.0.0",
        },
      },
      {
        "package": {
          "tag": {
            "name": "v0.2.0-beta.1",
          },
          "version": "0.2.0-beta.1",
        },
        "release": {
          "type": "minor",
          "version": "0.2.0",
        },
      },
      {
        "package": {
          "tag": {
            "name": "v0.3.3-rc.3",
          },
          "version": "0.3.3-rc.3",
        },
        "release": {
          "type": "patch",
          "version": "0.3.3",
        },
      },
      {
        "package": {
          "tag": {
            "name": "v1.0.0-rc.3",
          },
          "version": "1.0.0-rc.3",
        },
        "release": {
          "type": "major",
          "version": "1.0.0",
        },
      },
      {
        "package": {
          "tag": {
            "name": "v1.2.0-beta.1",
          },
          "version": "1.2.0-beta.1",
        },
        "release": {
          "type": "minor",
          "version": "1.2.0",
        },
      },
      {
        "package": {
          "tag": {
            "name": "v1.2.3-alpha.0",
          },
          "version": "1.2.3-alpha.0",
        },
        "release": {
          "type": "patch",
          "version": "1.2.3",
        },
      },
    ]
  `)
})

test('promotes stable zero-major releases directly to a major graduation type', async () => {
  const plans = await promote([
    {
      package: { version: '0.1.0', tag: { name: 'v0.1.0' } },
    },
    {
      package: { version: '0.5.1', tag: { name: 'v0.5.1' } },
    },
  ] as ReleasePlan[])

  expect(plans).toMatchInlineSnapshot(`
    [
      {
        "package": {
          "tag": {
            "name": "v0.1.0",
          },
          "version": "0.1.0",
        },
        "release": {
          "type": "major",
          "version": "1.0.0",
        },
      },
      {
        "package": {
          "tag": {
            "name": "v0.5.1",
          },
          "version": "0.5.1",
        },
        "release": {
          "type": "major",
          "version": "1.0.0",
        },
      },
    ]
  `)
})

test('leaves stable non-zero versions intact when they have no explicit release plan', async () => {
  const plans = await promote([
    {
      package: { version: '1.4.2', tag: { name: 'v1.4.2' } },
    },
    {
      package: { version: '3.5.2', tag: { name: 'v3.5.2' } },
    },
  ] as ReleasePlan[])

  expect(plans).toMatchInlineSnapshot(`
    [
      {
        "package": {
          "tag": {
            "name": "v1.4.2",
          },
          "version": "1.4.2",
        },
      },
      {
        "package": {
          "tag": {
            "name": "v3.5.2",
          },
          "version": "3.5.2",
        },
      },
    ]
  `)
})
