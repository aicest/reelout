// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { Octokit } from '@octokit/rest'
import type { GitRepository } from '@reelout/core'

/**
 * Check if the target GitHub repository is public.
 *
 * Uses the Octokit REST API with the provided token to fetch the
 * visibility status of the specified repository.
 *
 * @param token GitHub authentication token
 * @param repository Target repository
 * @returns Promise that resolves to `true` if the repository is public
 */
export async function isRepositoryPublic(
  token: string,
  repository: GitRepository
): Promise<boolean> {
  /* istanbul ignore next */
  const octokit = new Octokit({
    auth: token,
    log: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
  })

  const { data } = await octokit.rest.repos.get({
    owner: repository.owner,
    repo: repository.repo,
  })

  return data.visibility === 'public'
}
