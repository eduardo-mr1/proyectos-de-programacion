import { InvertedIndex } from './inverted-index.js';
import { tokenize } from './tokenizer.js';
import { bm25TermScore } from './bm25.js';

/**
 * Motor de busqueda de texto completo.
 *
 * Une las tres piezas: el tokenizador normaliza, el indice invertido
 * responde "que documentos contienen este termino" y BM25 los ordena
 * por relevancia.
 */
export class SearchEngine {
  constructor() {
    this.index = new InvertedIndex();
  }

  get size() {
    return this.index.size;
  }

  addDocument(id, text, metadata = {}) {
    this.index.add(id, text, { ...metadata, text });
  }

  addAll(documents) {
    for (const { id, text, ...metadata } of documents) {
      this.addDocument(id, text, metadata);
    }
  }

  /**
   * Busca y devuelve resultados ordenados por relevancia.
   *
   * El costo NO depende del tamano del corpus, sino de cuantos documentos
   * contienen los terminos buscados: se acumulan puntajes solo sobre los
   * postings de la consulta, no sobre los N documentos.
   *
   * @returns {Array<{id, score, ...metadata}>}
   */
  search(query, { limit = 10 } = {}) {
    const terms = tokenize(query);
    if (terms.length === 0) return [];

    const totalDocs = this.index.size;
    const avgDocLength = this.index.averageDocLength;
    const scores = new Map();

    for (const term of terms) {
      const posting = this.index.getPosting(term);
      const docFrequency = posting.size;
      if (docFrequency === 0) continue; // termino ausente del corpus

      for (const [docId, termFrequency] of posting) {
        const score = bm25TermScore({
          termFrequency,
          docLength: this.index.getDocLength(docId),
          avgDocLength,
          totalDocs,
          docFrequency,
        });
        scores.set(docId, (scores.get(docId) || 0) + score);
      }
    }

    return [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([docId, score]) => ({ ...this.index.getDocument(docId), score }));
  }
}
