// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const CURRENT_YEAR = new Date().getFullYear()
const LICENSE_HEADER = `// SPDX-License-Identifier: MIT\n// Copyright (c) ${CURRENT_YEAR} Fai\n\n`
const LICENSE_REGEX = /Copyright\s+\(c\)\s+\d{4}(?:-\d{4})?\s+[^\r\n]+/

export async function ensureLicenseHeader(filePath: string): Promise<void> {
  const fileExtension = path.extname(filePath).toLowerCase()

  if (fileExtension !== '.ts' && fileExtension !== '.tsx') {
    return
  }

  if (filePath.endsWith('.d.ts')) {
    return
  }

  const fileContent = await readFile(filePath, 'utf-8')

  if (!LICENSE_REGEX.test(fileContent)) {
    await writeFile(filePath, LICENSE_HEADER + fileContent, 'utf-8')
  }
}

async function main() {
  const args = process.argv.slice(2)

  const filePath = args[0] && path.resolve(args[0])

  if (filePath) {
    await ensureLicenseHeader(filePath)
  }
}

if (import.meta.main) {
  await main()
}
