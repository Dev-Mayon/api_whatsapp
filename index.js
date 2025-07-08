// =================================================================
// SERVIDOR DE INTEGRAÇÃO WHATSAPP CARGAPLAY v3 (FINAL)
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

const META_API_URL = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

// --- 4. FUNÇÃO PRINCIPAL PARA ENVIAR MENSAGENS ---
/**
 * Envia uma mensagem de template para um número de telefone.
 * @param {string} to - O número de telefone do destinatário (ex: 5584998435471).
 * @param {string} templateName - O nome exato do modelo aprovado na Meta.
 * @param {Array<object>} components - Um array com os parâmetros para o template.
 */
async function sendMessage(to, templateName, components = []) {
    console.log(`Tentando enviar template '${templateName}' para o número ${to}...`);

    if (!WABA_ID || !PHONE_NUMBER_ID || !META_ACCESS_TOKEN) {
        console.error('ERRO: Variáveis de ambiente não configuradas. Verifique WABA_ID, PHONE_NUMBER_ID, e META_ACCESS_TOKEN na Render.');
        return;
    }
    
    let formattedTo = to.replace(/\D/g, ''); // Remove todos os não-dígitos
    if (!formattedTo.startsWith('55')) {
        formattedTo = `55${formattedTo}`;
    }

    try {
        const payload = {
            messaging_product: 'whatsapp',
            to: formattedTo,
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'pt_BR' },
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
        console.error(`ERRO ao enviar mensagem para ${formattedTo}:`, error.response ? error.response.data : error.message);
    }
}

// --- 5. ENDPOINTS (URLs) PARA CADA AUTOMAÇÃO ---

// Gatilho: Pedido Concluído
app.post('/webhook/pedido_concluido', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /pedido_concluido recebido para:', contact.email);
    // NOTA: Precisamos de descobrir como obter os dados do pedido (nome do produto, valor, chave)
    const components = [
        { type: 'body', parameters: [
            { type: 'text', text: contact.first_name || 'Cliente' }, 
            { type: 'text', text: 'Produto Teste' }, // Placeholder
            { type: 'text', text: 'R$ 29,90' },     // Placeholder
            { type: 'text', text: 'CHAVE-TESTE-123' } // Placeholder
        ]}
    ];
    await sendMessage(contact.phone, 'ped_concluido', components);
    res.status(200).send('Webhook de pedido concluído processado.');
});

// Gatilho: 27 dias após a compra
app.post('/webhook/lembrete_27_dias', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /lembrete_27_dias recebido para:', contact.email);
    const components = [{ type: 'body', parameters: [{ type: 'text', text: contact.first_name || 'Cliente' }] }];
    await sendMessage(contact.phone, 'lembrete_vencimento_3_dias', components);
    res.status(200).send('Webhook de lembrete 27 dias processado.');
});

// Gatilho: 30 dias após a compra
app.post('/webhook/expira_hoje', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /expira_hoje recebido para:', contact.email);
    const components = [{ type: 'body', parameters: [{ type: 'text', text: contact.first_name || 'Cliente' }] }];
    await sendMessage(contact.phone, 'aviso_expiracao_hoje', components);
    res.status(200).send('Webhook de expira hoje processado.');
});

// Gatilho: 35 dias após a compra
app.post('/webhook/lembrete_35_dias', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /lembrete_35_dias recebido para:', contact.email);
    const components = [{ type: 'body', parameters: [{ type: 'text', text: contact.first_name || 'Cliente' }] }];
    await sendMessage(contact.phone, 'lembrete_pos_expiracao_5_dias', components);
    res.status(200).send('Webhook de lembrete 35 dias processado.');
});

// Gatilho: 40 dias após a compra
app.post('/webhook/lembrete_40_dias', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /lembrete_40_dias recebido para:', contact.email);
    const components = [{ type: 'body', parameters: [{ type: 'text', text: contact.first_name || 'Cliente' }] }];
    await sendMessage(contact.phone, 'lembrete_40_dias_cupom', components);
    res.status(200).send('Webhook de lembrete 40 dias processado.');
});

// Gatilho: 57 dias após a compra
app.post('/webhook/lembrete_57_dias', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /lembrete_57_dias recebido para:', contact.email);
    const components = [{ type: 'body', parameters: [{ type: 'text', text: contact.first_name || 'Cliente' }] }];
    await sendMessage(contact.phone, 'lembrete_57_dias_cupom', components);
    res.status(200).send('Webhook de lembrete 57 dias processado.');
});

// Gatilho: 60 dias após a compra
app.post('/webhook/lembrete_60_dias', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /lembrete_60_dias recebido para:', contact.email);
    const components = [{ type: 'body', parameters: [{ type: 'text', text: contact.first_name || 'Cliente' }] }];
    await sendMessage(contact.phone, 'lembrete_final_60_dias', components);
    res.status(200).send('Webhook de lembrete 60 dias processado.');
});


// --- 6. ENDPOINT DE VERIFICAÇÃO E INÍCIO DO SERVIDOR ---
app.get('/', (req, res) => {
    res.send('Servidor CargaPlay WhatsApp v3 (FINAL) está no ar!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor v3 escutando na porta ${PORT}`);
});