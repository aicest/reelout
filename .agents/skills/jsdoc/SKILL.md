---
name: jsdoc
description: 'Guidelines for writing strict structural, formatting, and syntactic JSDoc comments in TypeScript codebases.'
---

# TypeScript JSDoc Style Guidelines

This document establishes strict structural, formatting, and syntactic standards to ensure clear, consistent, and readable JSDoc comments in TypeScript codebases.

## Structure and Required Order

JSDoc comments must follow this exact order and spacing:

1. Opening `/**` line.
2. **Summary** (exactly one sentence).
3. Exactly one blank line (required only if a Details block follows).
4. **Details** paragraph (optional).
5. Exactly one blank line (required before metadata tags).
6. Metadata tag block (`@param`, `@returns` / `@yields`, optional `@throws`).
7. Closing `*/` line.

Adhere strictly to this order and the spacing rules above.

### 1. Summary

- **Placement:** Position the summary on the first content line immediately after `/**`.
- **Length:** Exactly one short sentence.
- **Imperative mood:** Start with a base-form verb (e.g., `Find`, `Yield`, `Resolve`, `Fetch`). Do not use third-person singular verbs (e.g., `Yields`) or gerunds (e.g., `Fetching`).
- **Punctuation:** End the summary sentence with a single period (`.`).

### 2. Details (Optional)

- **Usage:** Include details only when additional technical explanation or architectural context is necessary.
- **Format:** Format details as one or more coherent paragraphs.
- **Grammar constraint:** If a sentence omits the subject, it MUST begin with a third-person singular verb (e.g., `Checks`, `Bypasses`, `Handles`). Sentences that include an explicit subject are exempt from this verb constraint.
- **Punctuation:** End every sentence in the details block with a period (`.`).
- **Line breaks:** Do not force manual line breaks after individual sentences; rely on the 80-character wrap rule instead.

### 3. Metadata Tags

- **@param:** Include exactly one `@param` tag for each function parameter. Format as `@param <name> <description>`. Separate the parameter name and description with a single space. Do not surround the parameter name with backticks on this line. Do not use inline type annotations (e.g., `{type}`), as TypeScript handles types natively.
- **@returns / @yields:** Use `@yields` exclusively for generator or async generator functions. Use `@returns` for all other functions. Format as `@returns <description>` or `@yields <description>`.
- **Formatting constraints:** Separate the tag name and its description with a single space. Do **not** use connector punctuation (e.g., `-`, `—`, `:`) between the tag name and its description.
- **Punctuation:** Periods are not required at the end of metadata tag descriptions.
- **Line length:** Ignore line length constraints for metadata tags and allow them to remain unwrapped.

### 4. Exceptions (`@throws`)

- **Usage:** Add a single `@throws` tag **only** if the function body contains an explicit `throw` statement. Do not document implicit exceptions thrown by called functions or third-party libraries.
- **Consolidation:** If multiple explicit `throw` statements exist, combine all conditions into a single `@throws` tag description using semicolons or natural conjunctions.
- **Formatting constraints:** Do not use connector punctuation between `@throws` and its description.
- **Punctuation:** A period is not required at the end of the `@throws` description.
- **Line length:** Ignore line length constraints for `@throws` tags and allow them to remain unwrapped.

## General Formatting

- **Line length:** Wrap paragraphs and long descriptions at approximately **80 characters** per line.
- **Code identifiers:** Enclose all code identifiers (variables, types, parameters, function names) in backticks (e.g., `payload`).
- **@param names:** Do **not** enclose parameter names in backticks when they are part of the `@param` tag declaration line.

## Quick Checklist

- [ ] Summary is exactly one imperative sentence ending with a period.
- [ ] Exactly one blank line follows the summary if details exist.
- [ ] Details form coherent paragraphs; sentences omitting a subject begin with a third-person singular verb, and all sentences end with a period.
- [ ] Exactly one blank line precedes the metadata tags.
- [ ] Exactly one `@param` tag is present per parameter; descriptions have no trailing period and omit inline type curly braces.
- [ ] `@yields` is used exclusively for generators; otherwise `@returns` is used.
- [ ] `@throws` is included only for explicit `throw` statements, consolidated into a single line without a trailing period.
- [ ] Lines are wrapped at approximately 80 characters (excluding metadata tags).
- [ ] Code identifiers are enclosed in backticks everywhere except within `@param` tag declarations.

## Example Template

```typescript
/**
 * Normalize a CSV row into a structured record.
 *
 * Trims whitespace from each field, coerces numeric strings to numbers, and
 * applies default values for missing columns. Detects and logs rows that fail
 * basic validation and skips them during processing.
 *
 * @param row The raw CSV row string
 * @param headers Optional array of header names to map fields
 * @returns A structured record object or null if the row is invalid
 * @throws If `headers` length mismatches the number of fields
 */
```
