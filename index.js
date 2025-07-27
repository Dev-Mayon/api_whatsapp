// =================================================================
// SERVIDOR DE INTEGRAÇÃO WHATSAPP CARGAPLAY v4 (CÓDIGO COMPLETO E FINAL)
// =================================================================

// --- 1. IMPORTAÇÃO DE PACOTES ---
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

// --- 2. CONFIGURAÇÃO INICIAL DO SERVIDOR ---
const app = express();
app.use(bodyParser.json());

// --- 3. LEITURA DAS CREDENCIAIS DO AMBIENTE RENDER ---
const WABA_ID = process.env.WABA_ID;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const WC_URL = process.env.WC_URL;
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

const META_API_URL = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

// --- 4. FUNÇÃO PRINCIPAL PARA ENVIAR MENSAGENS ---
async function sendMessage(to, templateName, components = []) {
    console.log(`Tentando enviar template '${templateName}' para o número ${to}...`);
    if (!WABA_ID || !PHONE_NUMBER_ID || !META_ACCESS_TOKEN) {
        console.error('ERRO: Variáveis de ambiente do WhatsApp não configuradas.');
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
            template: { name: templateName, language: { code: 'pt_BR' }, components: components }
        };
        await axios.post(META_API_URL, payload, {
            headers: { 'Authorization': `Bearer ${META_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }
        });
        console.log(`SUCESSO: Mensagem com template '${templateName}' enviada para ${formattedTo}.`);
    } catch (error) {
        console.error(`ERRO ao enviar mensagem para ${formattedTo}:`, error.response ? error.response.data : error.message);
    }
}

// --- 5. ENDPOINTS (URLs) PARA CADA TEMPLATE ---

// 1. Pedido concluído (template: pedido) - Lógica complexa com busca de código
app.post('/webhook/pedido', async (req, res) => {
    const data = req.body;
    const orderId = data.order_key; 

    if (!orderId) {
        console.log('ERRO: Order ID (order_key) não foi recebido do Automator.');
        return res.status(400).send('Order ID não recebido.');
    }

    console.log(`Webhook para o pedido ${orderId} recebido. AGUARDANDO 15 SEGUNDOS...`);
    await new Promise(resolve => setTimeout(resolve, 15000));
    console.log(`Pausa de 15 segundos completa. Buscando dados do pedido ${orderId}...`);

    try {
        if (!WC_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
            console.error('ERRO: Variáveis de ambiente do WooCommerce não estão configuradas.');
            return res.status(500).send('Erro de configuração do servidor.');
        }

        const response = await axios.get(`${WC_URL}/wp-json/wc/v3/orders/${orderId}`, {
            auth: { username: WC_CONSUMER_KEY, password: WC_CONSUMER_SECRET }
        });

        const orderData = response.data;
        const phoneNumber = orderData.billing.phone;
        const firstName = orderData.billing.first_name || 'Cliente';
        const orderItems = orderData.line_items.map(item => item.name).join(', ') || 'Produto não especificado';
        const orderTotal = `R$ ${parseFloat(orderData.total).toFixed(2).replace('.', ',')}`;
        
        let activationCode = 'N/A';
        if (orderData.line_items && orderData.line_items.length > 0) {
            const lineItem = orderData.line_items[0];
            const metaData = lineItem.meta_data || [];
            const activationCodeObject = metaData.find(meta => meta.key === '_activation_keys');
            if (activationCodeObject) {
                activationCode = activationCodeObject.value;
            }
        }
        console.log(`Código de ativação encontrado: ${activationCode}`);
        
        if (phoneNumber && phoneNumber.length > 5) {
            const components = [ { type: 'body', parameters: [ { type: 'text', text: firstName }, { type: 'text', text: orderItems }, { type: 'text', text: orderTotal }, { type: 'text', text: activationCode } ] } ];
            await sendMessage(phoneNumber, 'pedido', components);
        } else {
            console.log(`AVISO: Pedido ${orderId} não possui número de telefone no WooCommerce.`);
        }

        res.status(200).send('Processamento do webhook do WhatsApp concluído.');

    } catch (apiError) {
        console.error(`ERRO no processamento do pedido ${orderId}:`, apiError.response ? apiError.response.data : apiError.message);
        res.status(500).send('Erro ao processar o webhook.');
    }
});

// 2. Lembrete 3 dias antes de expirar (template: lembrete_3dias) - Lógica simples
app.post('/webhook/lembrete_3dias', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /lembrete_3dias recebido para:', contact.email);
    const components = [ { type: 'body', parameters: [ { type: 'text', text: contact.first_name || 'Cliente' } ] } ];
    await sendMessage(contact.phone, 'lembrete_3dias', components);
    res.status(200).send('Webhook de lembrete 3 dias processado.');
});

// 3. Expira hoje (template: expira_hoje)
app.post('/webhook/expira_hoje', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /expira_hoje recebido para:', contact.email);
    const components = [ { type: 'body', parameters: [ { type: 'text', text: contact.first_name || 'Cliente' } ] } ];
    await sendMessage(contact.phone, 'expira_hoje', components);
    res.status(200).send('Webhook de expira hoje processado.');
});

// 4. Lembrete 35 dias (template: lembrete_35dias)
app.post('/webhook/lembrete_35dias', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /lembrete_35dias recebido para:', contact.email);
    const components = [ { type: 'body', parameters: [ { type: 'text', text: contact.first_name || 'Cliente' } ] } ];
    await sendMessage(contact.phone, 'lembrete_35dias', components);
    res.status(200).send('Webhook de lembrete 35 dias processado.');
});

// 5. Lembrete 40 dias CUPOM (template: lembrete_40dias_cupom)
app.post('/webhook/lembrete_40dias_cupom', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /lembrete_40dias_cupom recebido para:', contact.email);
    const components = [ { type: 'body', parameters: [ { type: 'text', text: contact.first_name || 'Cliente' } ] } ];
    await sendMessage(contact.phone, 'lembrete_40dias_cupom', components);
    res.status(200).send('Webhook de lembrete 40 dias cupom processado.');
});

// 6. Lembrete 57 dias CUPOM (template: lembrete_57_dias_cupom)
app.post('/webhook/lembrete_57_dias_cupom', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /lembrete_57_dias recebido para:', contact.email);
    const components = [ { type: 'body', parameters: [ { type: 'text', text: contact.first_name || 'Cliente' } ] } ];
    await sendMessage(contact.phone, 'lembrete_57_dias_cupom', components);
    res.status(200).send('Webhook de lembrete 57 dias cupom processado.');
});

// 7. Lembrete 60 dias (template: 60dias)
app.post('/webhook/60dias', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /60dias recebido para:', contact.email);
    const components = [ { type: 'body', parameters: [ { type: 'text', text: contact.first_name || 'Cliente' } ] } ];
    await sendMessage(contact.phone, '60dias', components);
    res.status(200).send('Webhook de 60 dias processado.');
});

// --- 6. ENDPOINT DE VERIFICAÇÃO E INÍCIO DO SERVIDOR ---
app.get('/', (req, res) => {
    res.send('Servidor CargaPlay WhatsApp v4 (COMPLETO E FINAL) está no ar!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor v4 escutando na porta ${PORT}`);
});