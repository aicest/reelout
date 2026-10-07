// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

const ALPHANUMERIC = '[a-zA-Z0-9]'
const SEPARATOR = '[-_]'
const USERNAME = `${ALPHANUMERIC}+(?:${SEPARATOR}+${ALPHANUMERIC}+)*`
const EMAIL_LOCAL = '[a-zA-Z0-9._%+-]'
const DOMAIN_SUFFIX = '[a-zA-Z0-9.-]*\\.[a-zA-Z]{2,}'
const SCOPED_PACKAGE_SPEC_SUFFIX = `/${USERNAME}@[0-9]+\\.[0-9]+\\.[0-9]+`

/**
 * Extract unique mention handles from the input text string.
 *
 * Evaluates `text` against boundary rules to isolate valid handles while
 * excluding email addresses, domain names, and scoped package specs, then
 * de-duplicates the resulting handles.
 *
 * @param text The input string to parse for mentions
 * @returns An array of unique mention handles
 */
export function extractMentions(text: string): string[] {
  if (!text) return []

  const regex = new RegExp(
    `(?<!${EMAIL_LOCAL})@(${USERNAME})\\b(?!${SEPARATOR}|${DOMAIN_SUFFIX}|${SCOPED_PACKAGE_SPEC_SUFFIX})`,
    'g'
  )

  const matches = text.matchAll(regex)

  const mentions = new Set(matches.map((match) => match[1] as string))

  return Array.from(mentions)
}
