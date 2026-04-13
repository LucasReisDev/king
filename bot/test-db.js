const db = require('./database');

// Inicializa
db.initDb();

console.log('--- TESTE DE BANCO DE DADOS ---');

// Adiciona uma venda de teste
const testContent = "Detalhe da venda\nO seu comprador pagou\nItem de Teste\nR$ 100,00";
db.addSale(testContent);
console.log('1. Venda de teste adicionada.');

// Conta
console.log('2. Total de vendas:', db.countSales());

// Recupera
const retrieved = db.getNextSale();
console.log('3. Venda recuperada:', retrieved);

// Verifica exclusão
console.log('4. Total após recuperação:', db.countSales());

if (retrieved === testContent && db.countSales() === 0) {
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
} else {
    console.log('\n❌ FALHA NO TESTE.');
}
