import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addEth, formatEth, multiplyEth, percentOfEth, subtractEth } from '../../src/lib/eth.ts'

test('soma sem erro de ponto flutuante', () => {
  assert.equal(addEth('0.1', '0.2'), '0.3')
  assert.equal(addEth('2.38', '8.34', '16.11'), '26.83')
  assert.equal(addEth('26.83', '0.016'), '26.846')
})

test('multiplica, desconta e subtrai mantendo 18 casas', () => {
  assert.equal(multiplyEth('1.19', 2), '2.38')
  assert.equal(percentOfEth('26.83', 1000), '2.683')
  assert.equal(subtractEth('1', '0.000000000000000001'), '0.999999999999999999')
  assert.throws(() => multiplyEth('1', 1.5))
})

test('formata com no mínimo 2 casas e sem cortar precisão', () => {
  assert.equal(formatEth('1.2'), '1.20')
  assert.equal(formatEth('26.846'), '26.846')
  assert.equal(formatEth('0'), '0.00')
})
