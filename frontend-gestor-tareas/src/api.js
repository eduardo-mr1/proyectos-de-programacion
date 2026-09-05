const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con la API. Verifica que este corriendo.', 0);
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Error inesperado', res.status);
  return data;
}

export const api = {
  register: (email, password) => request('/auth/register', { method: 'POST', body: { email, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  listTasks: (token) => request('/tasks', { token }),
  createTask: (token, title) => request('/tasks', { method: 'POST', body: { title }, token }),
  updateTask: (token, id, changes) => request(`/tasks/${id}`, { method: 'PATCH', body: changes, token }),
  deleteTask: (token, id) => request(`/tasks/${id}`, { method: 'DELETE', token }),
};

export { ApiError };
