require("dotenv").config();
const axios = require("axios");

// 🔐 1️⃣ GERAR TOKEN
async function gerarToken() {
  const response = await axios.post(
    `${process.env.SYNC_PAY_URL}/api/partner/v1/auth-token`,
    {
      client_id: process.env.SYNC_PAY_CLIENT_ID,
      client_secret: process.env.SYNC_PAY_CLIENT_SECRET
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.access_token;
}


// 💰 2️⃣ CRIAR PAGAMENTO PIX
async function criarPagamento(valor, referenceId) {
  try {
    const token = await gerarToken();

    const response = await axios.post(
      `${process.env.SYNC_PAY_URL}/v1/gateway/api`,
      {
        amount: valor,
        items: [
          {
            title: "VIP Discord",
            quantity: 1,
            unitPrice: valor
          }
        ],
        customer: {
          name: "Valen Alves",
          email: "cliente@email.com",
          document: "00000000000"
        },
        pix: {
          expiresInDays: 1
        },
        postbackUrl: `${process.env.WEBHOOK_PUBLIC_URL}/webhook`,
        metadata: {
          reference: referenceId
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
      paymentCode: response.data.paymentCode,
      transactionId: response.data.id
    };

  } catch (error) {
    console.error("Erro ao criar pagamento:", error.response?.data || error.message);
    throw new Error("Erro ao gerar pagamento");
  }
}

module.exports = { criarPagamento };
