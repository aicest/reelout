// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

const BACKSLASH = '\\'
const LEFT_BRACE = '{'
const RIGHT_BRACE = '}'
const DOT = '.'
const ESCAPE_CHARS = [BACKSLASH, LEFT_BRACE, RIGHT_BRACE]
const BANNED_KEYS = ['__proto__', 'constructor', 'prototype']

/**
 * Interpolate placeholders in `template` using values from `data`.
 *
 * - Placeholders use `{path.to.value}` (dot notation).
 * - Backslash escapes are supported for `{`, `}`, `\`, and `.` inside tokens.
 * - Tokens that reference banned keys (`__proto__`, `constructor`, `prototype`)
 *   are left unexpanded to avoid prototype pollution.
 * - Only own properties are followed when resolving paths; if any step is
 *   missing, the original token text is preserved.
 * - Resolved non-object, non-null values are stringified and inserted.
 * - Unclosed tokens and a trailing backslash are preserved verbatim.
 *
 * @param template Template string containing placeholders like `{user.name}`
 * @param data Object used to resolve placeholder paths
 * @returns The template with placeholders replaced by corresponding values
 */
export function interpolate(
  template: string,
  data: Record<string, unknown>
): string {
  let result = ''
  let i = 0
  let char: string | undefined
  let nextChar: string | undefined

  while ((char = template[i])) {
    // Escape handling: if a backslash precedes an escapable char, emit the
    // escaped character; otherwise emit the backslash itself.
    if (char === BACKSLASH) {
      nextChar = template[i + 1]

      if (nextChar !== undefined && ESCAPE_CHARS.includes(nextChar)) {
        result += nextChar
        i += 2
      } else {
        result += char
        i += 1
      }
    }

    // Placeholder handling: parse a token starting at '{' until a matching '}'.
    else if (char === LEFT_BRACE) {
      const keys: string[] = []
      let key = ''
      let token = ''
      let closed = false
      i += 1

      // Parse token body, supporting escaped characters and escaped dots.
      while ((char = template[i])) {
        if (char === RIGHT_BRACE) {
          closed = true
          keys.push(key)
          i += 1
          break
        }

        if (char === BACKSLASH) {
          nextChar = template[i + 1]

          // Allow escaping of brace, backslash, and dot inside tokens.
          if (
            nextChar !== undefined &&
            [...ESCAPE_CHARS, DOT].includes(nextChar)
          ) {
            key += nextChar
            token += nextChar
            i += 2
          } else {
            // Treat an isolated backslash as a literal within the token.
            key += char
            token += char
            i += 1
          }
        } else if (char === DOT) {
          // Dot separates path segments; record the current segment.
          keys.push(key)
          key = ''
          token += char
          i += 1
        } else {
          key += char
          token += char
          i += 1
        }
      }

      // If token closed with '}', attempt to resolve the path against `data`.
      if (closed) {
        let value: unknown = data

        for (const key of keys) {
          const isSafeKey = !BANNED_KEYS.includes(key)

          // Only follow own properties on objects and skip banned keys.
          if (
            value !== null &&
            typeof value === 'object' &&
            Object.hasOwn(value, key) &&
            isSafeKey
          ) {
            value = (value as Record<string, unknown>)[key]
          } else {
            value = undefined
            break
          }
        }

        // If resolution failed or produced an object/null, preserve the token.
        if (value == null || typeof value === 'object') {
          result += LEFT_BRACE + token + RIGHT_BRACE
        } else {
          result += String(value)
        }
      }

      // Unclosed token: preserve the raw token text (including the opening brace).
      else {
        result += LEFT_BRACE + token
      }
    }

    // Ordinary characters are appended directly.
    else {
      result += char
      i += 1
    }
  }

  return result
}
