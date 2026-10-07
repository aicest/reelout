// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import fs from 'node:fs/promises'
import path from 'node:path'
import { formatFile } from './formatFile'

/**
 * Write a JSON `payload` to `filePath`, formatting the content first.
 *
 * Ensures the directory exists and writes the formatted JSON.
 *
 * @param filePath Path to write the JSON file
 * @param payload JSON-serializable object to write
 * @returns Promise that resolves when the file is written
 */
export async function writeJson(
  filePath: string,
  payload: object
): Promise<void> {
  let content = JSON.stringify(payload, null, 2)

  content = await formatFile(filePath, content)

  await fs.mkdir(path.dirname(filePath), { recursive: true })

  await fs.writeFile(filePath, content)
}
