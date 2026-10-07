// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isClass } from '@reelout/core'
import { expect, expectTypeOf, test } from 'vitest'

test('returns true when target is standard es6 class', () => {
  expect(isClass(class Person {})).toBe(true)
})

test('returns true when target is extended class', () => {
  class Base {}
  class Child extends Base {}

  expect(isClass(Child)).toBe(true)
})

test('returns true when target is anonymous class expression', () => {
  expect(isClass(class {})).toBe(true)
})

test('returns false when target is standard function declaration', () => {
  expect(isClass(function regularFunction() {})).toBe(false)
})

test('returns false when target is standard function expression', () => {
  expect(isClass(function () {})).toBe(false)
})

test('returns false when target is arrow function', () => {
  expect(isClass(() => {})).toBe(false)
})

test('returns false when target is bound function', () => {
  function regularFunction() {}
  const boundFn = regularFunction.bind(null)

  expect(isClass(boundFn)).toBe(false)
})

test('returns false when target is async function', () => {
  expect(isClass(async function asyncFn() {})).toBe(false)
})

test('returns false when target is generator function', () => {
  expect(isClass(function* generatorFn() {})).toBe(false)
})

test('returns false when target is non-function primitive or object', () => {
  for (const value of [
    null,
    undefined,
    42,
    'class Foo {}',
    true,
    {},
    [],
    Symbol('class'),
  ]) {
    expect(isClass(value)).toBe(false)
  }
})

test('narrows unknown type to class type when inside conditional block', () => {
  class Vehicle {}

  const target = Vehicle as string | typeof Vehicle | (() => Vehicle)

  if (isClass(target)) {
    expectTypeOf(target).toEqualTypeOf<typeof Vehicle>()
  } else {
    expectTypeOf(target).toEqualTypeOf<string | (() => Vehicle)>()
  }
})
