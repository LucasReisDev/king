const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'sales.json');

// Inicializa o banco de dados (arquivo JSON)
function initDb() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
        console.log('Arquivo sales.json criado.');
    } else {
        console.log('Banco de dados JSON pronto.');
    }
}

// Lê as vendas do arquivo
function readSales() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Escreve as vendas no arquivo
function writeSales(sales) {
    fs.writeFileSync(DB_PATH, JSON.stringify(sales, null, 2));
}

// Adiciona uma nova venda
function addSale(content) {
    const sales = readSales();
    sales.push({
        id: Date.now() + Math.random(),
        content: content,
        created_at: new Date().toISOString()
    });
    writeSales(sales);
    console.log('Venda adicionada ao JSON.');
}

// Recupera a próxima venda e a exclui
function getNextSale() {
    const sales = readSales();
    if (sales.length === 0) return null;

    const sale = sales.shift(); // Remove o primeiro (mais antigo)
    writeSales(sales);
    return sale.content;
}

// Conta quantas vendas restam
function countSales() {
    const sales = readSales();
    return sales.length;
}

module.exports = {
    initDb,
    addSale,
    getNextSale,
    countSales
};
