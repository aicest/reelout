// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { Octokit } from '@octokit/rest'
import type { GitRepository, ReleaseContext, ReleasePlan } from '@reelout/core'

/**
 * Create a GitHub release for a package tag.
 *
 * Skips creation when the tag has no message. Uses the Octokit REST API
 * with the provided token to create the release.
 *
 * @param context Release context containing commit and prerelease information
 * @param plan Release plan containing the tag to publish
 * @param token GitHub authentication token
 * @param repository Target repository
 * @returns Promise that resolves when the release is created
 */
export async function createRelease(
  context: ReleaseContext,
  plan: ReleasePlan,
  token: string,
  repository: GitRepository
): Promise<void> {
  if (!plan.release?.tag?.message) {
    return
  }

  /* istanbul ignore next */
  const octokit = new Octokit({
    auth: token,
    log: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
  })

  await octokit.rest.repos.createRelease({
    owner: repository.owner,
    repo: repository.repo,
    tag_name: plan.release.tag.name,
    target_commitish: context.commit.hash,
    name: plan.release.tag.name,
    body: plan.release.tag.message,
    draft: false,
    prerelease: Boolean(context.versionQualifier),
  })
}
