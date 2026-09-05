import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { limitarIntentos } from '../middleware/rate-limit.js';

// Las 20 contrasenas mas usadas segun filtraciones publicas. No pretende ser
// exhaustivo: bloquea lo peor sin obligar al usuario a inventar simbolos, que
// solo empuja hacia patrones predecibles.
const PEORES_CONTRASENAS = new Set([
  '123456', 'password', '12345678', 'qwerty', '123456789', '12345', '1234',
  '111111', '1234567', 'dragon', '123123', 'baseball', 'abc123', 'football',
  'monkey', 'letmein', 'shadow', 'master', '666666', 'qwertyuiop',
]);

const credsSchema = z.object({
  // BUG-001: el email se normaliza a minusculas antes de validar, guardar y
  // consultar, para que Usuario@x.com y usuario@x.com sean la misma cuenta.
  email: z.string().trim().toLowerCase().email(),
  password: z.string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .refine((p) => !PEORES_CONTRASENAS.has(p.toLowerCase()),
      'Esa contrasena es demasiado comun, elige otra'),
});

export function authRouter(db, secret) {
  const router = Router();

  router.post('/register', (req, res) => {
    const parsed = credsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { email, password } = parsed.data;

    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) return res.status(409).json({ error: 'El email ya esta registrado' });

    const password_hash = bcrypt.hashSync(password, 10);
    const info = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, password_hash);
    const token = jwt.sign({ sub: info.lastInsertRowid, email }, secret, { expiresIn: '1h' });
    res.status(201).json({ token });
  });

  // BUG-002: limita los intentos fallidos por email para frenar la fuerza bruta.
  router.post('/login', limitarIntentos(), (req, res) => {
    const parsed = credsSchema.safeParse(req.body);
    if (!parsed.success) {
      // Un intento con datos malformados tambien cuenta: si no, el limitador
      // se evade mandando siempre una contrasena que no pase el esquema.
      req.registrarIntentoFallido();
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    const { email, password } = parsed.data;

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      req.registrarIntentoFallido();
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    req.limpiarIntentos();
    const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: '1h' });
    res.json({ token });
  });

  return router;
}
