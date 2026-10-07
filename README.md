# ReelOut

[![NPM Version](https://img.shields.io/npm/v/reelout)](https://www.npmjs.com/package/reelout)
[![Codecov](https://img.shields.io/codecov/c/github/aicest/reelout?token=FSP5JC9E16)](https://app.codecov.io/github/aicest/reelout)

ReelOut is a plugin-driven release automation tool engineered specifically for monorepos. By analyzing [Conventional Commits](https://conventionalcommits.org), it autonomously calculates version bumps, updates package manifests, generates changelogs, creates tags, and publishes packages to your registry.

## Features

| Feature                           |  Semantic Release  | Changesets | Release Please |      ReelOut       |
| :-------------------------------- | :----------------: | :--------: | :------------: | :----------------: |
| Monorepo support                  |         ❌         |     ✅     |       ✅       |         ✅         |
| No extra log files required       |         ✅         |     ❌     |       ✅       |         ✅         |
| No release pull requests required |         ✅         |     ✅     |       ❌       |         ✅         |
| Prerelease mode                   |         ✅         |     ✅     |       ✅       |         ✅         |
| Multi-ecosystem compatibility     | ✅ (plugin-driven) |     ❌     | ✅ (built-in)  | ✅ (plugin-driven) |

## Installation

Install with your preferred package manager:

```sh
npm install -D reelout
# or
pnpm add -D reelout
# or
yarn add -D reelout
```

## Usage

### View available options

```sh
npx reelout --help
```

```text
Usage: reelout [options]

Monorepo release CLI and toolkit.

Options:
  --cwd <string>                    Working directory in which to run the release process.
  --dry-run                         Preview the planned release without updating files, creating commits, or publishing packages.
  --prerelease [boolean or string]  Enable prerelease mode and optionally provide a label (for example, "alpha" or "beta").
  --promote [boolean]               Promote development versions to stable production releases.
  --channel [boolean or string]     Publish packages to the specified release channel.
  --version                         Display the version number.
  --help                            Display help for this command.
```

### Preview a release

Preview version bumps without modifying files, staging tags, or publishing:

```sh
npx reelout --dry-run
```

### Execute a release

Run a production release to parse commits, bump versions, update manifests, generate changelogs, tag, and publish:

```sh
npx reelout
```

### Prereleases and promotions

Ship pre-production builds with a custom prerelease identifier:

```sh
npx reelout --prerelease beta
```

Once a prerelease version is validated, upgrade it to a stable production release without requiring new commits:

```sh
npx reelout --promote
```

## Documentation

View the full documentation at https://reelout.overview.vercel.app/.

## License

This project is licensed under the [MIT License](./LICENSE).
