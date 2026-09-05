import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SearchEngine } from './search-engine.js';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');

/** Carga todos los .md y .txt de una carpeta y los indexa. */
export async function buildEngineFromDir(dir = DATA_DIR) {
  const engine = new SearchEngine();
  const files = (await readdir(dir)).filter((f) => ['.md', '.txt'].includes(extname(f)));

  for (const file of files) {
    const text = await readFile(join(dir, file), 'utf8');
    const firstHeading = text.match(/^#\s+(.+)$/m);
    engine.addDocument(file, text, {
      title: firstHeading ? firstHeading[1] : basename(file, extname(file)),
      path: join(dir, file),
    });
  }
  return engine;
}

/** Muestra el fragmento del documento alrededor de la primera coincidencia. */
function snippet(text, query, length = 160) {
  const firstTerm = query.toLowerCase().split(/\s+/)[0];
  const position = text.toLowerCase().indexOf(firstTerm);
  const start = position === -1 ? 0 : Math.max(0, position - 40);
  return text.slice(start, start + length).replace(/\s+/g, ' ').trim();
}

async function main() {
  const query = process.argv.slice(2).join(' ');
  if (!query) {
    console.error('Uso: npm run search -- "tu consulta"');
    process.exit(1);
  }

  const engine = await buildEngineFromDir();
  const started = performance.now();
  const results = engine.search(query, { limit: 5 });
  const elapsed = (performance.now() - started).toFixed(2);

  console.log(`\n"${query}" -> ${results.length} resultado(s) en ${elapsed} ms (${engine.size} documentos indexados)\n`);

  if (results.length === 0) {
    console.log('Sin coincidencias.\n');
    return;
  }

  results.forEach((result, i) => {
    console.log(`${i + 1}. ${result.title}  [${result.score.toFixed(3)}]`);
    console.log(`   ${snippet(result.text, query)}...\n`);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
