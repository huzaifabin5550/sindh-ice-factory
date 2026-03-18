 // ========================================
// SINDH ICE FACTORY - API Storage System
// ========================================

const DB = {

  // ── Dealers ──

  async getDealers() {
    const res = await fetch('/api/dealers');
    return await res.json();
  },

  async getDealer(id) {
    const res = await fetch(`/api/dealers/${id}`);
    return await res.json();
  },

  async addDealer(dealer) {
    const res = await fetch('/api/dealers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dealer)
    });
    return await res.json();
  },

  async deleteDealer(id) {
    const res = await fetch(`/api/dealers/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  // ── Transactions ──

  async addTransaction(txn) {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txn)
    });
    return await res.json();
  },

  async getTransactions() {
    const res = await fetch('/api/transactions');
    return await res.json();
  },

  async getDealerTransactions(dealerId) {
    const res = await fetch(
      `/api/transactions/dealer/${dealerId}`
    );
    return await res.json();
  },

  async getTransactionsByDate(date) {
    const res = await fetch(
      `/api/transactions/date/${date}`
    );
    return await res.json();
  }

};