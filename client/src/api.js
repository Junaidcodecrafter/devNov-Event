export const getToken = () => localStorage.getItem('dn_token');
export const setToken = t => (t ? localStorage.setItem('dn_token', t) : localStorage.removeItem('dn_token'));
export async function api(path, method = 'GET', body) {
  const r = await fetch('/api' + path, { method,
    headers: { 'Content-Type': 'application/json', ...(getToken() && { Authorization: 'Bearer ' + getToken() }) },
    body: body && JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Something went wrong. Try again.');
  return d;
}
