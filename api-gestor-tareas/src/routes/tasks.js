import { Router } from 'express';
import { z } from 'zod';

const MAX_TITULO = 200;
const LIMITE_POR_DEFECTO = 50;
const LIMITE_MAXIMO = 200;

// BUG-004: trim() antes de min(1), para que un titulo de puros espacios se
// rechace en vez de guardarse.
// BUG-003: max() para que un titulo enorme no llegue nunca a la interfaz.
const tituloSchema = z.string().trim()
  .min(1, 'El titulo es requerido')
  .max(MAX_TITULO, `El titulo no puede pasar de ${MAX_TITULO} caracteres`);

const createSchema = z.object({ title: tituloSchema });
const updateSchema = z.object({
  title: tituloSchema.optional(),
  done: z.boolean().optional(),
});
const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(LIMITE_MAXIMO).default(LIMITE_POR_DEFECTO),
  offset: z.coerce.number().int().min(0).default(0),
});

// BUG-006: SQLite guarda los booleanos como 0/1. Se convierten en la salida
// para que la API devuelva el mismo tipo que acepta en la entrada.
const serializar = (task) => ({ ...task, done: Boolean(task.done) });

export function tasksRouter(db) {
  const router = Router();

  // BUG-007: paginacion con tope, para no devolver una tabla entera.
  router.get('/', (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { limit, offset } = parsed.data;

    const rows = db.prepare(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?'
    ).all(req.user.sub, limit, offset);
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM tasks WHERE user_id = ?').get(req.user.sub);

    res.json({ tasks: rows.map(serializar), total, limit, offset });
  });

  router.post('/', (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const info = db.prepare('INSERT INTO tasks (user_id, title) VALUES (?, ?)').run(req.user.sub, parsed.data.title);
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(serializar(task));
  });

  router.patch('/:id', (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.sub);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    const title = parsed.data.title ?? task.title;
    const done = parsed.data.done === undefined ? task.done : Number(parsed.data.done);
    db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(title, done, task.id);
    res.json(serializar(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id)));
  });

  router.delete('/:id', (req, res) => {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.sub);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
    db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
    res.status(204).end();
  });

  return router;
}
