// =================================================================
// SERVIDOR DE INTEGRAÇÃO WHATSAPP CARGAPLAY v4 (FINAL E ESTÁVEL)
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
const WC_URL = process.env.WC_URL;
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;
const AUTOMATOR_EMAIL_WEBHOOK_URL = process.env.AUTOMATOR_EMAIL_WEBHOOK_URL;

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

// 1. Pedido concluído (template: pedido) - VERSÃO FINAL E ESTÁVEL
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
        const response = await axios.get(`${WC_URL}/wp-json/wc/v3/orders/${orderId}`, {
            auth: { username: WC_CONSUMER_KEY, password: WC_CONSUMER_SECRET }
        });

        const orderData = response.data;
        const phoneNumber = orderData.billing.phone;
        const email = orderData.billing.email;
        const firstName = orderData.billing.first_name || 'Cliente';
        const orderItems = orderData.line_items.map(item => item.name).join(', ') || 'Produto não especificado';
        const orderTotal = `R$ ${parseFloat(orderData.total).toFixed(2).replace('.', ',')}`;
        
        let activationCode = 'N/A';
        if (orderData.line_items && orderData.line_items.length > 0) {
            const metaData = orderData.line_items[0].meta_data || [];
            const activationCodeObject = metaData.find(meta => meta.key === '_activation_keys');
            if (activationCodeObject) {
                activationCode = activationCodeObject.value;
            }
        }
        console.log(`Código de ativação encontrado: ${activationCode}`);
        
        // Tarefa 1: Envia o WhatsApp
        if (phoneNumber && phoneNumber.length > 5) {
            const components = [ { type: 'body', parameters: [ { type: 'text', text: firstName }, { type: 'text', text: orderItems }, { type: 'text', text: orderTotal }, { type: 'text', text: activationCode } ] } ];
            await sendMessage(phoneNumber, 'pedido', components);
        } else {
            console.log(`AVISO: Pedido ${orderId} não possui número de telefone.`);
        }

        // Tarefa 2: Dispara o Webhook para o E-mail
        if (AUTOMATOR_EMAIL_WEBHOOK_URL && email) {
            console.log(`Disparando webhook de e-mail para ${email}...`);
            await axios.post(AUTOMATOR_EMAIL_WEBHOOK_URL, {
                email: email,
                first_name: firstName,
                activation_code: activationCode
            });
            console.log('Webhook de e-mail disparado com sucesso para o Automator.');
        } else {
            console.log('AVISO: Webhook de e-mail não disparado. Verifique a variável de ambiente AUTOMATOR_EMAIL_WEBHOOK_URL e se o pedido tem um e-mail.');
        }

        // Responde ao Automator apenas no final de todo o processo.
        res.status(200).send('Processamento do webhook concluído com sucesso.');

    } catch (apiError) {
        console.error(`ERRO no processamento do pedido ${orderId}:`, apiError.response ? apiError.response.data : apiError.message);
        res.status(500).send('Erro ao processar o webhook.');
    }
});


// Outros endpoints (lembretes)
app.post('/webhook/lembrete_3dias', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /lembrete_3dias recebido para:', contact.email);
    const components = [ { type: 'body', parameters: [ { type: 'text', text: contact.first_name || 'Cliente' } ] } ];
    await sendMessage(contact.phone, 'lembrete_3dias', components);
    res.status(200).send('Webhook de lembrete 3 dias processado.');
});

app.post('/webhook/expira_hoje', async (req, res) => {
    const contact = req.body;
    console.log('Webhook /expira_hoje recebido para:', contact.email);
    const components = [ { type: 'body', parameters: [ { type: 'text', text: contact.first_name || 'Cliente' } ] } ];
    await sendMessage(contact.phone, 'expira_hoje', components);
    res.status(200).send('Webhook de expira hoje processado.');
});

// Adicione aqui os outros endpoints de lembrete se necessário...


// --- 6. ENDPOINT DE VERIFICAÇÃO E INÍCIO DO SERVIDOR ---
app.get('/', (req, res) => {
    res.send('Servidor CargaPlay WhatsApp v4 (FINAL E ESTÁVEL) está no ar!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor v4 escutando na porta ${PORT}`);
});