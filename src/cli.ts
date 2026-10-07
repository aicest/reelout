#!/usr/bin/env node

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { createProcessAbortSignal, createProgram } from '@reelout/cli'
import { description, version } from '../package.json'

using signal = createProcessAbortSignal()

const program = await createProgram({
  name: 'reelout',
  version,
  description,
  cwd: process.cwd(),
  env: process.env,
  stdout: process.stdout,
  stderr: process.stderr,
  signal,
})

await program.parseAsync(process.argv)
