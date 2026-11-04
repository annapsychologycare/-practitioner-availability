import { getUser, refreshSession, verifyRequestOrigin } from '@netlify/identity';
import { getStore } from '@netlify/blobs';
import publicData from './practitioners-data.json';
import { allowedStaff, melbourneDay, productionRequest, reply, SITE_ORIGIN, validateSnapshot } from '../lib/staff-policy';

export default async (req: Request) => {
  if (!productionRequest(req)) return reply({ error: 'Unavailable on this origin' }, 503);
  try {
    await refreshSession();
    const user = await getUser();
    if (!user) return reply({ error: 'Sign in required' }, 401);
    if (!allowedStaff(user)) return reply({ error: 'Not authorized' }, 403);
    if (!['GET', 'PUT'].includes(req.method)) return reply({ error: 'Method not allowed' }, 405);
    const store = getStore({ name: 'private-staff-age-snapshots', consistency: 'strong' });
    if (req.method === 'PUT') {
      verifyRequestOrigin(req, { allowedOrigins: [SITE_ORIGIN] });
      if (!(req.headers.get('content-type') || '').startsWith('application/json')) return reply({ error: 'JSON required' }, 415);
      const raw = await req.text();
      if (raw.length > 16384) return reply({ error: 'Request too large' }, 413);
      let snapshot;
      try { snapshot = validateSnapshot(JSON.parse(raw), new Set(publicData.map((p: any) => String(p.id)))); }
      catch { return reply({ error: 'Invalid or stale age-only snapshot; nothing changed' }, 400); }
      await store.setJSON('current', snapshot);
      return reply({ updated: snapshot.ages.length, asOfDay: snapshot.asOfDay });
    }
    const snapshot: any = await store.get('current', { type: 'json' });
    if (!snapshot || snapshot.asOfDay !== melbourneDay()) return reply({ ages: [], refreshRequired: true });
    // No DOB, names, metadata, session tokens or internal CRM fields in response.
    return reply({ ages: snapshot.ages.map((x: any) => ({ id: x.id, age: x.age })), asOfDay: snapshot.asOfDay });
  } catch {
    return reply({ error: 'Private age service unavailable' }, 503);
  }
};
