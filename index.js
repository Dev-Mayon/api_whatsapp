// Importa os pacotes necessários
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

// Inicializa o servidor web
const app = express();
// Usa o body-parser para conseguir ler os dados JSON enviados pelo WordPress
app.use(bodyParser.json());

// Define a porta do servidor. A Render nos dará essa porta.
const PORT = process.env.PORT || 3000;

// Variáveis de configuração da API da Meta (vamos preencher na Render)
const WABA_ID = process.env.WABA_ID; // ID da Conta do WhatsApp Business
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; // ID do Número de Telefone
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN; // Token de Acesso

/**
 * Endpoint principal que vai receber os webhooks do FluentCRM.
 * O WordPress vai enviar os dados para um endereço como: https://seu-servidor.onrender.com/webhook
 */
app.post('/webhook', (req, res) => {
    // Pega os dados enviados pelo FluentCRM
    const webhookData = req.body;

    // Apenas para teste inicial: mostra os dados recebidos no log do servidor
    console.log('--- Webhook Recebido ---');
    console.log(JSON.stringify(webhookData, null, 2));
    console.log('------------------------');

    // Aqui, no futuro, vamos adicionar a lógica para:
    // 1. Identificar qual mensagem enviar (pedido concluído, lembrete, etc.)
    // 2. Pegar o telefone e o nome do cliente dos dados recebidos.
    // 3. Montar a chamada para a API da Meta.
    // 4. Fazer a chamada com o 'axios' para enviar o WhatsApp.

    // Envia uma resposta de sucesso para o WordPress saber que recebemos os dados.
    res.status(200).send('Webhook recebido com sucesso!');
});

/**
 * Endpoint de verificação, apenas para saber se o servidor está no ar.
 */
app.get('/', (req, res) => {
    res.send('Servidor CargaPlay WhatsApp está no ar!');
});

// Inicia o servidor e o faz "escutar" por conexões na porta definida
app.listen(PORT, () => {
    console.log(`Servidor escutando na porta ${PORT}`);
});