import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { AuthForm } from './components/AuthForm.jsx';
import { TaskList } from './components/TaskList.jsx';

const TOKEN_KEY = 'gestor-tareas-token';

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function App() {
  const [token, setToken] = useState(readStoredToken);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthError = useCallback((err) => {
    // Un 401 significa token vencido o invalido: se cierra la sesion.
    if (err.status === 401) {
      setToken(null);
      try { localStorage.removeItem(TOKEN_KEY); } catch { /* almacenamiento no disponible */ }
      return;
    }
    setError(err.message);
  }, []);

  useEffect(() => {
    if (!token) {
      setTasks([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api.listTasks(token)
      .then((rows) => { if (!cancelled) setTasks(rows); })
      .catch((err) => { if (!cancelled) handleAuthError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, handleAuthError]);

  function authenticate(newToken) {
    try { localStorage.setItem(TOKEN_KEY, newToken); } catch { /* almacenamiento no disponible */ }
    setError('');
    setToken(newToken);
  }

  function logout() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* almacenamiento no disponible */ }
    setToken(null);
  }

  async function addTask(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setError('');
    try {
      const task = await api.createTask(token, trimmed);
      setTasks([task, ...tasks]);
      setTitle('');
    } catch (err) {
      handleAuthError(err);
    }
  }

  async function toggleTask(task) {
    setError('');
    // BUG-008: se actualiza la interfaz de inmediato y se revierte si la API
    // falla. Antes el checkbox no se movia hasta que respondia el servidor, y
    // en una red lenta el usuario creia que su click se habia ignorado.
    const previas = tasks;
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    try {
      const updated = await api.updateTask(token, task.id, { done: !task.done });
      setTasks((actuales) => actuales.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setTasks(previas);
      handleAuthError(err);
    }
  }

  async function deleteTask(task) {
    setError('');
    try {
      await api.deleteTask(token, task.id);
      setTasks(tasks.filter((t) => t.id !== task.id));
    } catch (err) {
      handleAuthError(err);
    }
  }

  if (!token) {
    return (
      <main className="container">
        <AuthForm onAuthenticated={authenticate} />
      </main>
    );
  }

  const pending = tasks.filter((t) => !t.done).length;

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1>Mis tareas</h1>
          <p className="subtitle">{pending} pendiente{pending === 1 ? '' : 's'}</p>
        </div>
        <button type="button" className="link" onClick={logout}>Cerrar sesion</button>
      </header>

      <form className="card" onSubmit={addTask}>
        <div className="row">
          <input
            type="text"
            placeholder="Nueva tarea"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Nueva tarea"
          />
          <button type="submit" disabled={!title.trim()}>Agregar</button>
        </div>
      </form>

      {error && <p className="error" role="alert">{error}</p>}
      {loading ? <p className="empty">Cargando...</p> : (
        <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} />
      )}
    </main>
  );
}
