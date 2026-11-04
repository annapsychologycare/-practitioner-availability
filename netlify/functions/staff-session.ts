import { getUser, login, logout, acceptInvite, recoverPassword, refreshSession, verifyRequestOrigin } from '@netlify/identity';
import { allowedStaff, ANNA_EMAIL, PRIVATE_HEADERS, productionRequest, reply, SITE_ORIGIN } from '../lib/staff-policy';

export default async (req: Request) => {
  if (!productionRequest(req)) return reply({ error: 'Unavailable on this origin' }, 503);
  try {
    if (req.method === 'GET') {
      await refreshSession();
      const user = await getUser();
      if (!user) return reply({ error: 'Sign in required' }, 401);
      if (!allowedStaff(user)) return reply({ error: 'Not authorized' }, 403);
      return reply({ staff: true });
    }
    if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
    verifyRequestOrigin(req, { allowedOrigins: [SITE_ORIGIN] });
    if (!(req.headers.get('content-type') || '').startsWith('application/json')) return reply({ error: 'JSON required' }, 415);
    const text = await req.text();
    if (text.length > 8192) return reply({ error: 'Request too large' }, 413);
    const body = JSON.parse(text);
    if (body.action === 'logout') {
      await logout();
      return reply({ signedOut: true });
    }
    if (typeof body.password !== 'string' || body.password.length > 1024) return reply({ error: 'Invalid request' }, 400);
    let user;
    if (body.action === 'login') {
      if (body.email !== ANNA_EMAIL) return reply({ error: 'Sign in unavailable for this account' }, 403);
      user = await login(body.email, body.password);
    } else if (body.action === 'invite' || body.action === 'recovery') {
      if (typeof body.token !== 'string' || !body.token || body.token.length > 2048) return reply({ error: 'Invalid request' }, 400);
      const redeemed = body.action === 'invite' ? await acceptInvite(body.token, body.password) : await recoverPassword(body.token, body.password);
      if (redeemed.email !== ANNA_EMAIL) return reply({ error: 'Not authorized' }, 403);
      // Invitation helpers redeem provider tokens; explicitly establish the
      // server-managed cookie session (no browser token/localStorage required).
      user = await login(ANNA_EMAIL, body.password);
    } else return reply({ error: 'Invalid action' }, 400);
    if (!allowedStaff(user)) {
      await logout();
      return reply({ error: 'Not authorized' }, 403);
    }
    return reply({ staff: true });
  } catch (e: any) {
    // Never log credentials, tokens, provider response bodies or user data.
    return new Response(JSON.stringify({ error: 'Sign in could not be completed. Check your invitation or credentials.' }), { status: e?.status === 403 ? 403 : 401, headers: { ...PRIVATE_HEADERS, 'Content-Type': 'application/json' } });
  }
};
