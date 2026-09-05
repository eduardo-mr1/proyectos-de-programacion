// BUG-002: limitador de intentos de login.
//
// ponytail: contador en memoria del proceso. Suficiente para un despliegue de
// una sola instancia; con varias instancias o reinicios frecuentes hay que
// mover el estado a Redis o usar express-rate-limit con almacen compartido.

const VENTANA_MS = 15 * 60 * 1000; // 15 minutos
const MAX_INTENTOS = 5;

export function limitarIntentos({ ventanaMs = VENTANA_MS, maxIntentos = MAX_INTENTOS } = {}) {
  const intentos = new Map(); // clave -> { conteo, expira }

  return (req, res, next) => {
    // Se agrupa por email para que un atacante no evada el limite rotando IP,
    // y porque bloquear por IP dejaria fuera a oficinas con IP compartida.
    const clave = String(req.body?.email || '').trim().toLowerCase() || req.ip;
    const ahora = Date.now();
    const registro = intentos.get(clave);

    if (registro && registro.expira <= ahora) intentos.delete(clave);
    const vigente = intentos.get(clave);

    if (vigente && vigente.conteo >= maxIntentos) {
      const faltan = Math.ceil((vigente.expira - ahora) / 1000);
      res.set('Retry-After', String(faltan));
      return res.status(429).json({
        error: `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(faltan / 60)} minuto(s).`,
      });
    }

    req.registrarIntentoFallido = () => {
      const actual = intentos.get(clave);
      if (actual) actual.conteo += 1;
      else intentos.set(clave, { conteo: 1, expira: ahora + ventanaMs });
    };
    req.limpiarIntentos = () => intentos.delete(clave);

    next();
  };
}
