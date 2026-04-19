"use client";

import { useState, useEffect } from 'react';

interface Partner {
  id: string;
  email: string;
  password: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function PartnersModule() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Load partners from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('king_partners');
    if (saved) {
      try {
        setPartners(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse partners", e);
      }
    }
  }, []);

  // Save partners to localStorage
  useEffect(() => {
    localStorage.setItem('king_partners', JSON.stringify(partners));
  }, [partners]);

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const newPartner: Partner = {
      id: crypto.randomUUID(),
      email,
      password,
      status: 'active',
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };

    setPartners([newPartner, ...partners]);
    setEmail('');
    setPassword('');
    setIsAdding(false);
  };

  const toggleStatus = (id: string) => {
    setPartners(prev => prev.map(p =>
      p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
    ));
  };

  const removePartner = (id: string) => {
    if (confirm('Tem certeza que deseja remover este sócio?')) {
      setPartners(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
      {/* Sidebar: Add Partner */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👤</span> Novo Usuario
          </h3>

          <form onSubmit={handleAddPartner} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', opacity: 0.6, display: 'block', marginBottom: '8px' }}>E-mail do Sócio</label>
              <input
                type="email"
                className="input-field"
                placeholder="exemplo@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', opacity: 0.6, display: 'block', marginBottom: '8px' }}>Senha de Acesso</label>
              <input
                type="text"
                className="input-field"
                placeholder="Defina uma senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              🚀 Cadastrar Usuário
            </button>
          </form>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '16px', fontSize: '14px', opacity: 0.7 }}>Resumo do Painel</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
              <p style={{ fontSize: '11px', opacity: 0.6 }}>Total</p>
              <h4 style={{ fontSize: '24px', fontWeight: 'bold' }}>{partners.length}</h4>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)' }}>
              <p style={{ fontSize: '11px', opacity: 0.6 }}>Ativos</p>
              <h4 style={{ fontSize: '24px', color: 'var(--success)', fontWeight: 'bold' }}>
                {partners.filter(p => p.status === 'active').length}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Main: Partners List */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px' }}>Lista de Usuarios KL - KING</h3>
          <div style={{ fontSize: '12px', opacity: 0.5 }}>
            Dados sincronizados localmente
          </div>
        </div>

        <div style={{
          flex: 1,
          overflowX: 'auto',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px', fontSize: '13px', fontWeight: '600', opacity: 0.7 }}>E-mail</th>
                <th style={{ padding: '16px', fontSize: '13px', fontWeight: '600', opacity: 0.7 }}>Senha</th>
                <th style={{ padding: '16px', fontSize: '13px', fontWeight: '600', opacity: 0.7 }}>Data</th>
                <th style={{ padding: '16px', fontSize: '13px', fontWeight: '600', opacity: 0.7 }}>Status</th>
                <th style={{ padding: '16px', fontSize: '13px', fontWeight: '600', opacity: 0.7, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '60px', textAlign: 'center', opacity: 0.3 }}>
                    Nenhum sócio cadastrado no momento.
                  </td>
                </tr>
              ) : (
                partners.map(partner => (
                  <tr key={partner.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500' }}>{partner.email}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontFamily: 'monospace', opacity: 0.8 }}>{partner.password}</td>
                    <td style={{ padding: '16px', fontSize: '13px', opacity: 0.6 }}>{partner.createdAt}</td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => toggleStatus(partner.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          background: partner.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: partner.status === 'active' ? 'var(--success)' : 'var(--error)',
                          border: partner.status === 'active' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {partner.status === 'active' ? '● Ativo' : '○ Inativo'}
                      </button>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button
                        onClick={() => removePartner(partner.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--error)',
                          cursor: 'pointer',
                          fontSize: '18px',
                          opacity: 0.5
                        }}
                        title="Remover"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
