// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

export class InMemoryStore {
  private storage = new Map<string, object>()

  get(plugin: string): object {
    let state = this.storage.get(plugin)

    if (state == null) {
      this.storage.set(plugin, (state = {}))
    }

    return state
  }
}
