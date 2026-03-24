// ========================================
// SINDH ICE FACTORY - Stats Logic
// ========================================

window.onload = async function () {
  await loadAllStats();
};

async function loadAllStats() {
  const dealers = await DB.getDealers();
  const txns = await fetch('/api/transactions').then(r => r.json());
  const exps = await fetch('/api/expenditures').then(r => r.json());

  // ── Overall Stats ──
  const totalIce = txns
    .filter(t => t.type === 'Credit' || t.type === 'Cash')
    .reduce((sum, t) => sum + (t.qty || 0), 0);
  const totalRevenue = txns
    .filter(t => t.type === 'Credit' || t.type === 'Cash')
    .reduce((sum, t) => sum + (t.total || 0), 0);
  const totalCredit = txns
    .filter(t => t.type === 'Credit')
    .reduce((sum, t) => sum + (t.total || 0), 0);
  const totalCash = txns
    .filter(t => t.type === 'Cash')
    .reduce((sum, t) => sum + (t.total || 0), 0);
  const totalPayments = txns
    .filter(t => t.type === 'Payment')
    .reduce((sum, t) => sum + (t.total || 0), 0);
  const totalExp = exps
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalBalances = dealers
    .reduce((sum, d) => sum + (d.balance || 0), 0);
  const netBalance = totalCash + totalPayments - totalExp;

  document.getElementById('totalDealers').textContent = dealers.length;
  document.getElementById('totalReceipts').textContent = txns.filter(t => t.type !== 'Payment').length;
  document.getElementById('totalIce').textContent = totalIce.toLocaleString() + ' blocks';
  document.getElementById('totalRevenue').textContent = 'PKR ' + totalRevenue.toLocaleString();
  document.getElementById('totalCredit').textContent = 'PKR ' + totalCredit.toLocaleString();
  document.getElementById('totalCash').textContent = 'PKR ' + totalCash.toLocaleString();
  document.getElementById('totalPayments').textContent = 'PKR ' + totalPayments.toLocaleString();
  document.getElementById('totalExp').textContent = 'PKR ' + totalExp.toLocaleString();
  document.getElementById('totalBalances').textContent = 'PKR ' + totalBalances.toLocaleString();
  document.getElementById('netBalance').textContent = 'PKR ' + netBalance.toLocaleString();

  // ── Dealer Wise Stats ──
  renderDealerStats(dealers, txns);

  // ── Monthly Stats ──
  renderMonthlyStats(txns, exps);
}

function renderDealerStats(dealers, txns) {
  const container = document.getElementById('dealerStats');

  if (dealers.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:2rem; color:#aaa;">Koi dealer nahi</div>';
    return;
  }

  container.innerHTML = `
    <table class="txn-table">
      <thead>
        <tr>
          <th>Dealer</th>
          <th>Ice Kharida</th>
          <th>Total Credit</th>
          <th>Total Paid</th>
          <th>Baqi Balance</th>
        </tr>
      </thead>
      <tbody>
        ${dealers.map(d => {
          const dealerTxns = txns.filter(t => t.dealer_id === d.id);
          const ice = dealerTxns
            .filter(t => t.type === 'Credit' || t.type === 'Cash')
            .reduce((sum, t) => sum + (t.qty || 0), 0);
          const credit = dealerTxns
            .filter(t => t.type === 'Credit')
            .reduce((sum, t) => sum + (t.total || 0), 0);
          const paid = dealerTxns
            .filter(t => t.type === 'Payment')
            .reduce((sum, t) => sum + (t.total || 0), 0);
          const balance = d.balance || 0;
          const balClass = balance > 0 ? 'text-red' : 'text-green';
          const balText = balance > 0
            ? 'PKR ' + balance.toLocaleString()
            : 'Clear ✅';
          return `
            <tr>
              <td style="font-weight:600;">${d.name}</td>
              <td class="text-blue">${ice.toLocaleString()} blk</td>
              <td class="text-red">PKR ${credit.toLocaleString()}</td>
              <td class="text-green">PKR ${paid.toLocaleString()}</td>
              <td class="${balClass}" style="font-weight:700;">${balText}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function renderMonthlyStats(txns, exps) {
  const container = document.getElementById('monthlyStats');

  // Group by month
  const months = {};
  txns.forEach(t => {
    const month = t.date ? t.date.slice(0, 7) : 'Unknown';
    if (!months[month]) {
      months[month] = { cash: 0, credit: 0, payments: 0, ice: 0, exp: 0 };
    }
    if (t.type === 'Cash') {
      months[month].cash += t.total || 0;
      months[month].ice += t.qty || 0;
    } else if (t.type === 'Credit') {
      months[month].credit += t.total || 0;
      months[month].ice += t.qty || 0;
    } else if (t.type === 'Payment') {
      months[month].payments += t.total || 0;
    }
  });

  exps.forEach(e => {
    const month = e.date ? e.date.slice(0, 7) : 'Unknown';
    if (!months[month]) {
      months[month] = { cash: 0, credit: 0, payments: 0, ice: 0, exp: 0 };
    }
    months[month].exp += e.amount || 0;
  });

  const sortedMonths = Object.keys(months).sort().reverse();

  if (sortedMonths.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:2rem; color:#aaa;">Koi data nahi</div>';
    return;
  }

  container.innerHTML = `
    <table class="txn-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Cash</th>
          <th>Credit</th>
          <th>Payments</th>
          <th>Expenditures</th>
          <th>Ice Sold</th>
          <th>Net</th>
        </tr>
      </thead>
      <tbody>
        ${sortedMonths.map(month => {
          const m = months[month];
          const monthName = new Date(month + '-01')
            .toLocaleDateString('en-PK', {
              month: 'long', year: 'numeric'
            });
          const net = m.cash + m.payments - m.exp;
          return `
            <tr>
              <td style="font-weight:600;">${monthName}</td>
              <td class="text-green">PKR ${m.cash.toLocaleString()}</td>
              <td class="text-red">PKR ${m.credit.toLocaleString()}</td>
              <td class="text-blue">PKR ${m.payments.toLocaleString()}</td>
              <td class="text-red">PKR ${m.exp.toLocaleString()}</td>
              <td>${m.ice.toLocaleString()} blk</td>
              <td style="font-weight:700; color:#1565C0;">
                PKR ${net.toLocaleString()}
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}