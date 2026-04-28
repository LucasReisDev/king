import { NextResponse } from 'next/server';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

const LOGIN_URL = 'https://app.ideris.com.br/login.aspx';

async function getInitialTokens(agent: any) {
  try {
    const response = await axios.get(LOGIN_URL, {
      httpsAgent: agent,
      proxy: false,
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    });

    const html = response.data;
    const cookies = response.headers['set-cookie'] || [];
    
    const viewstate = html.match(/id="__VIEWSTATE" value="([^"]+)"/)?.[1] || '';
    const generator = html.match(/id="__VIEWSTATEGENERATOR" value="([^"]+)"/)?.[1] || '';
    const validation = html.match(/id="__EVENTVALIDATION" value="([^"]+)"/)?.[1] || '';

    return {
      viewstate,
      generator,
      validation,
      cookie: cookies.join('; ')
    };
  } catch (e) {
    console.error('Error getting Ideris tokens:', e);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { username, password, proxy } = await request.json();
    
    const agent = proxy ? new HttpsProxyAgent(`http://${proxy}`) : null;
    const tokens = await getInitialTokens(agent);

    if (!tokens) {
      return NextResponse.json({ 
        success: false, 
        error: 'Proxy Error: Não foi possível carregar a página inicial do Ideris.' 
      }, { status: 502 });
    }

    const params = new URLSearchParams();
    params.append('__VIEWSTATE', tokens.viewstate);
    params.append('__VIEWSTATEGENERATOR', tokens.generator);
    params.append('__EVENTVALIDATION', tokens.validation);
    params.append('txtEmail', username);
    params.append('txtSenha', password);
    params.append('btnOk', 'Entrar');
    // ckbManterConectado is usually 'on' if checked
    params.append('ckbManterConectado', 'on');

    const response = await axios.post(LOGIN_URL, params.toString(), {
      httpsAgent: agent,
      proxy: false,
      timeout: 15000,
      maxRedirects: 0, // We want to catch the 302 redirect on success
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        'Cookie': tokens.cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': LOGIN_URL,
        'Origin': 'https://app.ideris.com.br'
      }
    });

    // Check for success indicators:
    // 1. A redirect (302) to a internal page
    // 2. A specific cookie being set (.ASPXAUTH)
    
    const isRedirect = response.status === 302;
    const location = response.headers['location'] || '';
    const responseCookies = response.headers['set-cookie'] || [];
    const hasAuthCookie = responseCookies.some(c => c.includes('.ASPXAUTH'));

    if (isRedirect && (location.toLowerCase().includes('default.aspx') || location.toLowerCase().includes('painel.aspx'))) {
        return NextResponse.json({ success: true, message: 'Login realizado com sucesso!' });
    }

    if (hasAuthCookie) {
        return NextResponse.json({ success: true, message: 'Autenticado via cookie!' });
    }

    // If still on login page or redirected back to login, it failed
    if (response.data && response.data.includes('txtEmail')) {
        // We could look for specific error message in HTML
        return NextResponse.json({ success: false, message: 'Usuário ou senha inválidos' });
    }

    return NextResponse.json({ 
        success: false, 
        message: isRedirect ? `Redirecionado para: ${location}` : 'Falha na autenticação' 
    });

  } catch (error: any) {
    console.error('Ideris Auth Error:', error.message);
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    return NextResponse.json({ 
      success: false, 
      error: isTimeout ? 'Timeout na conexão' : (error.message || 'Erro interno') 
    }, { status: 500 });
  }
}
