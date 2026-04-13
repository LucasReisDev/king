"use client";

import { useState, useEffect, useCallback } from 'react';

interface BotStatus {
  total: number;
  status: 'DISCONNECTED' | 'CONNECTING' | 'READY';
  qr: string | null;
}

export default function WhatsAppModule() {
  const [botUrl, setBotUrl] = useState('http://localhost:3000');
  const [status, setStatus] = useState<BotStatus>({ total: 0, status: 'DISCONNECTED', qr: null });
  const [isOnline, setIsOnline] = useState(false);
  const [inputData, setInputData] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${botUrl}/api/status`);
      if (!res.ok) throw new Error('Bot offline');
      const data = await res.json();
      setStatus(data);
      setIsOnline(data.status === 'READY');
      setError(null);
    } catch (err) {
      setIsOnline(false);
      setError('Não foi possível conectar ao Bot local. Certifique-se que ele está rodando.');
    }
  }, [botUrl]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleSave = async () => {
    if (!inputData.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${botUrl}/api/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputData })
      });
      const result = await res.json();
      if (result.success) {
        alert(`Sucesso! ${result.added} vendas adicionadas.`);
        setInputData('');
        fetchStatus();
      }
    } catch (err) {
      alert('Erro ao enviar dados para o bot.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner: Connection Status */}
      <div className="glass-card" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderLeft: `4px solid ${isOnline ? 'var(--success)' : status.qr ? 'var(--warning)' : 'var(--error)'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            background: isOnline ? 'var(--success)' : status.qr ? 'var(--warning)' : 'var(--error)',
            boxShadow: `0 0 15px ${isOnline ? 'var(--success)' : status.qr ? 'var(--warning)' : 'var(--error)'}`,
            animation: isOnline ? 'none' : 'pulse 2s infinite'
          }}></div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>
              Status: {isOnline ? 'BOT ONLINE' : status.qr ? 'AGUARDANDO CONEXÃO' : 'DESCONECTADO'}
            </h3>
            <p style={{ fontSize: '13px', opacity: 0.5 }}>
              {isOnline ? 'O bot está pronto para processar pedidos via WhatsApp.' : 'Inicie o processo no seu computador para ativar.'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
             <button 
                onClick={() => setShowConfig(!showConfig)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: '#fff', fontSize: '13px' }}
             >
                ⚙️ Configurar
             </button>
             <button 
                onClick={fetchStatus}
                style={{ background: 'var(--accent-primary)', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', color: '#fff', fontWeight: '600', fontSize: '13px' }}
             >
                🔄 Atualizar
             </button>
        </div>
      </div>

      {showConfig && (
        <div className="glass-card animate-fade-in" style={{ background: 'rgba(20, 20, 25, 0.95)', border: '1px solid var(--accent-primary)' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>Configuração de Ponte (Local &rarr; Vercel)</h4>
            <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                    type="text" 
                    value={botUrl} 
                    onChange={(e) => setBotUrl(e.target.value)}
                    className="input-field"
                    style={{ flex: 1, margin: 0 }}
                    placeholder="URL do Bot (Ex: http://localhost:3000)"
                />
                <button 
                    onClick={() => { setShowConfig(false); fetchStatus(); }}
                    className="btn-primary"
                    style={{ padding: '0 20px' }}
                >
                    Salvar
                </button>
            </div>
            <p style={{ fontSize: '11px', marginTop: '10px', opacity: 0.5 }}>
                Dica: Se estiver usando o Dashboard no Vercel, use o <strong>ngrok</strong> para obter uma URL HTTPS para seu bot local.
            </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: status.qr ? '1fr 340px' : '1fr', gap: '24px' }}>
        
        {/* Main Interface: Sales Adder */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px' }}>Gerenciador de Vendas</h3>
            <div className="badge" style={{ background: 'rgba(109, 40, 217, 0.2)', color: 'var(--accent-primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
              {status.total} Pendentes no Banco
            </div>
          </div>

          <textarea 
            className="input-field"
            style={{ height: '300px', resize: 'none', fontSize: '14px', lineHeight: '1.5' }}
            placeholder={`Cole os detalhes da venda aqui...\nPode colar várias de uma vez, o sistema identifica automaticamente pelo cabeçalho "Detalhe da".`}
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button 
                className="btn-primary" 
                style={{ flex: 2, padding: '16px' }}
                onClick={handleSave}
                disabled={!isOnline || !inputData || isSaving}
            >
              {isSaving ? 'Sincronizando...' : '📦 Enviar Vendas para o Bot'}
            </button>
            <button 
                className="btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setInputData('')}
            >
              Limpar Texto
            </button>
          </div>
          
          {!isOnline && !status.qr && (
            <p style={{ color: 'var(--error)', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>
              ⚠️ Bot Offline. Inicie o sistema no seu PC para enviar dados.
            </p>
          )}
        </div>

        {/* QR Code Sidebar (Conditional) */}
        {status.qr && (
          <div className="glass-card animate-scale-in" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ marginBottom: '8px', color: 'var(--warning)' }}>Autenticação</h3>
            <p style={{ fontSize: '12px', opacity: 0.6, marginBottom: '20px' }}>Escaneie para conectar ao WhatsApp</p>
            
            <div style={{ 
                background: '#fff', 
                padding: '16px', 
                borderRadius: '16px', 
                boxShadow: '0 0 30px rgba(245, 158, 11, 0.2)'
            }}>
                <img src={status.qr} alt="QR Code" style={{ width: '220px', height: '220px' }} />
            </div>

            <div style={{ marginTop: '24px', fontSize: '11px', opacity: 0.4 }}>
                Aguardando sinal do dispositivo...
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
