import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, getToken, setToken } from './api';

const WORDS = [['Code', 'tech'], ['Perform', 'non'], ['Hack', 'tech'], ['Sing', 'non'], ['Debug', 'tech'], ['Debate', 'non']];

function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % WORDS.length), 1800); return () => clearInterval(t); }, []);
  const [w, k] = WORDS[i];
  return (
    <span className="rot">
      <AnimatePresence mode="wait">
        <motion.span key={w} className={'word ' + k} initial={{ y: '90%', opacity: 0, rotateX: -60 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }} exit={{ y: '-90%', opacity: 0, rotateX: 60 }} transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}>
          {w}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '', college: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const d = await api('/' + mode, 'POST', f); setToken(d.token); onAuth(d.user); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="auth">
      <motion.div className="auth-art" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="logo big">Dev<b>Nov</b></div>
        <h1>Where <RotatingWord /> <br />share a stage.</h1>
        <p>Hackathons and open mics. CTFs and street plays. One campus, one sign-up.</p>
        <div className="blobs"><i className="b1" /><i className="b2" /><i className="b3" /></div>
      </motion.div>
      <motion.form className="auth-card" onSubmit={submit} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', damping: 22 }}>
        <div className="seg">
          {['login', 'signup'].map(m => (
            <button type="button" key={m} onClick={() => { setMode(m); setErr(''); }} className={mode === m ? 'on' : ''}>
              {mode === m && <motion.span layoutId="seg" className="seg-bg" />}<span>{m === 'login' ? 'Log in' : 'Sign up'}</span>
            </button>))}
        </div>
        <AnimatePresence initial={false}>
          {mode === 'signup' && (
            <motion.div key="s" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <label>Full name<input required value={f.name} onChange={set('name')} placeholder="Ayesha Khan" /></label>
              <label>College<input value={f.college} onChange={set('college')} placeholder="Your college or university" /></label>
            </motion.div>)}
        </AnimatePresence>
        <label>Email<input type="email" required value={f.email} onChange={set('email')} placeholder="you@college.edu" /></label>
        <label>Password<input type="password" required minLength={6} value={f.password} onChange={set('password')} placeholder="At least 6 characters" /></label>
        <AnimatePresence>{err && <motion.p className="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{err}</motion.p>}</AnimatePresence>
        <motion.button className="btn primary wide" whileTap={{ scale: 0.97 }} disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </motion.button>
      </motion.form>
    </div>
  );
}

const fmt = d => new Date(d).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

function Card({ e, i, onToggle, busy }) {
  const left = e.capacity - e.registered, full = left <= 0 && !e.mine;
  const pct = Math.min(100, (e.registered / e.capacity) * 100);
  return (
    <motion.article layout className={'card ' + (e.category === 'tech' ? 'tech' : 'non')}
      initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: i * 0.05, type: 'spring', damping: 20 }} whileHover={{ y: -6, rotate: i % 2 ? 0.6 : -0.6 }}>
      <div className="card-top">
        <motion.span className="emoji" whileHover={{ rotate: 20, scale: 1.2 }}>{e.emoji}</motion.span>
        <span className="chip">{e.category === 'tech' ? 'Tech' : 'Non-tech'} · {e.tag}</span>
      </div>
      <h3>{e.title}</h3>
      <p>{e.description}</p>
      <dl><div><dt>When</dt><dd>{fmt(e.date)}</dd></div><div><dt>Where</dt><dd>{e.venue}</dd></div></dl>
      <div className="meter"><motion.i initial={{ width: 0 }} animate={{ width: pct + '%' }} transition={{ duration: 0.9, delay: 0.2 + i * 0.05 }} /></div>
      <small>{full ? 'Event is full' : `${left} of ${e.capacity} spots left`}</small>
      <motion.button className={'btn ' + (e.mine ? 'ghost' : 'primary')} whileTap={{ scale: 0.95 }} disabled={busy || full} onClick={() => onToggle(e)}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={e.mine ? 'y' : 'n'} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}>
            {e.mine ? '✓ Registered · Cancel' : 'Register'}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </motion.article>
  );
}

function Home({ user, onLogout }) {
  const [events, setEvents] = useState([]); const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(() => api('/events').then(setEvents), []);
  useEffect(() => { load(); }, [load]);
  const say = m => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const toggle = async e => {
    setBusy(true);
    try { await api(`/events/${e.id}/register`, e.mine ? 'DELETE' : 'POST'); await load(); say(e.mine ? `Cancelled: ${e.title}` : `You’re in: ${e.title}`); }
    catch (x) { say(x.message); } finally { setBusy(false); }
  };
  const shown = events.filter(e => filter === 'all' || e.category === filter);
  const mine = events.filter(e => e.mine).length;
  return (
    <>
      <header className="nav">
        <div className="logo">Dev<b>Nov</b></div>
        <div className="nav-r"><span className="me"><em>{mine}</em> registered</span><span className="hi">Hi, {user.name.split(' ')[0]}</span>
          <button className="btn ghost sm" onClick={onLogout}>Log out</button></div>
      </header>
      <section className="hero">
        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          Pick your next <RotatingWord />.
        </motion.h1>
        <p>Eight events this month. Tech or not, there’s a seat for you.</p>
        <motion.div className="orb o1" animate={{ y: [0, -30, 0] }} transition={{ repeat: Infinity, duration: 7 }} />
        <motion.div className="orb o2" animate={{ y: [0, 30, 0] }} transition={{ repeat: Infinity, duration: 9 }} />
      </section>
      <main className="wrap">
        <div className="filters">
          {[['all', 'All events'], ['tech', 'Tech'], ['non-tech', 'Non-tech']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={filter === k ? 'on' : ''}>
              {filter === k && <motion.span layoutId="pill" className="pill" />}<span>{l}</span></button>))}
        </div>
        <motion.div layout className="grid">
          <AnimatePresence>{shown.map((e, i) => <Card key={e.id} e={e} i={i} onToggle={toggle} busy={busy} />)}</AnimatePresence>
        </motion.div>
      </main>
      <AnimatePresence>{toast && <motion.div className="toast" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>{toast}</motion.div>}</AnimatePresence>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null); const [ready, setReady] = useState(false);
  useEffect(() => { if (!getToken()) return setReady(true); api('/me').then(setUser).catch(() => setToken(null)).finally(() => setReady(true)); }, []);
  const logout = () => { setToken(null); setUser(null); };
  if (!ready) return null;
  return <AnimatePresence mode="wait"><motion.div key={user ? 'home' : 'auth'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    {user ? <Home user={user} onLogout={logout} /> : <Auth onAuth={setUser} />}</motion.div></AnimatePresence>;
}
