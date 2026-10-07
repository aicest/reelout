// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

interface ImportViolation {
  filePath: string
  line: number
  column: number
  importedModule: string
  packageName: string
}

async function findNearestPackageJson(
  startDirectory: string
): Promise<string | null> {
  let currentDir = path.resolve(startDirectory)

  while (true) {
    const packageJsonPath = path.join(currentDir, 'package.json')

    try {
      const fileStats = await stat(packageJsonPath)

      if (fileStats.isFile()) {
        return packageJsonPath
      }
    } catch {}

    const parentDir = path.dirname(currentDir)

    if (parentDir === currentDir) {
      return null
    }

    currentDir = parentDir
  }
}

async function readPackageName(
  packageJsonPath: string
): Promise<string | null> {
  try {
    const fileContent = await readFile(packageJsonPath, 'utf-8')
    const parsedManifest = JSON.parse(fileContent)

    return typeof parsedManifest.name === 'string' ? parsedManifest.name : null
  } catch {
    return null
  }
}

function calculateLineAndColumn(sourceText: string, position: number) {
  const precedingLines = sourceText.slice(0, position).split(/\r?\n/)
  const line = precedingLines.length
  const column = (precedingLines[precedingLines.length - 1]?.length ?? 0) + 1

  return { line, column }
}

function findSelfImportViolations(
  sourceText: string,
  filePath: string,
  packageName: string
): ImportViolation[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  )

  const violations: ImportViolation[] = []

  function checkModuleSpecifier(importedModule: string, position: number) {
    if (
      importedModule === packageName ||
      importedModule.startsWith(packageName + '/')
    ) {
      const { line, column } = calculateLineAndColumn(sourceText, position)

      violations.push({
        filePath,
        line,
        column,
        importedModule,
        packageName,
      })
    }
  }

  function visitNode(node: ts.Node) {
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      checkModuleSpecifier(
        node.moduleSpecifier.text,
        node.moduleSpecifier.getStart()
      )
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      checkModuleSpecifier(
        node.moduleSpecifier.text,
        node.moduleSpecifier.getStart()
      )
    } else if (ts.isCallExpression(node)) {
      const callExpression = node.expression

      if (
        ts.isIdentifier(callExpression) &&
        callExpression.text === 'require'
      ) {
        const argument = node.arguments[0]

        if (argument && ts.isStringLiteral(argument)) {
          checkModuleSpecifier(argument.text, argument.getStart())
        }
      }
    }

    ts.forEachChild(node, visitNode)
  }

  visitNode(sourceFile)

  return violations
}

export async function checkSelfImports(
  filePath: string
): Promise<string[] | undefined> {
  const fileExtension = path.extname(filePath).toLowerCase()

  if (fileExtension !== '.ts' && fileExtension !== '.tsx') {
    return
  }

  try {
    const fileStats = await stat(filePath)

    if (!fileStats.isFile()) {
      return
    }
  } catch {
    return
  }

  const packageJsonPath = await findNearestPackageJson(path.dirname(filePath))

  if (!packageJsonPath) return

  const packageDir = path.dirname(packageJsonPath)

  const pathSegments = path.relative(packageDir, filePath).split(path.sep)

  if (!pathSegments.includes('src')) return

  const packageName = await readPackageName(packageJsonPath)

  if (!packageName) return

  let sourceContent: string

  try {
    sourceContent = await readFile(filePath, 'utf-8')
  } catch {
    return
  }

  const violations = findSelfImportViolations(
    sourceContent,
    filePath,
    packageName
  )

  return violations.map(
    (violation) =>
      `${violation.filePath}:${violation.line}:${violation.column} imports "${violation.importedModule}"`
  )
}

async function main() {
  const args = process.argv.slice(2)

  const filePath = args[0] && path.resolve(args[0])

  if (filePath) {
    const violations = await checkSelfImports(filePath)

    if (!violations || violations.length === 0) return

    // eslint-disable-next-line no-console
    console.error(violations.join('\n'))

    process.exit(1)
  }
}

if (import.meta.main) {
  await main()
}
