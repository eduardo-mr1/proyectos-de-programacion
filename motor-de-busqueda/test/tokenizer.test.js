import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, tokenize } from '../src/tokenizer.js';

test('normalize baja a minusculas y quita acentos', () => {
  assert.equal(normalize('Programación ÁGIL'), 'programacion agil');
});

test('tokenize separa por signos de puntuacion', () => {
  assert.deepEqual(tokenize('indice,invertido;busqueda'), ['indice', 'invertido', 'busqueda']);
});

test('tokenize descarta stopwords', () => {
  assert.deepEqual(tokenize('el indice de la busqueda'), ['indice', 'busqueda']);
});

test('tokenize descarta tokens de una sola letra', () => {
  assert.deepEqual(tokenize('a b indice'), ['indice']);
});

test('palabras con y sin acento producen el mismo token', () => {
  assert.deepEqual(tokenize('busqueda'), tokenize('búsqueda'));
});

test('texto vacio produce lista vacia', () => {
  assert.deepEqual(tokenize('   '), []);
});
