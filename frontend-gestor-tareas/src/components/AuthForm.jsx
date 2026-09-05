import { useState } from 'react';
import { api } from '../api.js';

export function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = mode === 'login'
        ? await api.login(email, password)
        : await api.register(email, password);
      onAuthenticated(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card auth" onSubmit={handleSubmit}>
      <h1>{mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}</h1>

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>

      <label>
        Contrasena
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </label>

      {error && <p className="error" role="alert">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
      </button>

      <button
        type="button"
        className="link"
        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
      >
        {mode === 'login' ? 'No tengo cuenta, quiero registrarme' : 'Ya tengo cuenta, quiero entrar'}
      </button>
    </form>
  );
}
