# AGENTS — AI Coding Agent Instructions

## Project Overview

- **Monorepo:** Managed via `pnpm` workspaces to enforce strict package boundaries and enable internal linking.
- **Module System:** Authored in TypeScript and compiled strictly to native ECMAScript Modules (ESM).
- **Testing:** Uses `vitest` for unit and integration testing.
- **Code Organization:** Core library exports originate from `src/index.ts`; the CLI entry point resides in `src/cli.ts`. Modular workspace packages are located under `packages/*`.
- **Documentation:** Guides and user manuals live in `docs/`; auto-generated TypeDoc API references are output to `generated/`.

## Repository Layout

| Path               | Description                                                      |
| :----------------- | :--------------------------------------------------------------- |
| `src/index.ts`     | Programmatic API entry point                                     |
| `src/cli.ts`       | Executable CLI entry point                                       |
| `packages/cli`     | Terminal UI components, interactive prompts, and command parsing |
| `packages/config`  | Configuration parsing and environment schema validation          |
| `packages/context` | Execution context management and workspace state tracking        |
| `packages/core`    | Core domain logic, execution engine, and release workflows       |
| `packages/git`     | Git CLI wrappers and repository utilities                        |
| `packages/github`  | GitHub API integration for release management                    |
| `packages/gitlab`  | GitLab API integration for release management                    |
| `packages/npm`     | Package manifest utilities and publishing workflows              |
| `test/`            | End-to-end test suites and integration fixtures                  |
| `dist/`            | Compiled JavaScript ESM build artifacts                          |
| `generated/`       | Auto-generated TypeDoc API documentation                         |
| `docs/`            | User guides, manuals, and developer documentation                |
| `scripts/`         | Maintenance, CI/CD, and workspace automation scripts             |

## Essential Commands

| Command         | Description                                                           |
| :-------------- | :-------------------------------------------------------------------- |
| `pnpm validate` | Run the full verification pipeline (linting, formatting, build, test) |
| `pnpm test run` | Execute the entire test suite once without file watching              |
| `pnpm test`     | Launch `vitest` in interactive watch mode for active development      |
| `pnpm build`    | Compile all workspace packages for production distribution            |
| `pnpm lint`     | Perform static analysis and code quality checks                       |
| `pnpm format`   | Format all repository files using Prettier                            |
| `pnpm install`  | Install and link all workspace dependencies                           |
| `pnpm dev`      | Start development runners and active file watchers                    |
| `pnpm clean`    | Remove build artifacts, cached files, and generated output            |

## Engineering Principles

- **Continuous Verification:** Run `pnpm validate` before submitting changes to ensure linting, formatting, type checking, and tests pass.
- **Comprehensive Testing:** Write unit and integration tests for new features, bug fixes, and edge cases. Verify coverage via `pnpm test run --coverage`.
- **Atomic Commits:** Scope commits to a single logical change, including corresponding tests, documentation, and type declarations.
- **Interface Stability:** Maintain backward compatibility for public APIs. Document migration paths and update affected workspace packages if breaking changes are unavoidable.
- **Metadata Compliance:** Keep package exports, type definitions, and `package.json` manifests aligned with repository standards.
- **Conventional Commits:** Adhere strictly to Conventional Commits specifications (e.g., `feat:`, `fix:`, `docs:`, `refactor:`).

## Additional Documentation

- [README.md](./README.md) — Product overview, quickstart instructions, and usage examples.
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Development workflow, pull request standards, and contribution guidelines.
