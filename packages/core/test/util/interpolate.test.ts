// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { interpolate } from '@reelout/core'
import { expect, test } from 'vitest'

test('replaces single-level placeholders and preserves missing tokens', () => {
  for (const [template, data, expected] of [
    ['Hello {foo}', { foo: 'bar' }, 'Hello bar'],
    ['Hello {foo} and {baz}', { foo: 'bar' }, 'Hello bar and {baz}'],
    ['Hello {foo} and {baz}', { foo: 'bar', baz: 'qux' }, 'Hello bar and qux'],
  ] as const) {
    expect(interpolate(template, data)).toBe(expected)
  }
})

test('resolves nested dot-notated paths and preserves unresolved nested tokens', () => {
  for (const [template, data, expected] of [
    ['Hello {foo.bar.baz}', { foo: { bar: { baz: 'qux' } } }, 'Hello qux'],
    ['Hello {foo.bar}', { foo: { bar: { baz: 'qux' } } }, 'Hello {foo.bar}'],
    ['Hello {foo.bar}', { foo: {} }, 'Hello {foo.bar}'],
    ['Hello {foo..bar}', { foo: { '': { bar: 'baz' } } }, 'Hello baz'],
  ] as const) {
    expect(interpolate(template, data)).toBe(expected)
  }
})

test('blocks tokens that target prototype-related keys', () => {
  const template = 'Hello {__proto__.foo} and {constructor.foo}'
  const data = { __proto__: { foo: 'bar' }, constructor: { foo: 'bar' } }

  expect(interpolate(template, data)).toBe(
    'Hello {__proto__.foo} and {constructor.foo}'
  )
})

test('preserves unclosed opening brace tokens verbatim', () => {
  const template = 'Hello {foo.bar'
  const data = { foo: { bar: 'baz' } }

  expect(interpolate(template, data)).toBe('Hello {foo.bar')
})

test('handles complex escaping inside and around tokens', () => {
  for (const [template, data, expected] of [
    ['Hello \\{foo\\}', { foo: 'bar', 'foo\\': 'bar' }, 'Hello {foo}'],
    ['Hello \\{foo{baz}', { foo: 'bar', baz: 'qux' }, 'Hello {fooqux'],
    ['Hello \\{foo}', { foo: 'bar' }, 'Hello {foo}'],
    ['Hello foo\\', { foo: 'bar', 'foo\\': 'bar' }, 'Hello foo\\'],
    ['Hello {\\{foo\\}}', { '{foo}': 'bar' }, 'Hello bar'],
    ['Hello {foo\\\\\\bar}', { 'foo\\\\bar': 'baz' }, 'Hello baz'],
    ['Hello {foo\\\\\\}', { 'foo\\}': 'bar' }, 'Hello {foo\\}'],
    ['Hello {foo\\\\\\}}', { 'foo\\}': 'bar' }, 'Hello bar'],
    ['Hello {foo\\\\}', { 'foo\\': 'bar' }, 'Hello bar'],
    ['Hello {foo\\\\}', { 'foo\\': { bar: 'baz' } }, 'Hello {foo\\}'],
    ['Hello {foo\\bar}', { 'foo\\bar': 'baz' }, 'Hello baz'],
    ['Hello {foo\\}', { foo: 'bar', 'foo\\': 'bar' }, 'Hello {foo}'],
    ['Hello {foo\\}}', { 'foo}': 'bar' }, 'Hello bar'],
  ] as const) {
    expect({
      template,
      data,
      result: interpolate(template, data),
    }).toEqual({
      template,
      data,
      result: expected,
    })
  }
})

test('supports escaped dots to address keys containing dots', () => {
  for (const [template, data, expected] of [
    ['Hello {foo.bar}', { 'foo.bar': 'baz' }, 'Hello {foo.bar}'],
    ['Hello {foo\\.bar}', { 'foo.bar': 'baz' }, 'Hello baz'],
  ] as const) {
    expect(interpolate(template, data)).toBe(expected)
  }
})
