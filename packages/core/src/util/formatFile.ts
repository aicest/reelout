// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import prettier from 'prettier'

/**
 * Format `content` for `filePath` using Prettier when possible.
 *
 * Resolves project/editorconfig settings and formats the provided content.
 * Returns the original content on error or when no parser is inferred.
 *
 * @param filePath Path used to infer parser and config
 * @param content Source content to format
 * @returns Formatted content or original content on failure
 */
export async function formatFile(
  filePath: string,
  content: string
): Promise<string> {
  try {
    const info = await prettier.getFileInfo(filePath, {
      resolveConfig: true,
    })

    const config = await prettier.resolveConfig(filePath, {
      editorconfig: true,
    })

    if (info.inferredParser == null) {
      return content
    }

    return await prettier.format(content, {
      ...config,
      parser: info.inferredParser,
      filepath: filePath,
    })
  } catch {
    return content
  }
}
