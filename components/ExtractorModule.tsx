"use client";

import { useState } from 'react';

export default function ExtractorModule({ onExport }: { onExport?: (data: string) => void }) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExtract = () => {
    setIsProcessing(true);
    setTimeout(() => { // Small delay for visual effect
      try {
        let logs: any[] = [];
        
        try {
          // Try standard JSON first
          const parsed = JSON.parse(input);
          logs = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          // Try JSON-L (line by line)
          logs = input.split(/\r?\n/)
                      .filter(line => line.trim())
                      .map(line => {
                        try { return JSON.parse(line); } 
                        catch(err) { return null; }
                      })
                      .filter(obj => obj !== null);
        }

        const extracted = logs.map(log => {
          const user = log.email || log.username;
          const pass = log.password;
          return user && pass ? `${user}:${pass}` : null;
        }).filter(item => item !== null) as string[];

        setResults(extracted);
      } catch (err) {
        alert('Erro ao processar logs. Verifique o formato.');
      } finally {
        setIsProcessing(false);
      }
    }, 500);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Left: Input */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Logs Brutos</h3>
        <textarea 
          className="input-field" 
          style={{ height: '400px', resize: 'none', fontSize: '12px', fontFamily: 'monospace' }}
          placeholder='Cole seus logs (JSON ou Texto) aqui...'
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button 
          className="btn-primary" 
          style={{ marginTop: '20px', width: '100%' }}
          onClick={handleExtract}
          disabled={!input || isProcessing}
        >
          {isProcessing ? 'Extraindo...' : '✨ Extrair Credenciais'}
        </button>
      </div>

      {/* Right: Results */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px' }}>Resultado ({results.length})</h3>
          {results.length > 0 && (
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '14px' }}
              onClick={() => { setResults([]); setInput(''); }}
            >
              Limpar Tudo
            </button>
          )}
        </div>
        
        <div className="input-field" style={{ height: '400px', overflowY: 'auto', background: 'rgba(0,0,0,0.5)', padding: '16px' }}>
          {results.length === 0 ? (
            <p style={{ opacity: 0.3, textAlign: 'center', marginTop: '160px' }}>Nenhum dado extraído ainda.</p>
          ) : (
            <pre style={{ fontSize: '13px', lineHeight: '1.6', fontFamily: 'monospace' }}>
              {results.join('\n')}
            </pre>
          )}
        </div>

        {results.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => onExport?.(results.join('\n'))}>
              🚀 Enviar para Validador
            </button>
            <button 
              style={{ padding: '0 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer' }}
              onClick={() => {
                const blob = new Blob([results.join('\n')], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'credentials.txt';
                a.click();
              }}
            >
              📥 Baixar .txt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
