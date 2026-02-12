const payments = new Map();

function savePayment(id, discordId, produto) {
  payments.set(id, {
    discordId,
    produto
  });
}

function getPayment(id) {
  return payments.get(id);
}

function deletePayment(id) {
  payments.delete(id);
}

module.exports = {
  savePayment,
  getPayment,
  deletePayment
};
