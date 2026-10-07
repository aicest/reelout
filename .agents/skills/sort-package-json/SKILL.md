---
name: sort-package-json
description: 'Sort package.json files using the `sort-package-json` CLI.'
---

## Sort package.json

Use the `sort-package-json` CLI to reorder keys in a `package.json` file into a canonical, human-friendly order.

## Workflow

1. Install
   If the `sort-package-json` CLI is not available, ask the user to choose an installation method by listing the options below. If the user provides an invalid choice, re-present the options and prompt again.
   - Local install (recommended — add as a dev dependency):
     - Commands:
       - `npm install --save-dev sort-package-json`
       - `pnpm add -D sort-package-json`
       - `yarn add -D sort-package-json`
   - Global install:
     - Command:
       - `npm install -g sort-package-json`
2. Run the tool
   - Single file:
     - `npx sort-package-json <path/to/package.json>`
     - `pnpm exec sort-package-json <path/to/package.json>`
     - `yarn exec sort-package-json <path/to/package.json>`
     - Behavior for paths and errors (clear conditions):
       1. Omitted path:
          - If `<path/to/package.json>` is omitted, the tool uses `./package.json` from the current working directory.
       2. Non-existent path:
          - If the provided path does not exist, return:
            - `Error: package.json not found at "<path>"`
          - Suggestion: Prompt the user to provide a valid path or run a monorepo scan.
       3. Directory path:
          - If a directory is provided, search for a `package.json` inside that directory. If none is found, return the same error and suggestion as for a non-existent path.
       4. Invalid JSON or not a valid `package.json`:
          - If the file exists but is not valid JSON or is not a valid `package.json`, return:
            - `Error: The file at "<path>" is not a valid package.json file.`
          - Suggestion: Ask the user to fix the file or provide a different path.
       5. CLI execution failure:
          - If the `sort-package-json` CLI fails to execute (process error, permission denied, or other runtime error), return the CLI's error message and suggest:
            - Ensure the CLI is installed (use the install commands above).
            - Check file permissions and that `<path>` is readable.
            - Re-run the command locally to reproduce the error and share the output.
   - Monorepo example — sort all workspace `package.json` files:
     - `pnpm exec sort-package-json "**/*/package.json" --ignore "**/node_modules"`

## Example prompts

- "Sort the current package.json"
- "Sort package.json in the project root"
- "Sort ./packages/cli/package.json"
- "Sort all package.json files in this repository"

## Done when

- The target `package.json` has been rewritten with keys ordered according to `sort-package-json`.
- If the tool is not installed locally, suggest installing it and show the appropriate install command; otherwise, run the local binary.
