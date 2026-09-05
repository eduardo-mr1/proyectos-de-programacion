// Stopwords del espanol: palabras tan frecuentes que no aportan poder de
// discriminacion. Sacarlas reduce el tamano del indice y mejora el ranking.
const STOPWORDS = new Set([
  'a', 'al', 'algo', 'ante', 'antes', 'como', 'con', 'contra', 'cual', 'cuando',
  'de', 'del', 'desde', 'donde', 'durante', 'e', 'el', 'ella', 'ellas', 'ellos',
  'en', 'entre', 'era', 'es', 'esa', 'ese', 'eso', 'esta', 'este', 'esto',
  'ha', 'hasta', 'hay', 'la', 'las', 'le', 'les', 'lo', 'los', 'mas', 'me',
  'mi', 'mientras', 'muy', 'ni', 'no', 'nos', 'o', 'para', 'pero', 'por',
  'porque', 'que', 'se', 'sea', 'segun', 'ser', 'si', 'sin', 'sobre', 'son',
  'su', 'sus', 'tambien', 'te', 'tiene', 'todo', 'tras', 'tu', 'un', 'una',
  'uno', 'unos', 'y', 'ya',
]);

const MIN_LENGTH = 2;

/**
 * Normaliza texto: minusculas y sin acentos.
 * NFD separa la letra de su tilde, y el rango ̀-ͯ borra las tildes
 * sueltas. Asi "Programacion" y "programación" caen en el mismo token.
 */
export function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Convierte texto libre en la lista de terminos que van al indice.
 * Corta por cualquier cosa que no sea letra o numero, descarta stopwords
 * y tokens de una sola letra.
 */
export function tokenize(text) {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= MIN_LENGTH && !STOPWORDS.has(token));
}

export { STOPWORDS };
