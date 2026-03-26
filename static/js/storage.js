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

  async updateDealer(id, dealer) {
    const res = await fetch(`/api/dealers/${id}`, {
      method: 'PUT',
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
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txn)
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Transaction error:', err);
      return { success: false, serial: 'REC-0000' };
    }
  },

  async getTransactions() {
    const res = await fetch('/api/transactions');
    return await res.json();
  },

  async getTransaction(id) {
    const res = await fetch(`/api/transactions/${id}`);
    return await res.json();
  },

  async searchTransaction(serial) {
    const res = await fetch(
      `/api/transactions/search/${serial}`
    );
    return await res.json();
  },

  async updateTransaction(id, data) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async deleteTransaction(id) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE'
    });
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
  },

  async getMonthlySummary() {
    const res = await fetch('/api/monthly-summary');
    return await res.json();
  },

  // ── Alias Functions ──
  async getAllTransactions() {
    return this.getTransactions();
  },

  async getAllDealers() {
    return this.getDealers();
  },
  // ── Expenditures ──
  async getExpenditures() {
    const res = await fetch('/api/expenditures');
    return await res.json();
  },

  async addExpenditure(exp) {
    const res = await fetch('/api/expenditures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exp)
    });
    return await res.json();
  },

  async deleteExpenditure(id) {
    const res = await fetch(`/api/expenditures/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  async getExpendituresByDate(date) {
    const res = await fetch(`/api/expenditures/date/${date}`);
    return await res.json();
  },

  async getMonthlyExpenditures() {
    const res = await fetch('/api/monthly-expenditures');
    return await res.json();
  }
};
 