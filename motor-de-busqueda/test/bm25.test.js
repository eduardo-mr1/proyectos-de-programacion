import { test } from 'node:test';
import assert from 'node:assert/strict';
import { idf, bm25TermScore, K1 } from '../src/bm25.js';

const base = { docLength: 100, avgDocLength: 100, totalDocs: 1000, docFrequency: 10 };

test('un termino raro pesa mas que uno comun', () => {
  assert.ok(idf(1000, 5) > idf(1000, 500));
});

test('el idf nunca es negativo, ni con terminos en todos los documentos', () => {
  assert.ok(idf(1000, 1000) >= 0);
});

test('frecuencia cero puntua cero', () => {
  assert.equal(bm25TermScore({ ...base, termFrequency: 0 }), 0);
});

test('mas frecuencia da mas puntaje', () => {
  const uno = bm25TermScore({ ...base, termFrequency: 1 });
  const cinco = bm25TermScore({ ...base, termFrequency: 5 });
  assert.ok(cinco > uno);
});

test('la frecuencia satura: repetir 100 veces no vale 100 veces mas', () => {
  const uno = bm25TermScore({ ...base, termFrequency: 1 });
  const cien = bm25TermScore({ ...base, termFrequency: 100 });
  assert.ok(cien < uno * 10, 'el puntaje deberia aplanarse, no crecer linealmente');
});

test('el puntaje tiende al techo teorico idf*(k1+1)', () => {
  const enorme = bm25TermScore({ ...base, termFrequency: 1e6 });
  const techo = idf(base.totalDocs, base.docFrequency) * (K1 + 1);
  assert.ok(enorme < techo);
  assert.ok(enorme > techo * 0.99);
});

test('a igual frecuencia, el documento mas corto puntua mas alto', () => {
  const corto = bm25TermScore({ ...base, termFrequency: 3, docLength: 50 });
  const largo = bm25TermScore({ ...base, termFrequency: 3, docLength: 500 });
  assert.ok(corto > largo);
});
