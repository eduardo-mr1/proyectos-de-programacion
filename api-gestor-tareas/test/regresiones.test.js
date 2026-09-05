// Una prueba por cada hallazgo del reporte de bugs del repo proyectos-de-qa.
// Cada una falla si el defecto correspondiente vuelve a aparecer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, registerAndLogin } from './helpers.js';

const json = { 'Content-Type': 'application/json' };
const post = (base, ruta, cuerpo, token) => fetch(`${base()}${ruta}`, {
  method: 'POST',
  headers: token ? { ...json, Authorization: `Bearer ${token}` } : json,
  body: JSON.stringify(cuerpo),
});

test('BUG-001: el email no distingue mayusculas al registrarse', async () => {
  const { server, base } = startTestApp();
  try {
    await post(base, '/auth/register', { email: 'caso@test.com', password: 'secret123' });
    const duplicado = await post(base, '/auth/register', { email: 'CASO@test.com', password: 'secret123' });
    assert.equal(duplicado.status, 409, 'un email con otra capitalizacion no debe crear una cuenta nueva');
  } finally { server.close(); }
});

test('BUG-001: el login funciona con cualquier capitalizacion del email', async () => {
  const { server, base } = startTestApp();
  try {
    await post(base, '/auth/register', { email: 'persona@test.com', password: 'secret123' });
    const login = await post(base, '/auth/login', { email: 'PeRsOnA@test.com', password: 'secret123' });
    assert.equal(login.status, 200);
  } finally { server.close(); }
});

test('BUG-001: el email se guarda normalizado y con los espacios recortados', async () => {
  const { server, base } = startTestApp();
  try {
    await post(base, '/auth/register', { email: '  Mixto@Test.com  ', password: 'secret123' });
    const login = await post(base, '/auth/login', { email: 'mixto@test.com', password: 'secret123' });
    assert.equal(login.status, 200);
  } finally { server.close(); }
});

test('BUG-002: bloquea tras varios intentos fallidos de login', async () => {
  const { server, base } = startTestApp();
  try {
    await post(base, '/auth/register', { email: 'bruta@test.com', password: 'secret123' });

    let ultimo;
    for (let i = 0; i < 6; i++) {
      ultimo = await post(base, '/auth/login', { email: 'bruta@test.com', password: `incorrecta-${i}` });
    }
    assert.equal(ultimo.status, 429, 'el sexto intento fallido debe quedar bloqueado');
    assert.ok(ultimo.headers.get('retry-after'), 'debe indicar cuando reintentar');
  } finally { server.close(); }
});

test('BUG-002: un login exitoso limpia el contador de intentos', async () => {
  const { server, base } = startTestApp();
  try {
    await post(base, '/auth/register', { email: 'limpia@test.com', password: 'secret123' });
    for (let i = 0; i < 3; i++) {
      await post(base, '/auth/login', { email: 'limpia@test.com', password: 'incorrecta-x' });
    }
    const bueno = await post(base, '/auth/login', { email: 'limpia@test.com', password: 'secret123' });
    assert.equal(bueno.status, 200);

    // Tras el exito, vuelve a tener el cupo completo.
    for (let i = 0; i < 4; i++) {
      const r = await post(base, '/auth/login', { email: 'limpia@test.com', password: 'incorrecta-x' });
      assert.equal(r.status, 401, 'no deberia bloquear todavia');
    }
  } finally { server.close(); }
});

test('BUG-003: rechaza titulos por encima del limite', async () => {
  const { server, base } = startTestApp();
  try {
    const token = await registerAndLogin(base);
    const res = await post(base, '/tasks', { title: 'A'.repeat(201) }, token);
    assert.equal(res.status, 400);
    const ok = await post(base, '/tasks', { title: 'A'.repeat(200) }, token);
    assert.equal(ok.status, 201, 'el limite exacto si debe aceptarse');
  } finally { server.close(); }
});

test('BUG-004: rechaza un titulo formado solo por espacios', async () => {
  const { server, base } = startTestApp();
  try {
    const token = await registerAndLogin(base);
    const res = await post(base, '/tasks', { title: '     ' }, token);
    assert.equal(res.status, 400);
  } finally { server.close(); }
});

test('BUG-004: recorta los espacios alrededor del titulo', async () => {
  const { server, base } = startTestApp();
  try {
    const token = await registerAndLogin(base);
    const res = await post(base, '/tasks', { title: '   Con espacios   ' }, token);
    const tarea = await res.json();
    assert.equal(tarea.title, 'Con espacios');
  } finally { server.close(); }
});

test('BUG-005: rechaza contrasenas cortas y contrasenas comunes', async () => {
  const { server, base } = startTestApp();
  try {
    const corta = await post(base, '/auth/register', { email: 'a@test.com', password: 'siete77' });
    assert.equal(corta.status, 400);

    const comun = await post(base, '/auth/register', { email: 'b@test.com', password: '12345678' });
    assert.equal(comun.status, 400, 'una contrasena de la lista de filtradas debe rechazarse');

    const buena = await post(base, '/auth/register', { email: 'c@test.com', password: 'melon-verde-42' });
    assert.equal(buena.status, 201);
  } finally { server.close(); }
});

test('BUG-006: done entra y sale como booleano', async () => {
  const { server, base } = startTestApp();
  try {
    const token = await registerAndLogin(base);
    const creada = await (await post(base, '/tasks', { title: 'Tipo de done' }, token)).json();
    assert.equal(creada.done, false);
    assert.equal(typeof creada.done, 'boolean');

    const actualizada = await (await fetch(`${base()}/tasks/${creada.id}`, {
      method: 'PATCH',
      headers: { ...json, Authorization: `Bearer ${token}` },
      body: JSON.stringify({ done: true }),
    })).json();
    assert.equal(actualizada.done, true);
    assert.equal(typeof actualizada.done, 'boolean');
  } finally { server.close(); }
});

test('BUG-007: GET /tasks pagina y reporta el total', async () => {
  const { server, base } = startTestApp();
  try {
    const token = await registerAndLogin(base);
    for (let i = 0; i < 5; i++) await post(base, '/tasks', { title: `Tarea ${i}` }, token);

    const pagina = await (await fetch(`${base()}/tasks?limit=2&offset=0`, {
      headers: { Authorization: `Bearer ${token}` },
    })).json();
    assert.equal(pagina.tasks.length, 2);
    assert.equal(pagina.total, 5, 'el total debe contar todas, no solo la pagina');
    assert.equal(pagina.limit, 2);

    const segunda = await (await fetch(`${base()}/tasks?limit=2&offset=2`, {
      headers: { Authorization: `Bearer ${token}` },
    })).json();
    assert.notEqual(segunda.tasks[0].id, pagina.tasks[0].id, 'el offset debe mover la ventana');
  } finally { server.close(); }
});

test('BUG-007: rechaza un limit fuera de rango', async () => {
  const { server, base } = startTestApp();
  try {
    const token = await registerAndLogin(base);
    const res = await fetch(`${base()}/tasks?limit=9999`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(res.status, 400);
  } finally { server.close(); }
});
