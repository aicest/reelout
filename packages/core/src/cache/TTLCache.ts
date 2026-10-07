// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

interface Entry<V> {
  value: V
  timer: NodeJS.Timeout
  ttl: number
}

/**
 * A simple time-to-live cache that automatically evicts entries after a TTL.
 *
 * - Entries are removed automatically when their TTL expires.
 * - Reading an entry resets its TTL to the original value.
 * - Setting an existing key clears its previous timer and resets the TTL.
 *
 * @template K Type of cache keys
 * @template V Type of cache values
 */
export class TTLCache<K, V> {
  private cache = new Map<K, Entry<V>>()

  /**
   * Store a value under `key` for `ttl` milliseconds.
   *
   * If the key already exists its previous timer is cleared and the TTL is reset.
   *
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time to live in milliseconds (default: 60_000)
   */
  set(key: K, value: V, ttl: number = 60_000): void {
    const ref = this.cache.get(key)

    if (ref) {
      clearTimeout(ref.timer)
    }

    const timer = setTimeout(() => {
      this.cache.delete(key)
    }, ttl).unref()

    this.cache.set(key, { value, timer, ttl })
  }

  /**
   * Retrieve the value for `key`, or `undefined` if not present.
   *
   * Reading an entry resets its TTL to the original `ttl` provided when it was set.
   *
   * @param key Cache key
   * @returns The stored value or `undefined` if not present
   */
  get(key: K): V | undefined {
    const ref = this.cache.get(key)

    if (!ref) return undefined

    this.set(key, ref.value, ref.ttl)

    return ref.value
  }

  /**
   * Check whether `key` exists in the cache.
   *
   * @param key Cache key
   * @returns `true` if present; otherwise `false`
   */
  has(key: K): boolean {
    return this.cache.has(key)
  }

  /**
   * Remove `key` from the cache and clear its eviction timer.
   *
   * @param key Cache key
   * @returns `true` if the key was present and removed; otherwise `false`
   */
  delete(key: K): boolean {
    const ref = this.cache.get(key)

    if (!ref) return false

    clearTimeout(ref.timer)

    return this.cache.delete(key)
  }

  /**
   * Clear all entries and their timers.
   */
  clear(): void {
    for (const { timer } of this.cache.values()) {
      clearTimeout(timer)
    }

    this.cache.clear()
  }
}
