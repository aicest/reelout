// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { GIT_TRAILER_RELEASE_AGENT } from '#config'
import { mergeGitHistory } from '#git'
import type { GitCommit, GitCommitType, ReleasePlan } from '#types'
import { version } from '../../../package.json'

const NOTABLE_TYPES: readonly GitCommitType[] = [
  'feat',
  'fix',
  'perf',
  'refactor',
  'revert',
]

/**
 * Generate a formatted release commit message based on release plans and
 * custom trailers.
 *
 * Compiles package version updates and included commit logs into a standardized
 * conventional commit message body, appending configured release agent and
 * custom trailers. Returns `null` if no valid release subject can be derived.
 *
 * @param cwd The working directory path
 * @param plans Readonly array of release plans containing package changes and commit history
 * @param trailers Optional record of custom git trailers to append to the commit
 * @returns The formatted release commit message string or `null` if the subject is empty
 * @example
 * ```
 * chore: release pkg-a@2.1.0, pkg-b@1.0.4
 *
 * Version Updates:
 * - pkg-a: 2.0.0 → 2.1.0
 * - pkg-b: 1.0.3 → 1.0.4
 *
 * Notable Changes:
 * - feat(pkg-a): support custom plugin entrypoints (#210)
 * - fix(pkg-b): correct minor typography bug in help text (#212)
 *
 * Release-Mode: Deferred
 * ```
 */
export async function generateReleaseCommitMessage(
  cwd: string,
  plans: readonly ReleasePlan[],
  trailers: Readonly<Record<string, string | number | null | undefined>> = {}
): Promise<string | null> {
  const standalone = plans.length === 1

  trailers = {
    [GIT_TRAILER_RELEASE_AGENT]: `ReelOut/${import.meta.env.MODE === 'test' ? '0.0.0' : /* istanbul ignore next */ version}`,
    ...trailers,
  }

  plans = plans
    .filter((plan) => plan.release?.tag?.name)
    .toSorted((a, b) => {
      if (a.package.entry) return -1
      if (b.package.entry) return 1
      /* istanbul ignore next */
      return (a.package.name ?? '').localeCompare(b.package.name ?? '')
    })

  let subject: string | null | undefined

  if (plans.length === 1) {
    subject = standalone
      ? plans[0]?.release?.version
      : plans[0]?.release?.tag?.name
  } else if (plans.length >= 2 && plans.length <= 3) {
    subject = plans.map((plan) => plan.release?.tag?.name).join(', ')
  } else if (plans.length > 3) {
    subject = `${plans.length} packages (${plans
      .slice(0, 2)
      .map((plan) => plan.release?.tag?.name)
      .join(', ')}, +${plans.length - 2} more)`
  }

  if (!subject) {
    return null
  }

  const packages = plans.map((plan) => {
    return `- ${plan.package.name || plan.package.location}: ${plan.package.version} → ${plan.release?.version}`
  })

  const commits = (
    await plans.reduce(
      async (acc, plan) => mergeGitHistory(cwd, await acc, plan.history),
      Promise.resolve<GitCommit[]>([])
    )
  )
    .filter((commit) => {
      const isNotableType = commit.type && NOTABLE_TYPES.includes(commit.type)
      const isBreaking = commit.notes.length > 0

      return isNotableType || isBreaking
    })
    .toReversed()
    .map(({ header }) => `- ${header}`)

  return [
    `chore: release ${subject}`,

    packages.length >= 2
      ? ['Version Updates:', ...packages].join('\n')
      : undefined,

    commits.length > 0
      ? ['Notable Changes:', ...commits].join('\n')
      : undefined,

    Object.entries(trailers)
      .map(([key, value]) => (key && value != null ? `${key}: ${value}` : ''))
      .filter(Boolean)
      .join('\n'),
  ]
    .filter(Boolean)
    .join('\n\n')
}
