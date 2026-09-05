# Frontend Gestor de Tareas

Cliente web en React que consume la [API de gestor de tareas](../api-gestor-tareas) de este mismo repo.

## Stack

- React 18 + Vite 5
- `fetch` nativo (sin axios ni librerias de data fetching)
- CSS plano con variables y soporte de tema claro/oscuro
- Sin librerias de estado: `useState` y `useEffect` alcanzan para este alcance

## Como correrlo

Necesitas la API corriendo primero:

```bash
cd ../api-gestor-tareas
npm install
npm start                # http://localhost:3000
```

Y en otra terminal:

```bash
npm install
npm run dev              # http://localhost:5173
```

Si tu API corre en otra URL, copia `.env.example` a `.env` y ajusta `VITE_API_URL`.

## Decisiones de diseno

- **El token vive en `localStorage`** para que la sesion sobreviva un refresh; toda lectura y escritura va en `try/catch` porque el navegador puede bloquear el almacenamiento (modo privado, cookies deshabilitadas).
- **Un 401 cierra la sesion automaticamente.** El token expira en 1 hora del lado de la API, y el cliente reacciona a eso en vez de dejar la interfaz en un estado roto.
- **Errores de red se distinguen de errores de la API.** Si el `fetch` falla del todo, el mensaje dice que la API no responde en vez de mostrar un error generico.
- **Sin gestor de estado externo.** Con una sola pantalla y una lista, Redux o Zustand serian mas configuracion que beneficio.
