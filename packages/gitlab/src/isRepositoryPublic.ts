// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { Gitlab } from '@gitbeaker/rest'
import type { GitRepository } from '@reelout/core'

/**
 * Check if the target GitLab repository is public.
 *
 * Uses the GitBeaker REST API with the provided token to fetch the
 * visibility status of the specified repository.
 *
 * @param token GitLab authentication token
 * @param repository Target repository
 * @returns Promise that resolves to `true` if the repository is public
 */
export async function isRepositoryPublic(
  token: string,
  repository: GitRepository
): Promise<boolean> {
  const api = new Gitlab({ token })

  const projectId = encodeURIComponent(`${repository.owner}/${repository.repo}`)

  const project = await api.Projects.show(projectId)

  return project.visibility === 'public'
}
