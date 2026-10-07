// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { Package } from '@reelout/core'
import { sortPackages } from '@reelout/core'
import { expect, test } from 'vitest'

function getPackageDirs(packages: Package[]) {
  return packages.map((pkg) => pkg.location)
}

test('resolves ties alphabetically by directory path', () => {
  const packages = [
    { location: 'c', name: 'c', dependencies: [] },
    { location: 'b', name: undefined, dependencies: [] },
    { location: '.', name: undefined, dependencies: [] as string[] },
    { location: 'a', name: 'a', dependencies: [] },
  ] as Package[]

  expect(getPackageDirs(sortPackages(packages))).toEqual(['.', 'a', 'b', 'c'])
})

test('places dependents before dependencies when paths conflict with alphabetical order', () => {
  const packages = [
    { location: 'a', name: 'a', dependencies: ['c'] },
    { location: 'b', name: 'b', dependencies: [] },
    { location: 'c', name: 'c', dependencies: [] },
  ] as Package[]

  expect(getPackageDirs(sortPackages(packages))).toEqual(['c', 'a', 'b'])
})

test('sorts reverse-alphabetical linear chains from deepest dependent to root', () => {
  const packages = [
    { location: 'a', name: 'a', dependencies: ['b'] },
    { location: 'b', name: 'b', dependencies: ['c'] },
    { location: 'c', name: 'c', dependencies: [] },
  ] as Package[]

  expect(getPackageDirs(sortPackages(packages))).toEqual(['c', 'b', 'a'])
})

test('sorts alphabetical linear chains from deepest dependent to root', () => {
  const packages = [
    { location: 'a', name: 'a', dependencies: [] },
    { location: 'b', name: 'b', dependencies: ['a'] },
    { location: 'c', name: 'c', dependencies: ['b'] },
  ] as Package[]

  expect(getPackageDirs(sortPackages(packages))).toEqual(['a', 'b', 'c'])
})

test('sorts middle-root linear chains from deepest dependent to root', () => {
  const packages = [
    { location: 'a', name: 'a', dependencies: ['b'] },
    { location: 'b', name: 'b', dependencies: [] },
    { location: 'c', name: 'c', dependencies: ['a'] },
  ] as Package[]

  expect(getPackageDirs(sortPackages(packages))).toEqual(['b', 'a', 'c'])
})

test('sorts middle-dependent linear chains from deepest dependent to root', () => {
  const packages = [
    { location: 'a', name: 'a', dependencies: [] },
    { location: 'b', name: 'b', dependencies: ['c'] },
    { location: 'c', name: 'c', dependencies: ['a'] },
  ] as Package[]

  expect(getPackageDirs(sortPackages(packages))).toEqual(['a', 'c', 'b'])
})

test('breaks circular loops using entry node levels and falls back to alphabetical sort', () => {
  const packages = [
    { location: 'd', name: 'd', dependencies: ['c'] },
    { location: 'c', name: 'c', dependencies: ['a'] },
    { location: 'b', name: 'b', dependencies: ['c'] },
    { location: 'a', name: 'a', dependencies: ['b'] },
  ] as Package[]

  expect(getPackageDirs(sortPackages(packages))).toEqual(['c', 'b', 'a', 'd'])
})

test('handles downstream circular loops connected to linear root dependencies', () => {
  const packages = [
    { location: 'd', name: 'd', dependencies: [] },
    { location: 'c', name: 'c', dependencies: ['a', 'd'] },
    { location: 'b', name: 'b', dependencies: ['c'] },
    { location: 'a', name: 'a', dependencies: ['b'] },
  ] as Package[]

  expect(getPackageDirs(sortPackages(packages))).toEqual(['d', 'c', 'b', 'a'])
})

test('handles complex graphs with interlocking cycles and shared leaf nodes', () => {
  const packages = [
    { location: '.', name: undefined, dependencies: ['a', 'b'] },
    { location: 'a', name: 'a', dependencies: ['b', 'd'] },
    { location: 'b', name: 'b', dependencies: ['c'] },
    { location: 'c', name: 'c', dependencies: ['b', 'd', 'x'] },
    { location: 'd', name: 'd', dependencies: ['a', 'x'] },
  ] as Package[]

  expect(getPackageDirs(sortPackages(packages))).toEqual([
    'd',
    'c',
    'b',
    'a',
    '.',
  ])
})
