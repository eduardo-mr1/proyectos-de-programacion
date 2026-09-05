// ponytail: CORS minimo hecho a mano; cambiar por el paquete `cors` si se necesitan
// origenes multiples, credenciales o configuracion por ruta.
export function cors(origin = process.env.CORS_ORIGIN || 'http://localhost:5173') {
  return (req, res, next) => {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  };
}
