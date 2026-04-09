import { NextResponse } from 'next/server';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { HttpsProxyAgent } from 'https-proxy-agent';

const ENCRYPTION_KEY = 'viking institucionalizado';
const LOGIN_URL = 'https://www.bling.com.br/login';
const AUTH_API = 'https://www.bling.com.br/Api/v3/auth';

function encryptPassword(password: string) {
  return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
}

async function getTokens(agent: any) {
  try {
    const response = await axios.get(LOGIN_URL, { 
      httpsAgent: agent,
      proxy: false,
      timeout: 12000, // Aumentado para lidar com proxies lentos
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    const html = response.data;
    const setCookie = response.headers['set-cookie'];
    const phpSessId = setCookie ? setCookie.find((c: string) => c.startsWith('PHPSESSID'))?.split(';')[0] : '';
    
    const csrfNameMatch = html.match(/name="csrf_name"\s+value="([^"]+)"/);
    const csrfValueMatch = html.match(/name="csrf_value"\s+value="([^"]+)"/);
    
    return {
      csrf_name: csrfNameMatch ? csrfNameMatch[1] : '',
      csrf_value: csrfValueMatch ? csrfValueMatch[1] : '',
      cookie: phpSessId || ''
    };
  } catch (e) {
    return null;
  }
}

export async function POST(request: Request) {
  const { username, password, proxy } = await request.json();
  
  const agent = proxy ? new HttpsProxyAgent(`http://${proxy}`) : null;
  const tokens = await getTokens(agent);

  if (!tokens) {
    return NextResponse.json({ 
      success: false, 
      error: 'Proxy Error: Não foi possível obter os tokens do Bling. O proxy pode estar offline ou bloqueado pelo WAF.' 
    }, { status: 502 });
  }

  const encryptedPassword = encryptPassword(password);

  try {
    const response = await axios.post(AUTH_API, {
      login: username,
      loginWidget: null,
      password: encryptedPassword,
      redirectUrl: null,
      deviceIDDLocal: "",
      csrf_name: tokens.csrf_name,
      csrf_value: tokens.csrf_value
    }, {
      httpsAgent: agent,
      proxy: false,
      timeout: 10000,
      headers: {
        'Cookie': tokens.cookie,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': LOGIN_URL,
        'X-Requested-With': 'XMLHttpRequest'
      },
      validateStatus: () => true
    });

    if (response.status === 200) {
      return NextResponse.json({ success: true, data: response.data });
    } else {
      const errorMsg = response.data?.error?.message || `HTTP ${response.status}`;
      return NextResponse.json({ success: false, status: response.status, message: errorMsg }, { status: response.status });
    }
  } catch (error: any) {
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    const message = isTimeout 
      ? 'Timeout: O proxy demorou muito para responder (10s limite).' 
      : (error.message || 'Erro inesperado na conexão');
    return NextResponse.json({ success: false, error: message }, { status: 504 });
  }
}
