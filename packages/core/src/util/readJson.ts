// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { colors } from 'consola/utils'
import fs from 'node:fs/promises'

/**
 * Read and parse a JSON file.
 *
 * Throws a descriptive error when the file cannot be read or parsed, or when
 * the parsed value is not an object.
 *
 * @param filePath Path to the JSON file
 * @returns Parsed JSON object
 * @throws If the file cannot be read, parsed, or is not an object
 */
export async function readJson<T>(filePath: string): Promise<T> {
  let content: string

  try {
    content = await fs.readFile(filePath, 'utf-8')
  } catch (err) {
    throw new Error(
      `JSON file at "${colors.bold(filePath)}" could not be read.`,
      { cause: err }
    )
  }

  let json: T

  try {
    json = JSON.parse(content) as T
  } catch (err) {
    throw new Error(
      `JSON file at "${colors.bold(filePath)}" could not be parsed.`,
      { cause: err }
    )
  }

  if (typeof json !== 'object' || json === null) {
    throw new Error(
      `JSON file at "${colors.bold(filePath)}" does not contain a valid object.`
    )
  }

  return json
}
