// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { iterate, type GlobOptionsWithFileTypesUnset } from 'glob'
import ignore from 'ignore'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { ensureLicenseHeader } from './add-license-header'
import { checkFunctionJSDoc } from './check-function-jsdoc'
import { checkSelfImports } from './enforce-no-self-imports'

async function processFiles(
  fileStream: Iterable<string> | AsyncIterable<string>
): Promise<string[]> {
  const violations: string[] = []

  for await (const currentFilePath of fileStream) {
    violations.push(...((await checkSelfImports(currentFilePath)) ?? []))
    violations.push(...((await checkFunctionJSDoc(currentFilePath)) ?? []))
    await ensureLicenseHeader(currentFilePath)
  }

  return violations
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join(path.posix.sep)
}

async function main() {
  const cwd = process.cwd()

  const pattern = process.argv[2] ?? '.'

  const options: GlobOptionsWithFileTypesUnset = {
    cwd,
    dot: true,
    nodir: true,
  }

  let fileIterator: Iterable<string> | AsyncIterable<string>

  try {
    const absoluteFilePath = path.resolve(cwd, pattern)

    const stats = await stat(absoluteFilePath)

    if (stats.isFile()) {
      fileIterator = [absoluteFilePath]
    } else {
      const relativeFilePath = path.relative(cwd, absoluteFilePath)

      fileIterator = iterate(
        path.posix.join(toPosixPath(relativeFilePath), '**/*'),
        options
      )
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      fileIterator = iterate(toPosixPath(pattern), options)
    } else {
      throw error
    }
  }

  let gitignore: string | undefined

  try {
    gitignore = await readFile(path.join(cwd, '.gitignore'), 'utf-8')
  } catch {}

  const filter = ignore()
    .add(['**/.git/**', '**/node_modules/**', '**/scripts/**'])
    .add(gitignore ?? [])
    .createFilter()

  const violations = await processFiles(
    (async function* () {
      for await (const filePath of fileIterator) {
        const absoluteFilePath = path.resolve(cwd, filePath)

        if (filter(path.relative(cwd, absoluteFilePath))) {
          yield absoluteFilePath
        }
      }
    })()
  )

  if (violations.length === 0) return

  // eslint-disable-next-line no-console
  console.error(violations.join('\n'))

  process.exit(1)
}

if (import.meta.main) {
  await main()
}
