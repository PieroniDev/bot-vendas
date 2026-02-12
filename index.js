require("dotenv").config();
const express = require("express");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { createPayment } = require("./payments");
const db = require("./database");

const app = express();
app.use(express.json());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

client.once("ready", () => {
  console.log(`Bot logado como ${client.user.tag}`);
});

/*
========================
COMANDO DE COMPRA
========================
*/

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "comprar") {
    await interaction.deferReply({ flags: 64 });

    try {
      const produto = {
        nome: "Produto VIP",
        valor: 50
      };

      const payment = await createPayment(
        produto,
        interaction.user.id,
        interaction.user.username
      );

      db.savePayment(payment.id, interaction.user.id, produto.nome);

      await interaction.editReply(
        `💰 PIX gerado!\n\n` +
        `Valor: R$${produto.valor}\n\n` +
        `Copia e Cola:\n${payment.pixCode}\n\n` +
        `Após o pagamento o produto será entregue automaticamente.`
      );

    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ Erro ao gerar pagamento.");
    }
  }
});

/*
========================
WEBHOOK SYNC PAY
========================
*/

app.post("/webhook", async (req, res) => {
  console.log("Webhook recebido:", req.body);

  const data = req.body.data;

  if (!data) return res.sendStatus(200);

  if (data.status === "approved") {

    const paymentId = data.id;
    const payment = db.getPayment(paymentId);

    if (!payment) return res.sendStatus(200);

    const user = await client.users.fetch(payment.discordId);

    await user.send(
      `✅ Pagamento aprovado!\n\n` +
      `🎁 Seu produto: ${payment.produto}\n\n` +
      `Obrigado pela compra!`
    );

    db.deletePayment(paymentId);
  }

  res.sendStatus(200);
});

/*
========================
SERVIDOR EXPRESS
========================
*/

app.listen(process.env.PORT || 10000, () => {
  console.log("Servidor rodando...");
});

client.login(process.env.DISCORD_TOKEN);
