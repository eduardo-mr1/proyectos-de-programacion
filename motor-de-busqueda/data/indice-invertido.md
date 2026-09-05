# Indice invertido

Un indice invertido es la estructura de datos que hace posible la busqueda de
texto a gran escala. En lugar de guardar la relacion natural documento a
palabras, guarda la relacion inversa: cada termino apunta a la lista de
documentos donde aparece, junto con la frecuencia con la que aparece en cada uno.

La ventaja es de complejidad. Buscar recorriendo todos los documentos cuesta
tiempo proporcional al tamano total del corpus. Con un indice invertido, llegar a
la lista de un termino es una operacion de tiempo constante sobre una tabla hash,
y despues solo se recorren los documentos que si contienen ese termino.
