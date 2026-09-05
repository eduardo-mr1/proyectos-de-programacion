import { tokenize } from './tokenizer.js';
import { bm25TermScore } from './bm25.js';

/**
 * Busqueda lineal: la version sin indice, para comparar.
 *
 * Hace exactamente lo mismo que SearchEngine pero sin estructura previa:
 * en cada consulta recorre y tokeniza TODOS los documentos del corpus.
 *
 * Complejidad por consulta: O(N * largo del documento).
 * La del motor con indice: O(k) sobre los k documentos que si contienen
 * los terminos, sin tocar el resto del corpus.
 *
 * Existe solo para el benchmark; no es codigo de produccion.
 */
export function naiveSearch(documents, query, { limit = 10 } = {}) {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  // Sin indice hay que tokenizar todo el corpus en cada consulta.
  const tokenized = documents.map((doc) => ({ doc, tokens: tokenize(doc.text) }));
  const totalDocs = tokenized.length;
  const avgDocLength = tokenized.reduce((sum, d) => sum + d.tokens.length, 0) / (totalDocs || 1);

  // Y tambien recorrerlo otra vez para saber en cuantos aparece cada termino.
  const docFrequencies = new Map();
  for (const term of terms) {
    let count = 0;
    for (const { tokens } of tokenized) {
      if (tokens.includes(term)) count++;
    }
    docFrequencies.set(term, count);
  }

  const results = [];
  for (const { doc, tokens } of tokenized) {
    let score = 0;
    for (const term of terms) {
      const docFrequency = docFrequencies.get(term);
      if (docFrequency === 0) continue;
      const termFrequency = tokens.filter((t) => t === term).length;
      score += bm25TermScore({
        termFrequency,
        docLength: tokens.length,
        avgDocLength,
        totalDocs,
        docFrequency,
      });
    }
    if (score > 0) results.push({ ...doc, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
