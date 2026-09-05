import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InvertedIndex } from '../src/inverted-index.js';

function buildIndex() {
  const index = new InvertedIndex();
  index.add('d1', 'el indice invertido acelera la busqueda', { title: 'Indices' });
  index.add('d2', 'la busqueda lineal recorre todo el corpus', { title: 'Lineal' });
  index.add('d3', 'ranking y relevancia en un motor de busqueda', { title: 'Ranking' });
  return index;
}

test('indexa la cantidad correcta de documentos', () => {
  assert.equal(buildIndex().size, 3);
});

test('un termino apunta a todos los documentos que lo contienen', () => {
  const posting = buildIndex().getPosting('busqueda');
  assert.deepEqual([...posting.keys()].sort(), ['d1', 'd2', 'd3']);
});

test('un termino exclusivo apunta a un solo documento', () => {
  assert.deepEqual([...buildIndex().getPosting('invertido').keys()], ['d1']);
});

test('registra la frecuencia del termino dentro del documento', () => {
  const index = new InvertedIndex();
  index.add('d1', 'indice indice indice busqueda');
  assert.equal(index.getPosting('indice').get('d1'), 3);
  assert.equal(index.getPosting('busqueda').get('d1'), 1);
});

test('document frequency cuenta documentos, no repeticiones', () => {
  const index = new InvertedIndex();
  index.add('d1', 'indice indice indice');
  index.add('d2', 'indice');
  assert.equal(index.documentFrequency('indice'), 2);
});

test('un termino inexistente devuelve posting vacio', () => {
  assert.equal(buildIndex().getPosting('kubernetes').size, 0);
});

test('el largo del documento no cuenta stopwords', () => {
  const index = new InvertedIndex();
  index.add('d1', 'el indice de la busqueda');
  assert.equal(index.getDocLength('d1'), 2);
});

test('indexar dos veces el mismo id lanza error', () => {
  const index = buildIndex();
  assert.throws(() => index.add('d1', 'otro texto'), /ya esta indexado/);
});

test('calcula el largo promedio de documento', () => {
  const index = new InvertedIndex();
  index.add('d1', 'indice busqueda');                  // 2 tokens
  index.add('d2', 'indice busqueda ranking relevancia'); // 4 tokens
  assert.equal(index.averageDocLength, 3);
});
