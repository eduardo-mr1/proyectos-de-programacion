# Tokenizacion y normalizacion

Antes de indexar, el texto se convierte en tokens. El proceso baja todo a
minusculas, quita acentos y corta por cualquier caracter que no sea letra o
numero. Sin esa normalizacion, busqueda y busqueda con acento serian terminos
distintos y el usuario no encontraria lo que busca.

Las stopwords son palabras tan frecuentes que no distinguen un documento de
otro: articulos, preposiciones y conjunciones. Quitarlas reduce el tamano del
indice y evita que el ranking se contamine con coincidencias sin valor.
