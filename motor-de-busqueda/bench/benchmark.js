import { SearchEngine } from '../src/search-engine.js';
import { naiveSearch } from '../src/naive-search.js';

const CORPUS_SIZES = [1000, 5000, 20000];
const REPETITIONS = 5;
const TOPICS = 50;

// En texto real el vocabulario no se reparte parejo: unas pocas palabras
// aparecen en casi todos los documentos y la mayoria aparece en muy pocos.
// El corpus sintetico imita eso, porque de ello depende toda la ventaja del
// indice: si cada termino estuviera en todos los documentos, recorrer la
// lista de un termino seria lo mismo que recorrer el corpus entero.
const COMMON_WORDS = ['documento', 'datos', 'sistema', 'proceso', 'resultado', 'informacion'];
const TOPIC_WORDS = Array.from({ length: TOPICS }, (_, t) =>
  Array.from({ length: 6 }, (_, w) => `tema${t}termino${w}`)
);

function generateCorpus(count) {
  let seed = 42; // corpus determinista: mismo resultado en cada corrida
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  return Array.from({ length: count }, (_, i) => {
    const topic = i % TOPICS;
    const words = [];
    for (let j = 0; j < 60; j++) {
      // 40% palabras comunes, 60% del vocabulario propio del tema
      words.push(random() < 0.4
        ? COMMON_WORDS[Math.floor(random() * COMMON_WORDS.length)]
        : TOPIC_WORDS[topic][Math.floor(random() * TOPIC_WORDS[topic].length)]);
    }
    return { id: `doc-${i}`, title: `Documento ${i}`, text: words.join(' ') };
  });
}

const time = (fn) => { const t = performance.now(); fn(); return performance.now() - t; };
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

function measure(corpus, engine, query) {
  const naive = [];
  const indexed = [];
  for (let i = 0; i < REPETITIONS; i++) {
    naive.push(time(() => naiveSearch(corpus, query)));
    indexed.push(time(() => engine.search(query)));
  }
  return { naive: median(naive), indexed: median(indexed) };
}

console.log('\nIndice invertido vs busqueda lineal');
console.log(`Mediana de ${REPETITIONS} corridas. Corpus sintetico de ${TOPICS} temas.\n`);
console.log('| Documentos | Construir indice | Consulta | Docs que coinciden | Lineal | Con indice | Mejora |');
console.log('|---|---|---|---|---|---|---|');

for (const size of CORPUS_SIZES) {
  const corpus = generateCorpus(size);
  const engine = new SearchEngine();
  const buildTime = time(() => engine.addAll(corpus)); // se paga una sola vez

  const cases = [
    ['comun (documento datos)', 'documento datos'],
    ['selectiva (tema7termino0)', 'tema7termino0'],
  ];

  for (const [label, query] of cases) {
    const { naive, indexed } = measure(corpus, engine, query);
    const matches = engine.search(query, { limit: Infinity }).length;
    console.log(
      `| ${size.toLocaleString('es')} | ${buildTime.toFixed(0)} ms | ${label} | ${matches.toLocaleString('es')} | ` +
      `${naive.toFixed(2)} ms | ${indexed.toFixed(3)} ms | ${(naive / indexed).toFixed(0)}x |`
    );
  }
}

console.log(`
Lectura de los numeros:

- El indice se construye una vez y se amortiza en cada consulta posterior.
- Con un termino comun la mejora existe pero es acotada: la lista de ese
  termino contiene casi todo el corpus, asi que igual hay que recorrer mucho.
- Con un termino selectivo la mejora se dispara, porque el motor solo toca los
  documentos que realmente contienen el termino y nunca mira el resto.

Esa es la propiedad clave: el costo de una consulta indexada depende de cuantos
documentos coinciden, no de cuantos documentos existen.
`);
