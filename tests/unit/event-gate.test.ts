import assert from 'node:assert/strict'
import { test } from 'node:test'
import { EventGate } from '../../src/realtime/event-gate.ts'

const event = (eventId: string, version: number, id = 'a') => ({
  eventId,
  version,
  resource: { type: 'nft', id },
})

test('descarta duplicatas e versões antigas, por recurso', () => {
  const gate = new EventGate()
  assert.equal(gate.accept(event('1', 2)), true)
  assert.equal(gate.accept(event('1', 2)), false, 'mesmo eventId')
  assert.equal(gate.accept(event('2', 2)), false, 'mesma versão com outro id')
  assert.equal(gate.accept(event('3', 1)), false, 'versão antiga')
  assert.equal(gate.accept(event('4', 3)), true)
  assert.equal(gate.accept(event('5', 1, 'b')), true, 'outro recurso tem contagem própria')
})
