// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { DEFAULT_CHANGELOG_FILE } from '#config'
import type { GitCommit, ReleaseContext } from '#types'
import { formatFile } from '#util'
import type { Heading, RootContent } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import path from 'node:path'
import { buildChangelog } from './buildChangelog'

/**
 * Build release notes from a release context and commit history.
 *
 * Generates changelog content from commits, parses it into an abstract syntax
 * tree, shifts heading depths, and formats the resulting markdown file.
 *
 * @param context The release context containing repository and configuration details
 * @param history The iterable or async iterable collection of commits to process
 * @returns The formatted release notes as a markdown string
 */
export async function buildReleaseNotes(
  context: ReleaseContext,
  history: Iterable<GitCommit> | AsyncIterable<GitCommit>
): Promise<string> {
  const changelogContent = await buildChangelog(context, history)

  const root = fromMarkdown(changelogContent)

  root.children = root.children.flatMap<RootContent>((node) => {
    if (node.type === 'heading') {
      /* istanbul ignore next */
      if (node.depth <= 2) {
        return []
      }

      node = {
        ...node,
        depth: (node.depth - 1) as Heading['depth'],
      }
    }

    return node
  })

  const filePath = path.join(context.cwd, DEFAULT_CHANGELOG_FILE)

  return formatFile(filePath, toMarkdown(root))
}
