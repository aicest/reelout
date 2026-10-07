// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { formatFile } from '#util'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import fs from 'node:fs/promises'

const defaultChangelogTitle = 'Changelog'

/**
 * Prepend changelog content to a markdown file, creating it if necessary.
 *
 * Reads the existing file if present, prepends the new content before the main heading,
 * formats and writes the result back.
 *
 * @param filePath Path to the changelog file
 * @param revision Changelog content to prepend
 * @returns Promise that resolves when the changelog is written
 */
export async function prependChangelog(
  filePath: string,
  revision: string
): Promise<void> {
  let content = ''

  try {
    content = await fs.readFile(filePath, 'utf-8')
  } catch (err) {
    /* istanbul ignore next */
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
  }

  const root = fromMarkdown(content)

  let index = root.children.findIndex(
    (node) => node.type === 'heading' && node.depth === 1
  )

  if (index === -1) {
    index = 0

    root.children.unshift({
      type: 'heading',
      depth: 1,
      children: [{ type: 'text', value: defaultChangelogTitle }],
    })
  }

  root.children.splice(index + 1, 0, ...fromMarkdown(revision).children)

  content = toMarkdown(root)

  content = await formatFile(filePath, content)

  await fs.writeFile(filePath, content)
}
