// =================================================================
// SERVIDOR DE INTEGRAÇÃO WHATSAPP CARGAPLAY v4 (PRODUÇÃO) - ATUALIZADO
// =================================================================

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

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

// --- 5. ENDPOINT DE PEDIDO ---
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
            for (const [i, lineItem] of orderData.line_items.entries()) {
                const metaData = lineItem.meta_data || [];
                console.log(`meta_data do line_item [${i}]:`, metaData);

                // Busca por vários possíveis nomes de campo (amplie se necessário)
                const activationCodeObject = metaData.find(meta =>
                    meta.key === '_activation_keys' ||
                    meta.key === 'activation_key' ||
                    meta.key === 'key_code' ||
                    meta.key === 'chave' ||
                    meta.key === 'license' ||
                    meta.key === 'license_key'
                );

                if (activationCodeObject) {
                    if (Array.isArray(activationCodeObject.value)) {
                        activationCode = activationCodeObject.value[0];
                    } else {
                        activationCode = activationCodeObject.value;
                    }
                    // Sai do loop ao encontrar o primeiro válido
                    break;
                }
            }
        }

        if (activationCode === 'N/A') {
            console.log('ATENÇÃO: Nenhuma chave de ativação encontrada nos meta_data dos itens do pedido.');
        } else {
            console.log(`Código de ativação encontrado: ${activationCode}`);
        }

        if (phoneNumber && phoneNumber.length > 5) {
            const components = [
                {
                    type: 'body',
                    parameters: [
                        { type: 'text', text: firstName },
                        { type: 'text', text: orderItems },
                        { type: 'text', text: orderTotal },
                        { type: 'text', text: activationCode }
                    ]
                }
            ];
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

// --- 6. ENDPOINT DE VERIFICAÇÃO E INÍCIO DO SERVIDOR ---
app.get('/', (req, res) => {
    res.send('Servidor CargaPlay WhatsApp (PRODUÇÃO) está no ar!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de produção escutando na porta ${PORT}`);
});
