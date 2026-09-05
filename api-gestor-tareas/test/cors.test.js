import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp } from './helpers.js';

test('la respuesta incluye la cabecera CORS para el frontend', async () => {
  const { server, base } = startTestApp();
  try {
    const res = await fetch(`${base()}/health`);
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  } finally {
    server.close();
  }
});

test('el preflight OPTIONS responde 204', async () => {
  const { server, base } = startTestApp();
  try {
    const res = await fetch(`${base()}/tasks`, { method: 'OPTIONS' });
    assert.equal(res.status, 204);
    assert.match(res.headers.get('access-control-allow-headers'), /Authorization/);
  } finally {
    server.close();
  }
});
