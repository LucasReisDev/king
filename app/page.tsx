"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ExtractorModule from '@/components/ExtractorModule';
import CheckerModule from '@/components/CheckerModule';

type Tab = 'extrator' | 'checker';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('extrator');
  const [isAuth, setIsAuth] = useState(false);
  const [sharedCredentials, setSharedCredentials] = useState('');
  const [sharedProxies, setSharedProxies] = useState('');
  const router = useRouter();

  useEffect(() => {
    const auth = localStorage.getItem('isAuth');
    if (!auth) {
      router.push('/login');
    } else {
      setIsAuth(true);
    }
  }, [router]);

  // Função para receber dados do extrator e mudar para a aba de validador
  const handleExportToChecker = (data: string) => {
    setSharedCredentials(data);
    setActiveTab('checker');
  };

  if (!isAuth) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '260px', 
        background: 'rgba(15, 15, 20, 0.9)', 
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-color)',
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh'
      }}>
        <div style={{ marginBottom: '48px', paddingLeft: '12px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff' }}>
            XING<span style={{ color: 'var(--accent-primary)' }}>LING</span>
          </h2>
          <p style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Premium Suite</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <TabButton 
            active={activeTab === 'extrator'} 
            onClick={() => setActiveTab('extrator')}
            icon="✨" 
            label="Extrator Visual" 
          />
          <TabButton 
            active={activeTab === 'checker'} 
            onClick={() => setActiveTab('checker')}
            icon="🛡️" 
            label="Validador Bling" 
          />
        </nav>

        <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => { localStorage.removeItem('isAuth'); router.push('/login'); }}
            style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '14px', opacity: 0.8, width: '100%', textAlign: 'left' }}
          >
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '40px 60px', marginLeft: '260px' }}>
        <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
              {activeTab === 'extrator' && "Extração Inteligente"}
              {activeTab === 'checker' && "Validação de Acessos"}
            </h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }}></span>
              <p style={{ opacity: 0.5, fontSize: '14px' }}>
                Sistema operacional conectado e pronto para processamento.
              </p>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '12px 24px', fontSize: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ opacity: 0.6 }}>Servidor:</span> <span style={{ color: 'var(--success)', fontWeight: 'bold', marginLeft: '8px' }}>ATIVO</span>
          </div>
        </header>

        <div className="animate-fade-in">
          {activeTab === 'extrator' && <ExtractorModule onExport={handleExportToChecker} />}
          {activeTab === 'checker' && (
            <CheckerModule 
              initialCredentials={sharedCredentials} 
              onCredentialsChange={setSharedCredentials}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 16px',
      borderRadius: '12px',
      border: 'none',
      background: active ? 'linear-gradient(90deg, rgba(109, 40, 217, 0.2) 0%, rgba(109, 40, 217, 0) 100%)' : 'none',
      color: active ? '#fff' : 'rgba(255,255,255,0.5)',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.3s ease',
      fontWeight: active ? '700' : '500',
      fontSize: '15px',
      boxShadow: active ? 'inset 2px 0 0 var(--accent-primary)' : 'none'
    }}>
      <span style={{ fontSize: '18px', filter: active ? 'none' : 'grayscale(1)' }}>{icon}</span>
      {label}
    </button>
  );
}
