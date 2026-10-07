// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type {
  GitCommit,
  GitCommitNote,
  GitCommitTrailer,
  GitCommitType,
} from '#types'
import type { CommitBase } from 'conventional-commits-parser'
import { CommitParser } from 'conventional-commits-parser'
import { buildTrailerPattern } from '../../util/buildTrailerPattern'
import { extractMentions } from './extractMentions'

export interface GitLogEntry {
  hash: string
  parent: string[]
  authorDate: string
  committerDate: string
  subject: string
  body: string
  files: string[]
}

interface Commit extends CommitBase {
  type: GitCommitType | null
  scope: string | null
  subject: string
  header: string
  body: string | null
  footer: string | null
}

const BREAKING_HEADER_REGEX = /^([\w-]+)(?:\(([^)]+)\))?!: (.*)$/

const BREAKING_MARKERS: readonly string[] = [
  'BREAKING CHANGE',
  'BREAKING-CHANGE',
]

/**
 * Parse a git log entry into a structured commit object.
 *
 * Combines the commit subject and body, extracts conventional commit metadata
 * using custom trailer markers and breaking header patterns, and normalizes
 * dates to ISO format strings.
 *
 * @param entry The raw git log entry to parse
 * @param markers Optional array of custom trailer marker strings
 * @returns A structured commit object containing parsed details, notes, and mentions
 */
export async function parseGitCommit(
  entry: GitLogEntry,
  markers: readonly string[] = []
): Promise<GitCommit> {
  const message = [entry.subject, entry.body].filter(Boolean).join('\n\n')

  const parser = new CommitParser({
    breakingHeaderPattern: BREAKING_HEADER_REGEX,
    noteKeywords: [],
    notesPattern: () => buildTrailerPattern(BREAKING_MARKERS.concat(markers)),
  })

  const commit = parser.parse(message) as CommitBase as Commit

  const notes: GitCommitNote[] = []

  const trailers: GitCommitTrailer[] = []

  for (const note of commit.notes) {
    if (BREAKING_MARKERS.includes(note.title.toUpperCase())) {
      notes.push(note)
    }

    trailers.push({
      key: note.title,
      value: note.text,
    })
  }

  if (notes.length === 0 && BREAKING_HEADER_REGEX.test(commit.header)) {
    const note: GitCommitNote = {
      title: 'BREAKING CHANGE',
      text: commit.subject,
    }

    notes.push(note)

    trailers.push({
      key: note.title,
      value: note.text,
    })
  }

  const mentions = extractMentions(message)

  return {
    ...commit,
    hash: entry.hash,
    parent: entry.parent,
    authorDate: new Date(entry.authorDate).toISOString(),
    committerDate: new Date(entry.committerDate).toISOString(),
    type: commit.type?.toLowerCase() || null,
    scope: commit.scope || null,
    subject: commit.subject || null,
    header: commit.header,
    body: commit.body,
    footer: commit.footer,
    notes,
    mentions,
    trailers,
    files: entry.files,
  }
}
