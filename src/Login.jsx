import { useState } from 'react';
import api, { authStorage, getErrorMessage } from './api/client';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await api.post('/auth/register', {
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      }
      const res = await api.post('/auth/login', {
        email: form.email.trim(),
        password: form.password,
      });
      authStorage.set({ ...res.data.tokens, user: res.data.user });
      onLogin();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 380, margin: '60px auto', display: 'grid', gap: 12 }}>
      <h1>{isRegister ? 'Create account' : 'Login'}</h1>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10 }}>{error}</div>}

      {isRegister && (
        <input name="username" placeholder="Username" value={form.username} onChange={change} required minLength={3} />
      )}
      <input type="email" name="email" placeholder="Email" value={form.email} onChange={change} required />
      <input type="password" name="password" placeholder="Password" value={form.password} onChange={change} required minLength={isRegister ? 8 : undefined} />

      <button type="submit" disabled={loading}>
        {loading ? 'Please wait...' : isRegister ? 'Register and login' : 'Login'}
      </button>

      <p>
        {isRegister ? 'Already have an account?' : 'No account yet?'}{' '}
        <button type="button" onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }}>
          {isRegister ? 'Login' : 'Register'}
        </button>
      </p>
    </form>
  );
}