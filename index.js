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

// NOVO: Gatilho para envio do template 'pedido'
app.post('/webhook/pedido', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /pedido recebido para:', contact.phone);
    // Envie as variáveis conforme ordem do template: nome, produto, valor, código
    const components = [
        { type: 'body', parameters: [
            { type: 'text', text: contact.first_name || 'Cliente' },
            { type: 'text', text: contact.produto || 'Produto Teste' },
            { type: 'text', text: contact.valor || 'R$ 29,90' },
            { type: 'text', text: contact.codigo || 'CHAVE-TESTE-123' }
        ]}
    ];
    await sendMessage(contact.phone, 'pedido', components);
    res.status(200).send('Webhook de pedido processado.');
});

// Outros endpoints (mantidos)
// ... [os demais endpoints continuam iguais ao seu exemplo, removi aqui só para enxugar]

// --- 6. ENDPOINT DE VERIFICAÇÃO E INÍCIO DO SERVIDOR ---
app.get('/', (req, res) => {
    res.send('Servidor CargaPlay WhatsApp v3 (FINAL) está no ar!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor v3 escutando na porta ${PORT}`);
});
