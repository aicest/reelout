# Contributing

## Quick Start

Install workspace dependencies and run initial validation:

```bash
pnpm install
pnpm validate
```

## Development

Co-locate source files with their corresponding unit tests inside `packages/<scope>/`:

```text
packages/<scope>/
├── src/
│   └── foo/
│       └── bar.ts
└── test/
    └── foo/
        └── bar.test.ts
```

- **Watch Mode:** Run tests continuously during development:
  ```bash
  pnpm test
  ```
- **Single Run:** Run the entire test suite once:
  ```bash
  pnpm test run
  ```
- **Update Snapshots:** Regenerate test snapshots after modifying public exports in `src/index.ts`:
  ```bash
  pnpm test run --update=all "index.test.ts"
  ```

### Local Debugging

Run and debug the CLI locally using either direct TypeScript execution or built JavaScript artifacts.

#### Option 1: Direct Execution (TypeScript)

Execute directly from source without running a build step:

```bash
pnpm tsx src/cli.ts --help
pnpm tsx src/cli.ts --dry-run
```

#### Option 2: Built Artifacts (JavaScript)

Build the workspace and execute the compiled CLI entry point:

```bash
pnpm build
node dist/cli.js --help
node dist/cli.js --dry-run
```

### Code Validation

Run `pnpm validate` to execute linter and code formatter checks. This command runs automatically before every `git push`.

## Submitting a Pull Request

### Guidelines & Conventions

- **Branch Naming:** Create feature branches off `main` using descriptive prefixes, such as `feature/<description>` for new capabilities or `fix/<description>` for bug fixes.
- **Commit Messages:** Follow the [Conventional Commits specification](https://www.conventionalcommits.org/) (for example, `feat(scope): add new feature` or `fix(scope): resolve issue`).

### Pull Request Checklist

Ensure your changes meet all of the following criteria before requesting a review:

- [ ] The scope focuses on a single responsibility with no unrelated changes.
- [ ] Public API changes are documented in the PR description.
- [ ] All unit tests pass (`pnpm test run`).
- [ ] Build, linting, and formatting checks succeed (`pnpm validate`).
- [ ] All CI pipeline checks pass.
