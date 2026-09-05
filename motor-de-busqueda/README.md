# Motor de busqueda

Motor de busqueda de texto completo con indice invertido y ranking BM25.
Cero dependencias externas: solo la libreria estandar de Node.

```bash
npm run search -- "indice invertido complejidad"
npm test
npm run bench
```

```
"indice invertido complejidad" -> 4 resultado(s) en 0.36 ms (8 documentos indexados)

1. Indice invertido  [4.698]
2. Bases de datos relacionales  [2.223]
3. Complejidad algoritmica  [1.316]
4. Tokenizacion y normalizacion  [0.979]
```

## Como funciona

Tres piezas independientes:

| Archivo | Responsabilidad |
|---|---|
| `src/tokenizer.js` | Normaliza el texto (minusculas, sin acentos) y lo corta en terminos, descartando stopwords |
| `src/inverted-index.js` | Guarda `termino -> {documento: frecuencia}` en vez de `documento -> palabras` |
| `src/bm25.js` | Calcula que tan relevante es un documento para un termino |
| `src/search-engine.js` | Une las tres y devuelve resultados ordenados |

### Por que un indice invertido

La estructura natural seria guardar cada documento con sus palabras. Buscar asi
obliga a recorrer y tokenizar el corpus completo en cada consulta:
**O(N x largo del documento)**.

El indice invertido guarda la relacion al reves. Llegar a la lista de un termino
es **O(1)** sobre una tabla hash, y despues solo se recorren los documentos que
si contienen ese termino: **O(k)**, con k = documentos que coinciden.

El costo de una consulta deja de depender del tamano del corpus y pasa a
depender de cuantos documentos coinciden.

### Por que BM25 y no TF-IDF

BM25 corrige dos problemas concretos de TF-IDF plano:

1. **Satura la frecuencia.** En TF-IDF, repetir un termino 100 veces puntua 100
   veces mas, lo que premia el relleno. BM25 aplana esa curva: el puntaje tiende
   a un techo de `idf x (k1 + 1)`.
2. **Normaliza por largo.** Sin correccion, los documentos largos ganan solo por
   acumular ocurrencias de cualquier cosa.

Es la misma funcion que usan Lucene y Elasticsearch por defecto.

## Resultados del benchmark

`npm run bench` compara el motor contra `naiveSearch`, que implementa el mismo
ranking sin indice. Mediana de 5 corridas, corpus sintetico de 50 temas:

| Documentos | Construir indice | Consulta | Docs que coinciden | Lineal | Con indice | Mejora |
|---|---|---|---|---|---|---|
| 1.000 | 63 ms | comun | 1.000 | 17.01 ms | 1.506 ms | 11x |
| 1.000 | 63 ms | selectiva | 20 | 16.51 ms | 0.057 ms | **290x** |
| 5.000 | 108 ms | comun | 5.000 | 63.54 ms | 3.474 ms | 18x |
| 5.000 | 108 ms | selectiva | 99 | 63.34 ms | 0.107 ms | **593x** |
| 20.000 | 946 ms | comun | 20.000 | 330.38 ms | 23.421 ms | 14x |
| 20.000 | 946 ms | selectiva | 399 | 295.95 ms | 1.263 ms | **234x** |

La diferencia entre las dos filas es lo interesante. Con un termino comun la
lista contiene casi todo el corpus, asi que la mejora es acotada. Con un termino
selectivo el motor solo toca los documentos que coinciden y nunca mira el resto.

El indice cuesta construirlo una vez; a partir de la segunda consulta ya salio
mas barato que escanear.

### Una nota sobre como se genera el corpus

La primera version del benchmark generaba documentos tomando palabras al azar de
un vocabulario unico. El resultado daba una mejora constante de 15x, sin importar
el tamano del corpus, y el tiempo indexado crecia linealmente.

La causa no era el indice sino el corpus: con vocabulario uniforme, cada termino
terminaba apareciendo en practicamente todos los documentos, asi que la lista de
un termino era el corpus entero y el indice degeneraba a un escaneo completo.
El corpus actual reparte el vocabulario por temas, que es como se comporta el
texto real.

## Pruebas

33 pruebas con el test runner nativo de Node (`node:test`), sin frameworks.

La mas importante es la de `test/naive-search.test.js`: verifica que la busqueda
lineal y la indexada devuelvan **el mismo ranking**. Sin esa garantia, comparar
sus tiempos no probaria nada — seria facil ser rapido devolviendo resultados
peores.

## Limitaciones conocidas

- **El indice vive en memoria.** No hay persistencia: reiniciar obliga a
  reconstruirlo. Para un corpus grande habria que serializarlo a disco.
- **Sin stemming.** "documento" y "documentos" son terminos distintos. Un
  stemmer del espanol mejoraria el recall.
- **Sin busqueda por frase.** El indice guarda frecuencias, no posiciones;
  buscar "indice invertido" como frase exacta requeriria un indice posicional.
- **Sin correccion ortografica** ni busqueda difusa.
