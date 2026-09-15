import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROUTES = ['/admin', '/admin-reservas'];
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/** Si el backend no contesta en este tiempo, se niega el acceso (falla cerrado). */
const VERIFY_TIMEOUT_MS = 5000;

type Verificacion = 'admin' | 'no-admin' | 'token-invalido' | 'sin-respuesta';

/** Payload del JWT sin verificar. Solo sirve de pre-filtro barato. */
function decodePayload(token: string): { exp?: number; is_admin?: boolean } | null {
  try {
    const payloadB64 = token.split('.')[1];
    if (!payloadB64) return null;
    return JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

/**
 * Verificación real, en el backend: firma del token, cuenta activa (una cuenta
 * dada de baja responde 401) y rol de admin.
 *
 * Antes el middleware solo decodificaba el payload, así que un token armado a
 * mano con `is_admin: true` cargaba la pantalla del panel. No exponía datos —la
 * API verifica la firma en cada llamada—, pero dejaba ver el panel a cualquiera.
 * Se consulta `/auth/me` en vez de verificar la firma acá para no copiar el
 * JWT_SECRET del backend al frontend.
 */
async function verificarEnBackend(token: string): Promise<Verificacion> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (res.status === 401) return 'token-invalido';
    if (!res.ok) return 'sin-respuesta';
    const data = await res.json();
    return data?.user?.is_admin === true ? 'admin' : 'no-admin';
  } catch {
    return 'sin-respuesta';
  } finally {
    clearTimeout(timer);
  }
}

function alInicio(request: NextRequest, borrarCookie = false) {
  const response = NextResponse.redirect(new URL('/', request.url));
  if (borrarCookie) response.cookies.delete('auth_token');
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );
  if (!isAdminRoute) return NextResponse.next();

  const token = request.cookies.get('auth_token')?.value;
  if (!token) return alInicio(request);

  // Pre-filtro sin red: malformado, expirado o sin rol no amerita consultar al
  // backend. Pasarlo NO autoriza nada — la decisión la toma la verificación.
  const payload = decodePayload(token);
  if (!payload) return alInicio(request);
  if (payload.exp && Date.now() / 1000 > payload.exp) return alInicio(request, true);
  if (!payload.is_admin) return alInicio(request);

  const resultado = await verificarEnBackend(token);
  if (resultado === 'admin') return NextResponse.next();
  // Un token que el backend rechaza no sirve para nada más: se borra. Si el
  // backend no respondió, se niega el acceso pero se conserva la sesión.
  return alInicio(request, resultado === 'token-invalido');
}

export const config = {
  matcher: ['/admin/:path*', '/admin-reservas/:path*'],
};
