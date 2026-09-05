/**
 * BM25: la funcion de ranking que usan Elasticsearch y Lucene.
 *
 * Se eligio sobre TF-IDF plano por dos razones:
 *
 * 1. Satura la frecuencia del termino. En TF-IDF, un documento que repite
 *    "busqueda" 100 veces puntua 100 veces mas que uno que la menciona una
 *    vez, lo cual premia el relleno. El factor (f * (k1+1)) / (f + k1...)
 *    crece rapido al principio y luego se aplana.
 *
 * 2. Normaliza por largo. Sin eso, los documentos largos ganan siempre por
 *    tener mas ocurrencias de cualquier cosa. El parametro b controla
 *    cuanto pesa esa correccion.
 */

// Valores estandar de la literatura; funcionan bien sin ajuste fino.
export const K1 = 1.5; // saturacion de frecuencia
export const B = 0.75; // fuerza de la normalizacion por largo

/**
 * IDF con suavizado. Un termino que aparece en casi todos los documentos
 * distingue poco, asi que su peso tiende a cero. El +0.5 y el +1 evitan
 * dividir por cero y evitan IDF negativo.
 */
export function idf(totalDocs, docFrequency) {
  return Math.log(1 + (totalDocs - docFrequency + 0.5) / (docFrequency + 0.5));
}

/**
 * Puntaje de un termino para un documento.
 *
 * @param {number} termFrequency  veces que el termino aparece en el documento
 * @param {number} docLength      tokens del documento
 * @param {number} avgDocLength   largo promedio del corpus
 */
export function bm25TermScore({ termFrequency, docLength, avgDocLength, totalDocs, docFrequency }) {
  if (termFrequency === 0) return 0;

  const inverseDocFreq = idf(totalDocs, docFrequency);
  const lengthNorm = 1 - B + B * (docLength / (avgDocLength || 1));
  const saturated = (termFrequency * (K1 + 1)) / (termFrequency + K1 * lengthNorm);

  return inverseDocFreq * saturated;
}
