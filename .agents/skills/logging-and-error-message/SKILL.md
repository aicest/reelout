---
name: logging-and-error-message
description: 'Guidelines and rules for writing clear, actionable, and secure error messages and logs.'
---

# Logging and Error Message Guidelines

This document outlines standards and rules for writing clear, actionable, and secure error messages and logs, including formatting, syntax, and tooling expectations.

## Principles

- **Lead with the subject:** Begin messages with the specific entity that failed or changed (for example: "Package could not be loaded.").
- **Be clear and actionable:** State clearly what occurred and, when relevant, how to investigate or resolve the issue.
- **Use precise verbs and consistent tense:** Use phrases such as "could not", "was not", or "will not" to state outcomes clearly.
- **Favor consistency:** Align phrasing with existing messages in the same module or feature.
- **Do not log secrets:** Never include API keys, tokens, passwords, private keys, or other sensitive data in logs or structured fields.
- **Remediate logged secrets immediately:** If sensitive data is accidentally exposed, redact the logs, rotate affected credentials, and investigate the source; add guardrails or tests to prevent recurrence.
- **Support localization:** Ensure localized translations preserve placeholders, sentence structure, and clarity, while maintaining the English source as the canonical reference.

## Rules

### Error messages

- Write error messages as a single sentence that begins with the subject (what failed or is missing). Example: "Initial version is required to compute the next version." Avoid: "Cannot compute next version: initial version is missing."
- Quote variable data (such as file paths or IDs) to make messages unambiguous. Example: `JSON file at "${filePath}" could not be parsed.`
- Keep the short message focused and brief (preferably under 100 characters); put extended diagnostics in structured fields or debug logs. Example:

```typescript
throw new Error(`JSON file at "${filePath}" could not be read.`, {
  cause: rootCause,
})
```

- Checklist:
  1. Start with the subject (what failed or is missing).
  2. Keep the message to a single sentence.
  3. Quote variable data and keep the short message under 100 characters.
  4. Put extended diagnostics in structured fields or debug logs.

### Log messages

- Keep user-facing messages concise and focused.
- When both an event and a reason appear in a single message, use the format `<what>: <why>` and keep both parts short. Examples:

```typescript
logger.info('[DRY RUN] Packages will not be published.')
logger.warn(
  'Packages were not published: NPM_TOKEN is required for NPM authentication.'
)
```

If the `why` part is dynamic (for example: `error.message`) and may already include punctuation, omit the trailing period to avoid duplicate punctuation. Example:

```typescript
logger.warn(
  `Package could not be loaded: ${error instanceof Error ? error.message : error}`
)
```

- Preserve standard prefixes (for example: `[DRY RUN]`) unless explicitly instructed to remove them, as they are useful for filtering or altering runtime behavior.
- For localized messages, ensure translations maintain the same structure, placeholders, and clarity as the original text.
- Checklist:
  1. Use the `<what>: <why>` format when combining event and reason.
  2. Omit the trailing period when the `why` part may already include punctuation.
  3. Preserve standard prefixes unless explicitly requested to remove them.
  4. Verify that localized translations preserve placeholders and sentence structure.

## Scope and tooling

- Candidate search patterns: Use ripgrep or GNU grep to find candidate messages. Example commands:

```shell
rg --hidden -n 'Error\(|logger\.|test\('
```

Fallback: use GNU grep:

```shell
grep -R -n -E "Error\(|logger\.|test\(" .
```

- When updating a message, search for similar messages in the same module and align your phrasing accordingly.
- Include grammar checks as part of your validation process.

## Examples (before → after)

### Throwing an error

Before:

```typescript
throw new Error(`Could not parse JSON from file at "${filePath}".`)
```

After:

```typescript
throw new Error(`JSON file at "${filePath}" could not be parsed.`)
```

### Logging a caught error

Before:

```typescript
logger.warn(error)
```

After:

```typescript
logger.warn(
  `Package could not be loaded: ${error instanceof Error ? error.message : error}`
)
```
