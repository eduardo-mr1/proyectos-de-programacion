import { tokenize } from './tokenizer.js';

/**
 * Indice invertido: en vez de guardar "documento -> palabras", guarda
 * "palabra -> documentos que la contienen".
 *
 * Esa vuelta es la idea central del proyecto. Buscar un termino deja de
 * costar O(N * largo del documento) -recorrer todo el corpus- y pasa a
 * costar O(1) para llegar a la lista y O(k) para recorrer los k documentos
 * que si contienen el termino.
 *
 * Estructura: Map<termino, Map<docId, frecuencia>>
 */
export class InvertedIndex {
  constructor() {
    this.postings = new Map();   // termino -> Map<docId, frecuencia>
    this.docLengths = new Map(); // docId  -> cantidad de tokens
    this.documents = new Map();  // docId  -> metadata original
  }

  get size() {
    return this.documents.size;
  }

  get vocabularySize() {
    return this.postings.size;
  }

  /** Largo promedio de documento, que BM25 usa para normalizar. */
  get averageDocLength() {
    if (this.docLengths.size === 0) return 0;
    let total = 0;
    for (const length of this.docLengths.values()) total += length;
    return total / this.docLengths.size;
  }

  add(docId, text, metadata = {}) {
    if (this.documents.has(docId)) {
      throw new Error(`El documento "${docId}" ya esta indexado`);
    }

    const tokens = tokenize(text);
    this.documents.set(docId, { id: docId, ...metadata });
    this.docLengths.set(docId, tokens.length);

    // Se cuenta la frecuencia por documento en una sola pasada.
    const frequencies = new Map();
    for (const token of tokens) {
      frequencies.set(token, (frequencies.get(token) || 0) + 1);
    }

    for (const [term, frequency] of frequencies) {
      let posting = this.postings.get(term);
      if (!posting) {
        posting = new Map();
        this.postings.set(term, posting);
      }
      posting.set(docId, frequency);
    }
  }

  /** Documentos que contienen el termino, con su frecuencia. */
  getPosting(term) {
    return this.postings.get(term) || new Map();
  }

  /** Document frequency: en cuantos documentos aparece el termino. */
  documentFrequency(term) {
    return this.getPosting(term).size;
  }

  getDocument(docId) {
    return this.documents.get(docId);
  }

  getDocLength(docId) {
    return this.docLengths.get(docId) || 0;
  }
}
