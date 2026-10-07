// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { Gitlab } from '@gitbeaker/rest'
import type { GitRepository, ReleasePlan } from '@reelout/core'

/**
 * Delete a GitLab release associated with a package tag.
 *
 * Skips deletion if the plan does not contain a valid tag name. Resolves gracefully
 * if the release does not exist on GitLab (e.g., 404 status).
 *
 * @param plan Release plan containing the tag associated with the release to delete
 * @param token GitLab authentication token
 * @param repository Target repository
 * @returns Promise that resolves when the release is deleted
 */
export async function deleteRelease(
  plan: ReleasePlan,
  token: string,
  repository: GitRepository
): Promise<void> {
  if (!plan.release?.tag?.name) {
    return
  }

  try {
    const api = new Gitlab({ token })

    const projectId = encodeURIComponent(
      `${repository.owner}/${repository.repo}`
    )

    await api.ProjectReleases.remove(projectId, plan.release.tag.name)
  } catch (err) {
    const status = (err as { cause?: { response?: { status?: number } } })
      ?.cause?.response?.status

    if (status === 404) {
      return
    }

    throw err
  }
}
