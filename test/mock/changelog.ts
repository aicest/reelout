// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

export function stripLeadingSpaces(string: string): string {
  return string.replace(/^ +/gm, '')
}
