// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

interface DocViolation {
  filePath: string
  line: number
  column: number
  functionName: string
}

interface FunctionGroup {
  name: string
  posNode: ts.Node
  candidates: ts.Node[][]
}

function isExportedNode(node: ts.Node): boolean {
  const modifiers = ts.canHaveModifiers(node)
    ? ts.getModifiers(node)
    : undefined

  return (
    modifiers?.some((modifier) => {
      return (
        modifier.kind === ts.SyntaxKind.ExportKeyword ||
        modifier.kind === ts.SyntaxKind.DefaultKeyword
      )
    }) ?? false
  )
}

function isFileOverviewComment(commentText: string): boolean {
  const lower = commentText.toLowerCase()

  return (
    lower.includes('@fileoverview') ||
    lower.includes('@file') ||
    lower.includes('@packagedocumentation') ||
    lower.includes('copyright') ||
    lower.includes('license')
  )
}

function hasJSDoc(node: ts.Node, sourceText: string): boolean {
  const commentRanges = ts.getLeadingCommentRanges(sourceText, node.pos)

  if (!commentRanges || commentRanges.length === 0) {
    return false
  }

  for (const range of commentRanges.toReversed()) {
    const commentText = sourceText.slice(range.pos, range.end).trim()

    if (commentText.startsWith('/**') && !commentText.startsWith('/***')) {
      if (isFileOverviewComment(commentText)) {
        continue
      }

      return true
    }
  }

  return false
}

function findDocViolations(
  sourceText: string,
  filePath: string
): DocViolation[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  )

  const namedExportedNames = new Set<string>()

  function collectExports(node: ts.Node): void {
    if (ts.isModuleDeclaration(node)) {
      return
    }

    if (
      ts.isExportDeclaration(node) &&
      !node.moduleSpecifier &&
      node.exportClause
    ) {
      if (ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          namedExportedNames.add((element.propertyName ?? element.name).text)
        }
      }
    } else if (
      ts.isExportAssignment(node) &&
      ts.isIdentifier(node.expression)
    ) {
      namedExportedNames.add(node.expression.text)
    }

    ts.forEachChild(node, collectExports)
  }

  collectExports(sourceFile)

  const functionGroups = new Map<string, FunctionGroup>()

  function visitNode(node: ts.Node): void {
    if (ts.isModuleDeclaration(node)) {
      return
    }

    if (ts.isFunctionDeclaration(node)) {
      const name = node.name?.text
      const isExported =
        isExportedNode(node) ||
        (name !== undefined && namedExportedNames.has(name))

      if (isExported) {
        const funcName = name ?? 'default'
        const parentPos = node.parent ? node.parent.pos : 0
        const key = `${parentPos}:${funcName}`
        const group = functionGroups.get(key)
        const candidateNodes = [node]

        if (group) {
          group.candidates.push(candidateNodes)
        } else {
          functionGroups.set(key, {
            name: funcName,
            posNode: node.name ?? node,
            candidates: [candidateNodes],
          })
        }
      }
    } else if (ts.isVariableStatement(node)) {
      const statementExported = isExportedNode(node)

      for (const decl of node.declarationList.declarations) {
        if (!decl.initializer) continue

        const init = decl.initializer
        const isFunction =
          ts.isArrowFunction(init) || ts.isFunctionExpression(init)

        if (!isFunction) continue

        const varName = ts.isIdentifier(decl.name)
          ? decl.name.text
          : decl.name.getText(sourceFile)

        const isExported = statementExported || namedExportedNames.has(varName)

        if (isExported) {
          const parentPos = node.parent ? node.parent.pos : 0
          const key = `${parentPos}:${varName}`
          const group = functionGroups.get(key)
          const candidateNodes = [node, decl, init]

          if (group) {
            group.candidates.push(candidateNodes)
          } else {
            functionGroups.set(key, {
              name: varName,
              posNode: decl.name,
              candidates: [candidateNodes],
            })
          }
        }
      }
    } else if (ts.isExportAssignment(node)) {
      const expr = node.expression

      if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr)) {
        const parentPos = node.parent ? node.parent.pos : 0
        const key = `${parentPos}:default`
        const group = functionGroups.get(key)
        const candidateNodes = [node, expr]

        if (group) {
          group.candidates.push(candidateNodes)
        } else {
          functionGroups.set(key, {
            name: 'default',
            posNode: node,
            candidates: [candidateNodes],
          })
        }
      }
    }

    ts.forEachChild(node, visitNode)
  }

  visitNode(sourceFile)

  const violations: DocViolation[] = []

  for (const group of functionGroups.values()) {
    const documented = group.candidates.some((candidateNodes) => {
      return candidateNodes.some((node) => hasJSDoc(node, sourceText))
    })

    if (!documented) {
      const pos = group.posNode.getStart(sourceFile)
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos)

      violations.push({
        filePath,
        line: line + 1,
        column: character + 1,
        functionName: group.name,
      })
    }
  }

  return violations.toSorted((a, b) => a.line - b.line || a.column - b.column)
}

export async function checkFunctionJSDoc(
  filePath: string
): Promise<string[] | undefined> {
  const pathSegments = path.normalize(filePath).split(path.sep)

  if (pathSegments.includes('test')) {
    return
  }

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

  let sourceContent: string

  try {
    sourceContent = await readFile(filePath, 'utf-8')
  } catch {
    return
  }

  const violations = findDocViolations(sourceContent, filePath)

  return violations.map((violation) => {
    return `${violation.filePath}:${violation.line}:${violation.column} missing JSDoc documentation for exported function "${violation.functionName}"`
  })
}

async function main() {
  const args = process.argv.slice(2)

  const filePath = args[0] && path.resolve(args[0])

  if (filePath) {
    const violations = await checkFunctionJSDoc(filePath)

    if (!violations || violations.length === 0) return

    // eslint-disable-next-line no-console
    console.error(violations.join('\n'))

    process.exit(1)
  }
}

if (import.meta.main) {
  await main()
}
