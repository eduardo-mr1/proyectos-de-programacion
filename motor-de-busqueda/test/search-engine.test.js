import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SearchEngine } from '../src/search-engine.js';

function buildEngine() {
  const engine = new SearchEngine();
  engine.addAll([
    { id: 'd1', title: 'Indice invertido', text: 'el indice invertido mapea terminos a documentos y acelera la busqueda de texto' },
    { id: 'd2', title: 'Busqueda lineal', text: 'la busqueda lineal recorre cada documento del corpus una y otra vez' },
    { id: 'd3', title: 'Ranking BM25', text: 'bm25 ordena resultados por relevancia usando frecuencia y largo del documento' },
    { id: 'd4', title: 'Pruebas', text: 'las pruebas automatizadas detectan regresiones antes de llegar a produccion' },
  ]);
  return engine;
}

test('encuentra el documento que contiene el termino', () => {
  const results = buildEngine().search('invertido');
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'd1');
});

test('un termino ausente no devuelve resultados', () => {
  assert.deepEqual(buildEngine().search('kubernetes'), []);
});

test('una consulta solo de stopwords no devuelve resultados', () => {
  assert.deepEqual(buildEngine().search('el de la'), []);
});

test('ordena por relevancia: el documento con mas terminos de la consulta va primero', () => {
  const results = buildEngine().search('busqueda indice invertido');
  assert.equal(results[0].id, 'd1', 'd1 tiene los tres terminos, d2 solo uno');
});

test('los puntajes vienen en orden descendente', () => {
  const results = buildEngine().search('busqueda documento relevancia');
  const scores = results.map((r) => r.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
});

test('respeta el limite de resultados', () => {
  assert.equal(buildEngine().search('busqueda documento', { limit: 1 }).length, 1);
});

test('la busqueda ignora acentos y mayusculas', () => {
  const conAcento = buildEngine().search('BÚSQUEDA');
  const sinAcento = buildEngine().search('busqueda');
  assert.deepEqual(conAcento.map((r) => r.id), sinAcento.map((r) => r.id));
});

test('devuelve la metadata del documento junto al puntaje', () => {
  const [top] = buildEngine().search('invertido');
  assert.equal(top.title, 'Indice invertido');
  assert.ok(top.score > 0);
});

test('un motor vacio no rompe', () => {
  assert.deepEqual(new SearchEngine().search('cualquier cosa'), []);
});
