const db = require("./database");

function setupWebhook(app, client) {

  app.post("/webhook", async (req, res) => {
    try {

      const data = req.body;

      // Verificar status pago
      if (data.status === "PAID" || data.status === "paid") {

        const referenceId = data.metadata?.reference;

        if (!referenceId) return res.sendStatus(200);

        db.get(
          "SELECT * FROM payments WHERE id = ?",
          [referenceId],
          async (err, payment) => {

            if (!payment) return;

            if (payment.status === "paid") return;

            db.run(
              "UPDATE payments SET status = 'paid' WHERE id = ?",
              [referenceId]
            );

            const user = await client.users.fetch(payment.user_id);

            // 🎁 ENTREGA AUTOMÁTICA
            await user.send(`
✅ Pagamento confirmado!

📦 Produto: ${payment.product}
💎 Seu VIP foi liberado!

Obrigado pela compra.
            `);

            // 📊 LOG
            const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
            if (logChannel) {
              logChannel.send(`
💰 PAGAMENTO CONFIRMADO
👤 Usuário: <@${payment.user_id}>
📦 Produto: ${payment.product}
💵 Valor: R$ ${payment.value}
              `);
            }
          }
        );
      }

      res.sendStatus(200);

    } catch (error) {
      console.error("Erro no webhook:", error);
      res.sendStatus(500);
    }
  });

}

module.exports = { setupWebhook };
