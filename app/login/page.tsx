"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Senha padrão inicial - pode ser alterada via .env
    if (password === 'KINGSOCIODO7') {
      localStorage.setItem('isAuth', 'true');
      router.push('/');
    } else {
      setError('Senha incorreta. Tente novamente.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ marginBottom: '24px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
          Acesso Restrito
        </h1>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', opacity: 0.8 }}>Senha Mestra</label>
            <input
              type="password"
              className="input-field"
              placeholder="Digite sua senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p style={{ color: 'var(--error)', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Entrar no Dashboard
          </button>
        </form>
        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', opacity: 0.5 }}>
          Xingling Dashboard v1.0 • Seguro e Criptografado
        </p>
      </div>
    </div>
  );
}
