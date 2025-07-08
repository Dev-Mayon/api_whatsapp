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
const WABA_ID = process.env.WABA_ID;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

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

    let formattedTo = to.replace(/\D/g, '');
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

// --- 5. ENDPOINTS (URLs) PARA CADA TEMPLATE ---
// Lembre-se: ajuste o nome do template e parâmetros conforme o que está aprovado no painel!

// 1. Pedido concluído (template: pedido)
app.post('/webhook/pedido', async (req, res) => {
    const contact = req.body;
    const components = [
        { type: 'body', parameters: [
            { type: 'text', text: contact.first_name || 'Cliente' },
            { type: 'text', text: contact.produto || 'Produto' },
            { type: 'text', text: contact.valor || 'R$ 29,90' },
            { type: 'text', text: contact.codigo || 'CHAVE-123' }
        ]}
    ];
    await sendMessage(contact.phone, 'pedido', components);
    res.status(200).send('Webhook de pedido processado.');
});

// 2. Lembrete 3 dias antes de expirar (template: lembrete_3dias)
app.post('/webhook/lembrete_3dias', async (req, res) => {
    const contact = req.body;
    const components = [
        { type: 'body', parameters: [
            { type: 'text', text: contact.first_name || 'Cliente' }
        ]}
    ];
    await sendMessage(contact.phone, 'lembrete_3dias', components);
    res.status(200).send('Webhook de lembrete 3 dias processado.');
});

// 3. Expira hoje (template: expira_hoje)
app.post('/webhook/expira_hoje', async (req, res) => {
    const contact = req.body;
    const components = [
        { type: 'body', parameters: [
            { type: 'text', text: contact.first_name || 'Cliente' }
        ]}
    ];
    await sendMessage(contact.phone, 'expira_hoje', components);
    res.status(200).send('Webhook de expira hoje processado.');
});

// 4. Lembrete 35 dias (template: lembrete_35dias)
app.post('/webhook/lembrete_35dias', async (req, res) => {
    const contact = req.body;
    const components = [
        { type: 'body', parameters: [
            { type: 'text', text: contact.first_name || 'Cliente' }
        ]}
    ];
    await sendMessage(contact.phone, 'lembrete_35dias', components);
    res.status(200).send('Webhook de lembrete 35 dias processado.');
});

// 5. Lembrete 40 dias CUPOM (template: lembrete_40dias_cupom)
app.post('/webhook/lembrete_40dias_cupom', async (req, res) => {
    const contact = req.body;
    const components = [
        { type: 'body', parameters: [
            { type: 'text', text: contact.first_name || 'Cliente' }
        ]}
    ];
    await sendMessage(contact.phone, 'lembrete_40dias_cupom', components);
    res.status(200).send('Webhook de lembrete 40 dias cupom processado.');
});

// 6. Lembrete 57 dias CUPOM (template: lembrete_57_dias_cupom)
app.post('/webhook/lembrete_57_dias_cupom', async (req, res) => {
    const contact = req.body;
    const components = [
        { type: 'body', parameters: [
            { type: 'text', text: contact.first_name || 'Cliente' }
        ]}
    ];
    await sendMessage(contact.phone, 'lembrete_57_dias_cupom', components);
    res.status(200).send('Webhook de lembrete 57 dias cupom processado.');
});

// 7. Lembrete 60 dias (template: 60dias)
app.post('/webhook/60dias', async (req, res) => {
    const contact = req.body;
    const components = [
        { type: 'body', parameters: [
            { type: 'text', text: contact.first_name || 'Cliente' }
        ]}
    ];
    await sendMessage(contact.phone, '60dias', components);
    res.status(200).send('Webhook de 60 dias processado.');
});

// --- 6. ENDPOINT DE VERIFICAÇÃO E INÍCIO DO SERVIDOR ---
app.get('/', (req, res) => {
    res.send('Servidor CargaPlay WhatsApp v3 (FINAL) está no ar!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor v3 escutando na porta ${PORT}`);
});
