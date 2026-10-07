// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { RootContent } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import semver from 'semver'
import { extractPlainText } from './extractPlainText'
import { extractSemVer } from './extractSemVer'

const SENTENCE_TERMINAL_REGEX = /\p{Sentence_Terminal}$/u

/**
 * Iterate over Semantic Version strings extracted from a Markdown changelog.
 *
 * Parses `changelogContent` into an AST and evaluates nodes sequentially using
 * custom extractors. Evaluates heading nodes first before checking short
 * paragraph nodes. Stops execution after the first strategy yields valid
 * versions.
 *
 * @param changelogContent Raw Markdown text of the changelog
 * @yields Valid SemVer strings found in headings or candidate paragraphs
 */
export function* iterateChangelogVersions(
  changelogContent: string
): Generator<string> {
  const root = fromMarkdown(changelogContent)

  const nodeExtractors = [
    (node: RootContent): string | null => {
      return node.type === 'heading' ? extractPlainText(node) : null
    },

    (node: RootContent): string | null => {
      if (node.type !== 'paragraph') return null

      const paragraphText = extractPlainText(node)

      if (
        !paragraphText ||
        paragraphText.length > 48 ||
        SENTENCE_TERMINAL_REGEX.test(paragraphText)
      ) {
        return null
      }

      return paragraphText
    },
  ]

  for (const extractText of nodeExtractors) {
    let isVersionFound = false

    for (const node of root.children) {
      const extractedText = extractText(node)

      const candidateVersion = extractedText
        ? semver.sort(extractSemVer(extractedText)).pop()
        : null

      if (candidateVersion && semver.valid(candidateVersion)) {
        isVersionFound = true
        yield candidateVersion
      }
    }

    if (isVersionFound) {
      return
    }
  }
}
