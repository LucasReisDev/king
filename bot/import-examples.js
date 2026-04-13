const db = require('./database');

const sales = [
`Detalhe da venda
O seu comprador pagou
Smart Tv Profissional 4k 75 LG Uhd 75au801 Processador 7 Ai Ger8 Super Upscaling Google Cast Alexa Integrado Controle Ai Smart Magic Webos 25 (1 unid):
R$ 4999,00
Desconto:
R$ 100,00
Envio:
R$ 0,00
Total:
R$ 4899,00
Foi debitado do que você recebeu
Tarifa Envio
R$ 126,55
Tarifa de venda
R$ 0,00
Total debitado:
-R$ 126,55
Custo do Produto:
R$ 0,00
Estorno:
R$ 0,00
Sobrou:
R$ 4872,45
Total Líquido:
R$ 4772,45
Detalhes do pagamento
Status	Valor	Criação	Aprovação	Forma de pagamento
in_mediation	1900,00	09/03/2026 09:14:51	09/03/2026 09:15:42	 transferência bancária
in_mediation	2999,00	09/03/2026 09:14:51	09/03/2026 09:15:43	 Cartão de credito
Dados do Comprador
Bruno Lopes Cordovil (BRUNOLOPESCORDOVIL)
E-mail
CPF
CPF 10004061640
Cidade/Estado
Belo Horizonte, Minas Gerais
Telefone
Telefone alternativo não informado
Informações de entrega
Prazo para envio
12/03/2026 00:00:00 à 12/03/2026 00:00:00
Status
Entregue

Forma de envio
Normal
Data de envio
09/03/2026 09:14:50
Endereco
Rua Cônsul Walter, 188, Buritis - 30575140 - Belo Horizonte, Minas Gerais, Brasil, 402, Belo Horizonte
Quem retira
Bruno Lopes Cordovil(XXXXXXX)
Custo de envio
R$ 0,00
Código de rastreamento
MEL46613749490LMFFF01`,

`Detalhe da venda
O seu comprador pagou
Smart Tv Samsung 43 Ls43f6000fgxzd Full Hd Led 110v/220v (1 unid):
R$ 1760,23
Desconto:
R$ 0,00
Envio:
R$ 0,00
Total:
R$ 1760,23
Foi debitado do que você recebeu
Tarifa Envio
R$ 74,95
Tarifa de venda
R$ 0,00
Total debitado:
-R$ 74,95
Custo do Produto:
R$ 0,00
Estorno:
R$ 0,00
Sobrou:
R$ 1685,28
Total Líquido:
R$ 1685,28
Detalhes do pagamento
Status	Valor	Criação	Aprovação	Forma de pagamento
in_mediation	1760,23	09/03/2026 13:53:11	09/03/2026 13:53:13	 Cartão de credito
Dados do Comprador
CARLA DUARTE (C20250403180939)
E-mail
CPF
CPF 02975944780
Cidade/Estado
Nova Friburgo, Rio de Janeiro
Telefone
Telefone alternativo não informado
Informações de entrega
Prazo para envio
16/03/2026 00:00:00 à 16/03/2026 00:00:00
Status
Entregue

Forma de envio
Normal
Data de envio
09/03/2026 13:53:14
Endereco
Rua José da Rosa Ramos, 01, Lagoinha - 28625420 - Nova Friburgo, Rio de Janeiro, Brasil, , Nova Friburgo
Quem retira
Lúcia Helena Antunes(XXXXXXX)
Custo de envio
R$ 0,00
Código de rastreamento
46a8dfe3-6678-5c53-b3e7-ec90bbf173d7`,

`Detalhe da venda
O seu comprador pagou
Smart Tv 43 Philco P43vik Roku Led Dolby Audio Wi-fi Hdmi Hdr Full Hd 110/220v (1 unid):
R$ 1499,00
Desconto:
R$ 0,00
Envio:
R$ 0,00
Total:
R$ 1499,00
Foi debitado do que você recebeu
Tarifa Envio
R$ 73,45
Tarifa de venda
R$ 0,00
Total debitado:
-R$ 73,45
Custo do Produto:
R$ 0,00
Estorno:
R$ 0,00
Sobrou:
R$ 1425,55
Total Líquido:
R$ 1425,55
Detalhes do pagamento
Status	Valor	Criação	Aprovação	Forma de pagamento
in_mediation	1499,00	01/03/2026 08:20:41	01/03/2026 08:20:41	 Dinheiro em conta
Dados do Comprador
Antonio Do Nascimento Marta (ANTONIODONASCIMENTOMARTAMA)
E-mail
CPF
CPF 03734541557
Cidade/Estado
Vera Cruz, Bahia
Telefone
Telefone alternativo não informado
Informações de entrega
Prazo para envio
06/03/2026 00:00:00 à 06/03/2026 00:00:00
Status
Entregue

Forma de envio
Prioritario
Data de envio
01/03/2026 08:20:39
Endereco
Rua Rio Grande, 1, cacha pregos - 44470000 - Vera Cruz, Bahia, Brasil, casa Referencia: entrada antes do venha ver loca estaleiro de jorcy, Vera Cruz
Quem retira
Antônio do Nascimento marta(XXXXXXX)
Custo de envio
R$ 0,00
Código de rastreamento
54dbbdc1-9fb2-5fa9-b440-6b70f967fd8f`
];

db.initDb();
sales.forEach(s => db.addSale(s));
console.log('✅ 3 vendas importadas com sucesso!');
