import { test } from 'node:test';
import assert from 'node:assert/strict';
import { naiveSearch } from '../src/naive-search.js';
import { SearchEngine } from '../src/search-engine.js';

const DOCS = [
  { id: 'd1', text: 'el indice invertido acelera la busqueda de texto completo' },
  { id: 'd2', text: 'la busqueda lineal recorre todo el corpus en cada consulta' },
  { id: 'd3', text: 'bm25 ordena los resultados por relevancia' },
  { id: 'd4', text: 'las pruebas automatizadas detectan regresiones' },
];

// Esta es la prueba que le da valor al benchmark: si las dos
// implementaciones no devolvieran lo mismo, comparar sus tiempos
// no probaria nada.
test('la busqueda lineal y la indexada devuelven el mismo ranking', () => {
  const engine = new SearchEngine();
  engine.addAll(DOCS);

  for (const query of ['busqueda', 'indice invertido', 'busqueda corpus relevancia', 'pruebas']) {
    const conIndice = engine.search(query).map((r) => r.id);
    const sinIndice = naiveSearch(DOCS, query).map((r) => r.id);
    assert.deepEqual(sinIndice, conIndice, `difieren para la consulta "${query}"`);
  }
});

test('la busqueda lineal ignora terminos ausentes', () => {
  assert.deepEqual(naiveSearch(DOCS, 'kubernetes'), []);
});
