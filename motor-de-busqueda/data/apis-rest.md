# Diseno de APIs REST

Una API REST expone recursos identificados por rutas y manipulados con los
verbos del protocolo HTTP. Obtener con GET, crear con POST, actualizar con PATCH
o PUT y eliminar con DELETE.

Los codigos de estado comunican el resultado sin que el cliente tenga que
interpretar el cuerpo de la respuesta. El 200 indica exito, el 201 que se creo
un recurso, el 400 que la peticion venia mal formada, el 401 que falta
autenticacion y el 404 que el recurso no existe.
