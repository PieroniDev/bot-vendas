const axios = require("axios");

async function getToken() {
  const response = await axios.post(
    `${process.env.SYNC_BASE_URL}/v1/oauth/token`,
    {
      client_id: process.env.SYNC_CLIENT_ID,
      client_secret: process.env.SYNC_CLIENT_SECRET
    }
  );

  return response.data.access_token;
}

async function createPayment(produto, discordId, username) {
  const token = await getToken();

  const response = await axios.post(
    `${process.env.SYNC_BASE_URL}/v1/gateway/api`,
    {
      amount: produto.valor,
      paymentMethod: "PIX",
      postbackUrl: `${process.env.BASE_URL}/webhook`,
      customer: {
        name: username,
        email: "cliente@email.com",
        document: "00000000000"
      },
      items: [
        {
          title: produto.nome,
          quantity: 1,
          unitPrice: produto.valor
        }
      ],
      metadata: {
        discordId: discordId
      }
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

  return {
    id: response.data.data.id,
    pixCode: response.data.data.pix_code
  };
}

module.exports = { createPayment };
