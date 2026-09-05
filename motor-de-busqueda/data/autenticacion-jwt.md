# Autenticacion con JWT

Un JSON Web Token es una cadena firmada que transporta informacion sobre el
usuario. El servidor la firma al iniciar sesion y la verifica en cada peticion
posterior, sin necesidad de guardar sesiones en memoria ni en base de datos.

La firma garantiza que el contenido no fue alterado, pero no lo oculta: el
payload va codificado en base64 y cualquiera puede leerlo. Por eso nunca se
guardan contrasenas ni datos sensibles dentro del token.
