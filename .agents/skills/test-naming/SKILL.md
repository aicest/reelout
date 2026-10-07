---
name: test-naming
description: 'Guidelines for writing clear, intent-driven, and context-rich test names in JavaScript and TypeScript.'
---

# Test Naming Guidelines

Apply these guidelines across JavaScript and TypeScript test runners (Jest, Vitest, Playwright, Cypress) to ensure test names clearly communicate domain logic, observable behavior, and exact failure context.

## 1. Core Principles

- **Focus on observable behavior over implementation**: Describe external side effects, returned values, emitted events, or thrown errors. Avoid referencing internal function names, private properties, or mock implementation details.
  - **Prefer:** `persists session token to secure storage on successful login`
  - **Avoid:** `calls localStorage.setItem on login`

- **Reflect business rules and branch logic**: Map test names directly to domain constraints, edge cases, and execution paths.
  - **Prefer:** `applies 15% seasonal discount when cart total exceeds $100`
  - **Avoid:** `calculates cart total correctly`

- **Eliminate filler words**: Omit non-descriptive terms such as `works`, `handles`, `test`, `correctly`, or `should`. Replace them with explicit triggers and expected outcomes.
  - **Prefer:** `throws InvalidCredentialsError when password field is empty`
  - **Avoid:** `handles password errors correctly`

- **State positive and negative outcomes explicitly**: Assert positive outcomes directly. Express negative behaviors or non-occurrences using strong action verbs (`rejects`, `prevents`, `denies`) or clear negations (`does not render`, `does not retry`, `does not mutate`).
  - **Positive:** `renders success banner when form submits successfully`
  - **Negative:** `does not retry request when server returns 401 status`
  - **Avoid:** `does not work with expired token`

## 2. Structural Formula

Format test names using an outcome-first pattern:

> `[expected outcome] [when / given / if] [input condition or context]`

| Scenario            | Example Pattern                                               |
| :------------------ | :------------------------------------------------------------ |
| **Positive Path**   | `returns gold tier pricing when account age exceeds 365 days` |
| **Negative Path**   | `rejects file upload when document size exceeds 10MB`         |
| **Non-Occurrence**  | `does not mutate original payload when transformation fails`  |
| **State-Dependent** | `disables submit button while payment processing is pending`  |

## 3. Scope and Granularity

- **One behavior per test**: Target a single outcome under one specific scenario per test block.
- **Specify concrete inputs and roles**: Reference explicit user roles, flags, or boundary values rather than generic abstractions.
  - **Prefer:** `denies edit access when user role is viewer`
  - **Avoid:** `handles invalid user permissions`
- **Maintain structural consistency**: Standardize condition prefixes (`when`, `given`, `if`) across related test files to maximize suite scannability.

## 4. Formatting and Style

- **Sentence case**: Use lowercase sentence case for seamless readability in CLI terminal logs and CI runner outputs.
- **Minimal punctuation**: Omit trailing periods. Reserve commas strictly for separating complex compound conditions.
- **Concise context**: Include only the essential inputs and state conditions required to uniquely distinguish the test within its suite.

## 5. Patterns and Anti-Patterns

| Category              | Recommended Pattern                                           | Anti-Pattern                |
| :-------------------- | :------------------------------------------------------------ | :-------------------------- |
| **Positive State**    | `displays balance total when user session is active`          | `handles session state`     |
| **Validation**        | `returns 422 status code when email field is missing`         | `handles email validation`  |
| **State Guard**       | `prevents duplicate subscription when user has active plan`   | `tests checkout edge case`  |
| **Negative Behavior** | `does not trigger webhook when notification flag is disabled` | `checks webhook flag works` |
| **Access Control**    | `denies export access when user lacks admin permissions`      | `checks RBAC logic works`   |
| **Error Handling**    | `throws InvalidTokenError when JWT signature is expired`      | `works with invalid tokens` |

## 6. Review Checklist

Before committing a test, verify that the test name:

- [ ] Describes an observable outcome rather than an internal implementation detail.
- [ ] Maps directly to a single business rule, domain constraint, or branch condition.
- [ ] Explicitly defines both the expected outcome (including `does not ...` negations) and the driving condition.
- [ ] Omits non-descriptive filler words (`works`, `handles`, `correctly`, `should`).
- [ ] Makes CI failure logs self-explanatory and instantly searchable.
- [ ] Aligns structurally with neighboring tests within the suite.
