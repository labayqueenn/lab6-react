import { useEffect, useState } from 'react';
import Login from './Login';
import Products from './Products';
import api, { authStorage } from './api/client';

export default function App() {
  const [auth, setAuth] = useState(authStorage.get());

  // api/client.js fires this when the session can no longer be refreshed
  useEffect(() => {
    const onLogout = () => setAuth(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // the local session is removed below either way
    }
    authStorage.clear();
    setAuth(null);
  };

  if (!auth) {
    return <Login onLogin={() => setAuth(authStorage.get())} />;
  }

  return (
    <div>
      <header className="topbar">
        <h1>Product Management System</h1>
        <div className="topbar-user">
          <span>
            {auth.user.username} <small>({auth.user.role})</small>
          </span>
          <button className="btn btn-light" onClick={logout}>
            Logout
          </button>
        </div>
      </header>
      <Products />
    </div>
  );
}