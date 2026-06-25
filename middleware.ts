import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROUTES = ['/admin', '/admin-reservas'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );

  if (!isAdminRoute) return NextResponse.next();

  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Decodificar el payload del JWT (sin verificar firma — solo para routing).
  // La verificación real de firma ocurre en el backend en cada llamada API.
  //
  // ⚠️ NUNCA usar este payload (is_admin, exp, etc.) para autorizar acceso a
  // datos en route handlers o server actions. Esto es UX, no seguridad: un
  // token forjado con is_admin:true pasa este chequeo, pero el backend NestJS
  // lo rechaza con 401 en cada request porque sí verifica la firma. El día que
  // alguien lea is_admin de aquí para devolver datos, se rompe esa garantía.
  try {
    const payloadB64 = token.split('.')[1];
    if (!payloadB64) throw new Error('malformed');
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8'),
    );

    if (!payload.is_admin) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Token expirado
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin-reservas/:path*'],
};
