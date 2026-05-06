const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerm = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const express = require('express');
const db = require('./database');
const cors = require('cors');

// Função para encontrar o executável do Chrome no Linux
function getChromePath() {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
    if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
    
    const commonPaths = [
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/local/bin/chromium'
    ];

    for (const p of commonPaths) {
        if (fs.existsSync(p)) return p;
    }
    return null; // Deixa o puppeteer tentar achar no PATH
}


// --- INICIALIZAÇÃO ---
db.initDb();
const app = express();
const port = process.env.PORT || 3000;


let latestQr = null;
let botStatus = 'DISCONNECTED'; // DISCONNECTED, CONNECTING, READY


app.use(cors({ origin: '*' })); // Libera Geral
app.use(express.json());

// Permite acessar arquivos como qr.png via URL
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// --- API PARA A INTERFACE WEB ---

// Retorna o status e o QR Code em base64
app.get('/api/status', (req, res) => {
    res.json({ 
        total: db.countSales(),
        status: botStatus,
        qr: latestQr 
    });
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, timestamp: new Date() });
});


// Alias para contagem legada
app.get('/api/count', (req, res) => {
    res.json({ total: db.countSales() });
});

// Adiciona vendas via interface web
app.post('/api/add', (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false });

    // Identifica novos formatos: "Detalhe da" OU "Data: XX/XX/XXXX"
    const parts = content.split(/(?=Detalhe da|Data: \d{2}\/\d{2}\/\d{4})/);
    let addedCount = 0;

    for (const part of parts) {
        const cleanPart = part.replace(/-{3,}/g, '').trim();
        // Aceita se tiver "Detalhe da" OU se começar com "Data:"
        if (cleanPart && (cleanPart.includes('Detalhe da') || /^Data: \d{2}\/\d{2}\/\d{4}/.test(cleanPart))) {
            db.addSale(cleanPart);
            addedCount++;
        }
    }

    res.json({ success: true, added: addedCount });
});

app.listen(port, () => {
    console.log(`🌐 Interface web rodando em http://localhost:${port}`);
});

// --- LÓGICA DO WHATSAPP ---

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, '.wwebjs_auth')
    }),
    webVersionCache: {
        type: 'none'
    },
    authTimeoutMs: 0,
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
        executablePath: getChromePath()
    }
});




const qrPath = path.join(__dirname, 'qr.png');

client.on('qr', async (qr) => {
    botStatus = 'DISCONNECTED';
    console.log('--- NOVO QR CODE GERADO ---');
    qrcodeTerm.generate(qr, { small: true });
    
    try {
        // Converte para Base64 para exibir no dashboard
        latestQr = await QRCode.toDataURL(qr);
        // Também mantém o arquivo original por segurança
        await QRCode.toFile(qrPath, qr);
        console.log('🖼️  O arquivo "qr.png" foi atualizado. Disponível também no Dashboard!');
    } catch (err) {
        console.error('Erro ao gerar imagem QR:', err);
    }
});

client.on('ready', () => {
    botStatus = 'READY';
    latestQr = null;
    console.log('🤖 Bot de Vendas está ONLINE!');
    if (fs.existsSync(qrPath)) {
        fs.unlinkSync(qrPath);
    }
});

client.on('message', async (msg) => {
    if (msg.body.trim().toLowerCase() === '!ref') {
        const saleContent = db.getNextSale();
        
        if (saleContent) {
            const messageToSend = `📦 *ENTREGA DE VENDA*\n\n${saleContent}`;
            await client.sendMessage(msg.from, messageToSend);
            
            const remaining = db.countSales();
            await client.sendMessage(msg.from, `📊 *Dados enviados com sucesso!*\nRestam *${remaining}* dados no banco de dados.`);
            
            console.log(`Venda enviada para ${msg.from}. Restam ${remaining}.`);
        } else {
            await msg.reply('❌ Nenhuma venda cadastrada no banco de dados.');
        }
    }
});

client.on('message_create', async (msg) => {
    if (msg.body.includes('ENTREGA DE VENDA')) return;

    if (msg.fromMe && (msg.body.includes('Detalhe da') || msg.body.includes('Data:'))) {
        // Separa pelo cabeçalho (ambos os formatos)
        const parts = msg.body.split(/(?=Detalhe da|Data: \d{2}\/\d{2}\/\d{4})/);
        let addedCount = 0;

        for (const part of parts) {
            const cleanPart = part.replace(/-{3,}/g, '').trim();
            if (cleanPart && (cleanPart.includes('Detalhe da') || /^Data: \d{2}\/\d{2}\/\d{4}/.test(cleanPart))) {
                db.addSale(cleanPart);
                addedCount++;
            }
        }

        if (addedCount > 0) {
            console.log(`${addedCount} vendas adicionadas. Total no banco: ${db.countSales()}`);
        }
    }

    if (msg.fromMe && msg.body.trim().toLowerCase() === '!ref') {
        const saleContent = db.getNextSale();
        if (saleContent) {
            const messageToSend = `📦 *ENTREGA DE VENDA*\n\n${saleContent}`;
            await client.sendMessage(msg.to, messageToSend);
            const remaining = db.countSales();
            await client.sendMessage(msg.to, `📊 *Dados enviados com sucesso!*\nRestam *${remaining}* dados no banco de dados.`);
        } else {
            await client.sendMessage(msg.to, '❌ *O banco de dados está vazio!* Mande novas vendas primeiro.');
        }
    }
});

client.initialize();
