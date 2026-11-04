import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const ORIGIN = 'https://pc-prac-availability.netlify.app';
const AgeContext = createContext<Record<string, number>>({});
export const StaffAge: React.FC<{ id: string | number }> = ({ id }) => {
  const ages = useContext(AgeContext);
  const age = ages[String(id)];
  return Number.isInteger(age) ? <span data-private-staff-age className="badge badge-outline badge-sm" title="Private — signed-in staff only">Age {age}</span> : null;
};

// Private transient state only: never enrich shared Practitioner/email/prompt objects.
export const StaffAccess: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ages, setAges] = useState<Record<string, number>>({});
  const [staff, setStaff] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [callback, setCallback] = useState<{ action: string; token: string } | null>(null);
  const requestVersion = useRef(0);
  const supported = window.location.origin === ORIGIN;
  const api = async (name: string, init?: RequestInit) => {
    const r = await fetch(`/.netlify/functions/${name}`, { ...init, credentials: 'same-origin', cache: 'no-store' });
    if (!r.ok) throw Error(String(r.status));
    return r.json();
  };
  const refresh = async () => {
    const version = ++requestVersion.current;
    try {
      await api('staff-session');
      const result = await api('staff-ages');
      if (version !== requestVersion.current) return;
      setStaff(true);
      setAges(Object.fromEntries((result.ages || []).map((x: any) => [String(x.id), x.age])));
      setMessage(result.refreshRequired ? 'Signed in. A fresh private CRM age import is needed; no ages are displayed.' : 'Staff access active. Ages are excluded from client emails and copied availability.');
    } catch {
      if (version !== requestVersion.current) return;
      setAges({}); setStaff(false);
    }
  };
  useEffect(() => {
    if (!supported) return;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const invite = hash.get('invite_token'), recovery = hash.get('recovery_token');
    if (invite || recovery) {
      setCallback({ action: invite ? 'invite' : 'recovery', token: (invite || recovery)! });
      setOpen(true);
      // Remove sensitive callback from URL/history immediately. No logging/storage.
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    void refresh();
    const tick = setInterval(() => { setAges({}); void refresh(); }, 60000);
    const visible = () => { setAges({}); if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(tick); document.removeEventListener('visibilitychange', visible); requestVersion.current++; };
  }, []);
  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = event.currentTarget, values = new FormData(form);
    try {
      await api('staff-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: callback?.action || 'login', token: callback?.token, email: values.get('email'), password: values.get('password') }) });
      form.reset(); setCallback(null); await refresh();
    } catch { setMessage('Unable to sign in. Use your current staff invitation or check your credentials.'); }
    finally { setBusy(false); }
  };
  const signOut = async () => {
    requestVersion.current++; setAges({}); setStaff(false); setMessage('Signed out.');
    try { await api('staff-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) }); }
    catch { setMessage('Private view cleared. Sign-out could not be confirmed; close this browser session.'); }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 16384) throw Error('size');
      await api('staff-ages', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: await file.text() });
      await refresh();
    } catch { setMessage('Import rejected or unavailable. Only a fresh CRM-derived age-only file is accepted.'); }
    finally { setBusy(false); }
  };
  return <AgeContext.Provider value={ages}>
    <div className="bg-base-100 border-b px-4 py-2 text-sm flex flex-wrap items-center gap-3">
      {!supported ? <a className="btn btn-ghost btn-xs" href={ORIGIN} target="_blank" rel="noopener noreferrer">Open secure staff sign-in on published app</a> : <>
        <button className="btn btn-ghost btn-xs" onClick={() => setOpen(!open)}>{staff ? 'Staff access' : 'Staff sign in'}</button>
        {staff && <button className="btn btn-ghost btn-xs" onClick={signOut}>Sign out</button>}
        {open && !staff && <form onSubmit={signIn} className="flex flex-wrap items-center gap-2" autoComplete="on">
          <input className="input input-bordered input-sm" type="email" name="email" aria-label="Staff email" defaultValue="anna@psychologycare.com.au" autoComplete="username" required />
          <input className="input input-bordered input-sm" type="password" name="password" aria-label={callback ? 'Set staff password' : 'Staff password'} autoComplete={callback ? 'new-password' : 'current-password'} minLength={callback ? 12 : 1} required />
          <button className="btn btn-primary btn-sm" disabled={busy}>{callback ? 'Set password and accept invitation' : 'Sign in'}</button>
        </form>}
        {open && staff && <label className="flex items-center gap-2">Import private CRM age snapshot<input aria-label="Private age snapshot" type="file" accept="application/json,.json" disabled={busy} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></label>}
        {open && message && <p role="status" className="text-base-content/70">{message}</p>}
      </>}
    </div>
    {children}
  </AgeContext.Provider>;
};
