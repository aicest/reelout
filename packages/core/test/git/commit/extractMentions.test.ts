// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { extractMentions } from '@reelout/core'
import { expect, test } from 'vitest'

test('returns an empty array when input string is empty', () => {
  expect(extractMentions('')).toEqual([])
})

test('returns a single mention handle when text contains a standard mention', () => {
  const input = `Hello @alpha_user, welcome to the platform!`

  expect(extractMentions(input)).toEqual(['alpha_user'])
})

test('returns the mention handle when positioned at the start of the input string', () => {
  const input = `@beta_dev please review this pull request.`

  expect(extractMentions(input)).toEqual(['beta_dev'])
})

test('returns the mention handle when positioned at the end of the input string with or without terminal punctuation', () => {
  const input1 = `Great job @gamma_dev.`
  const input2 = `Great job @gamma_dev`

  expect(extractMentions(input1)).toEqual(['gamma_dev'])
  expect(extractMentions(input2)).toEqual(['gamma_dev'])
})

test('returns unique mention handles and removes duplicates when multiple identical mentions are present', () => {
  const input = `Hey @delta-01 and @epsilon_02, @delta-01 check this out.`

  expect(extractMentions(input)).toEqual(['delta-01', 'epsilon_02'])
})

test('returns mention handles correctly when surrounded by various punctuation marks', () => {
  const input = `Shoutout to @zeta, @eta! and (@theta).`

  expect(extractMentions(input)).toEqual(['zeta', 'eta', 'theta'])
})

test('ignores standard email addresses while successfully extracting valid adjacent mentions', () => {
  const input1 = `Reach out to support@example.com or contact @iota_user directly.`
  const input2 = `Contact us via help@mail.example.com for support.`

  expect(extractMentions(input1)).toEqual(['iota_user'])
  expect(extractMentions(input2)).toEqual([])
})

test('ignores local part prefixes and email-like patterns that lack valid preceding boundaries', () => {
  const input1 = `Visit user@example.com or test_@kappa_001 for details.`
  const input2 = `thisIsA@notamention and lambda@example.com should be ignored`

  expect(extractMentions(input1)).toEqual([])
  expect(extractMentions(input2)).toEqual([])
})

test('ignores domain-like handles while successfully extracting valid mention handles', () => {
  const input1 = `This is not a mention: @example.com but this is: @mu_service`
  const input2 = `Please check @status.example.com for status updates.`

  expect(extractMentions(input1)).toEqual(['mu_service'])
  expect(extractMentions(input2)).toEqual([])
})

test('ignores package and scoped package specifications containing version strings while extracting valid mentions', () => {
  const input = `Install package@1.0.0 or @scope/package@2.1.3, but mention @nu_user safely.`

  expect(extractMentions(input)).toEqual(['nu_user'])
})
