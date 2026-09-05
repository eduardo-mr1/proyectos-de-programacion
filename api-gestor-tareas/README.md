# API Gestor de Tareas

API REST para gestionar tareas por usuario, con autenticacion JWT.

## Stack

- Node.js + Express 5
- SQLite (better-sqlite3) como base de datos embebida
- JWT (jsonwebtoken) para autenticacion
- bcryptjs para hash de contrasenas
- Zod para validacion de entrada
- Test runner nativo de Node (`node:test`) - sin dependencias extra de testing

## Endpoints

| Metodo | Ruta | Descripcion | Auth |
|---|---|---|---|
| POST | /auth/register | Crear cuenta, devuelve JWT | No |
| POST | /auth/login | Iniciar sesion, devuelve JWT | No |
| GET | /tasks?limit=50&offset=0 | Listar tareas del usuario autenticado, paginado | Si |
| POST | /tasks | Crear tarea | Si |
| PATCH | /tasks/:id | Editar titulo o marcar como completada | Si |
| DELETE | /tasks/:id | Eliminar tarea | Si |

## Como correrlo

```bash
npm install
npm start        # levanta en http://localhost:3000
npm test         # corre la suite de pruebas
```

## Contrato de `GET /tasks`

```json
{ "tasks": [ { "id": 1, "title": "Ejemplo", "done": false } ], "total": 12, "limit": 50, "offset": 0 }
```

`limit` acepta de 1 a 200 (50 por defecto). `done` es booleano en la entrada y
en la salida.

## Reglas de validacion

| Campo | Regla |
|---|---|
| `email` | Se normaliza a minusculas y se recortan espacios: `Usuario@X.com` y `usuario@x.com` son la misma cuenta |
| `password` | Minimo 8 caracteres, se rechazan las contrasenas mas comunes de las filtraciones publicas |
| `title` | Se recorta, entre 1 y 200 caracteres |

`POST /auth/login` limita a 5 intentos fallidos por email cada 15 minutos y
responde `429` con cabecera `Retry-After`.

## Diseno

- Cada usuario solo puede ver/editar sus propias tareas (aislamiento por `user_id` en cada query).
- Contrasenas nunca se guardan en texto plano (bcrypt).
- Validacion de entrada con Zod antes de tocar la base de datos.
- Pruebas de integracion levantan la app completa en memoria (`:memory:`) y pegan por HTTP real con `fetch`, sin mocks.
