// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { Heading, Paragraph, PhrasingContent } from 'mdast'

/**
 * Extract trimmed plain text from a Heading, Paragraph, or PhrasingContent node.
 *
 * Performs a depth-first traversal, concatenating string `value` tokens in
 * document order. Non-string values are ignored. Returns `null` for empty or
 * missing input.
 *
 * @param node Node to extract text from
 * @returns The trimmed plain-text string, or null if empty
 */
export function extractPlainText(
  node: Heading | Paragraph | PhrasingContent | null | undefined
): string | null {
  if (!node) {
    return null
  }

  const queue = [node]
  let result = ''

  while ((node = queue.shift())) {
    if ('value' in node && typeof node.value === 'string') {
      result += node.value
    }

    /* istanbul ignore else */
    if ('children' in node && Array.isArray(node.children)) {
      queue.unshift(...node.children)
    }
  }

  return result.trim() || null
}
