require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  Routes,
  REST,
  PermissionFlagsBits
} = require("discord.js");

const express = require("express");
const { v4: uuidv4 } = require("uuid");

const db = require("./database");
const { criarPagamento } = require("./payments");
const { setupWebhook } = require("./webhook");

const app = express();
app.use(express.json());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});


// ===== REGISTRAR COMANDO =====
const commands = [
  new SlashCommandBuilder()
    .setName("painel")
    .setDescription("Criar painel de vendas")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON()
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log("Comandos registrados.");
})();


// ===== INTERAÇÕES =====
client.on("interactionCreate", async (interaction) => {

  // Slash
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "painel") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("comprar_vip")
          .setLabel("Comprar VIP - R$50")
          .setStyle(ButtonStyle.Success)
      );

      await interaction.reply({
        content: "🛒 Painel de Compras",
        components: [row]
      });
    }
  }

  // Botão
  if (interaction.isButton()) {

    if (interaction.customId === "comprar_vip") {

      const paymentId = uuidv4();

      await interaction.reply({
        content: "⏳ Gerando pagamento...",
        flags: 64 // substitui ephemeral
      });

      try {

        const pagamento = await criarPagamento(50, paymentId);

        db.run(
          "INSERT INTO payments VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
          [
            paymentId,
            interaction.user.id,
            "VIP",
            50,
            "pending"
          ]
        );

        await interaction.followUp({
          content: `
💰 Pagamento Gerado!

👤 Nome: Valen Alves

📋 PIX Copia e Cola:
${pagamento.paymentCode}

⚠️ Após o pagamento a entrega é automática.
          `,
          flags: 64
        });

      } catch (error) {
        await interaction.followUp({
          content: "❌ Erro ao gerar pagamento.",
          flags: 64
        });
      }
    }
  }
});


// ===== INICIAR =====
client.login(process.env.DISCORD_TOKEN);

setupWebhook(app, client);

app.listen(process.env.PORT, () => {
  console.log("Servidor rodando na porta " + process.env.PORT);
});
