// =================================================================
// SERVIDOR DE INTEGRAÇÃO WHATSAPP CARGAPLAY
// =================================================================

// --- 1. IMPORTAÇÃO DE PACOTES ---
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

// --- 2. CONFIGURAÇÃO INICIAL DO SERVIDOR ---
const app = express();
app.use(bodyParser.json()); // Permite ao servidor ler dados JSON

// --- 3. LEITURA DAS CREDENCIAIS DO AMBIENTE RENDER ---
const WABA_ID = process.env.WABA_ID; // ID da Conta do WhatsApp Business
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; // ID do Número de Telefone
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN; // Token de Acesso da Meta

const META_API_URL = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

// --- 4. FUNÇÃO PRINCIPAL PARA ENVIAR MENSAGENS ---
/**
 * Envia uma mensagem de template para um número de telefone.
 * @param {string} to - O número de telefone do destinatário (ex: 5584998435471).
 * @param {string} templateName - O nome exato do modelo aprovado na Meta.
 * @param {Array<object>} components - Um array com os parâmetros para o template.
 */
async function sendMessage(to, templateName, components = []) {
    console.log(`Tentando enviar template '${templateName}' para o número ${to}...`);

    // Verifica se temos todas as credenciais necessárias
    if (!WABA_ID || !PHONE_NUMBER_ID || !META_ACCESS_TOKEN) {
        console.error('ERRO: Variáveis de ambiente não configuradas. Verifique WABA_ID, PHONE_NUMBER_ID, e META_ACCESS_TOKEN na Render.');
        return;
    }
    
    // Remove o DDI 55 se já estiver presente e garante que o número comece com 55
    let formattedTo = to.replace(/\D/g, ''); // Remove todos os não-dígitos
    if (formattedTo.startsWith('55')) {
        // Já está correto, não faz nada
    } else {
        formattedTo = `55${formattedTo}`;
    }

    try {
        const payload = {
            messaging_product: 'whatsapp',
            to: formattedTo,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: 'pt_BR'
                },
                components: components
            }
        };

        console.log('Enviando o seguinte payload para a Meta:', JSON.stringify(payload, null, 2));

        await axios.post(META_API_URL, payload, {
            headers: {
                'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`SUCESSO: Mensagem com template '${templateName}' enviada para ${formattedTo}.`);

    } catch (error) {
        console.error(`ERRO ao enviar mensagem para ${formattedTo}:`);
        if (error.response) {
            // O pedido foi feito e o servidor respondeu com um status de erro
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            // O pedido foi feito mas nenhuma resposta foi recebida
            console.error('Request:', error.request);
        } else {
            // Algo aconteceu ao configurar o pedido que despoletou um erro
            console.error('Error Message:', error.message);
        }
    }
}


// --- 5. ENDPOINTS (URLs) PARA CADA AUTOMAÇÃO ---

// Endpoint para Pedido Concluído
app.post('/webhook/pedido_concluido', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /pedido_concluido recebido para:', contact.email);
    
    // NOTA: Precisamos descobrir como obter os dados do pedido (nome do produto, valor, chave)
    // Por enquanto, vamos enviar um teste com dados fixos.
    const components = [
        { type: 'body', parameters: [{ type: 'text', text: contact.first_name || 'Cliente' }, { type: 'text', text: 'Produto Teste' }, { type: 'text', text: 'R$ 29,90' }, { type: 'text', text: 'CHAVE-TESTE-123' }] }
    ];
    await sendMessage(contact.phone, 'ped_concluido', components);
    res.status(200).send('Webhook de pedido concluído processado.');
});

// Endpoint para o lembrete de 27 dias
app.post('/webhook/lembrete_27_dias', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /lembrete_27_dias recebido para:', contact.email);

    const components = [
        { type: 'body', parameters: [{ type: 'text', text: contact.first_name || 'Cliente' }] }
    ];
    await sendMessage(contact.phone, 'lembrete_vencimento_3_dias', components);
    res.status(200).send('Webhook de lembrete 27 dias processado.');
});

// Endpoint para o aviso de expiração hoje
app.post('/webhook/expira_hoje', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /expira_hoje recebido para:', contact.email);

    const components = [
        { type: 'body', parameters: [{ type: 'text', text: contact.first_name || 'Cliente' }] }
    ];
    await sendMessage(contact.phone, 'aviso_expiracao_hoje', components);
    res.status(200).send('Webhook de expira hoje processado.');
});

// ... (Adicionaremos os outros endpoints aqui depois) ...


// --- 6. ENDPOINT DE VERIFICAÇÃO E INÍCIO DO SERVIDOR ---
app.get('/', (req, res) => {
    res.send('Servidor CargaPlay WhatsApp v2 está no ar!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor v2 escutando na porta ${PORT}`);
});