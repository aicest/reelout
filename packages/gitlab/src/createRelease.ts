// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { Gitlab } from '@gitbeaker/rest'
import type { GitRepository, ReleaseContext, ReleasePlan } from '@reelout/core'

/**
 * Create a GitLab release for a package tag.
 *
 * Skips creation when the tag has no message. Uses the GitBeaker REST API
 * with the provided token to create the release.
 *
 * @param context Release context containing commit and prerelease information
 * @param plan Release plan containing the tag to publish
 * @param token GitLab authentication token
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

  const api = new Gitlab({ token })

  const projectId = encodeURIComponent(`${repository.owner}/${repository.repo}`)

  await api.ProjectReleases.create(projectId, {
    name: plan.release.tag.name,
    tag_name: plan.release.tag.name,
    description: plan.release.tag.message,
    ref: context.commit.hash,
  })
}
