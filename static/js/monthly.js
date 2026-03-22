window.onload = function () {
  setThisMonth();
};

function setThisMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  document.getElementById('monthPicker').value = y + '-' + m;
  loadMonthly();
}

async function loadMonthly() {
  const val = document.getElementById('monthPicker').value;
  if (!val) return;

  const [year, month] = val.split('-');
  const monthName = new Date(year, month - 1, 1)
    .toLocaleString('en-PK', { month: 'long', year: 'numeric' });

  document.getElementById('tableTitle').textContent = '📋 ' + monthName + ' — Daily Breakdown';

  const allTxns = await DB.getAllTransactions();
  const allExps = await DB.getAllExpenditures();

  // Filter by selected month
  const txns = allTxns.filter(t => t.date && t.date.startsWith(val));
  const exps = allExps.filter(e => e.date && e.date.startsWith(val));

  // Get all days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const rows = [];

  let totCash = 0, totCredit = 0, totIce = 0,
      totEarnings = 0, totExpense = 0, totPayments = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = year + '-' + month + '-' + String(d).padStart(2, '0');

    const dayTxns = txns.filter(t => t.date && t.date.startsWith(dateStr));
    const dayExps = exps.filter(e => e.date && e.date.startsWith(dateStr));

    const cash = dayTxns.filter(t => t.type === 'Cash').reduce((s, t) => s + (t.total || 0), 0);
    const credit = dayTxns.filter(t => t.type === 'Credit').reduce((s, t) => s + (t.total || 0), 0);
    const ice = dayTxns.filter(t => t.type === 'Cash' || t.type === 'Credit').reduce((s, t) => s + (t.qty || 0), 0);
    const payments = dayTxns.filter(t => t.type === 'Payment').reduce((s, t) => s + (t.total || 0), 0);
    const expense = dayExps.reduce((s, e) => s + (e.amount || 0), 0);
    const earnings = cash + credit;
    const net = cash + payments - expense;

    // Skip empty days
    if (earnings === 0 && expense === 0 && payments === 0) continue;

    totCash += cash;
    totCredit += credit;
    totIce += ice;
    totEarnings += earnings;
    totExpense += expense;
    totPayments += payments;

    rows.push({ dateStr, cash, credit, ice, earnings, expense, payments, net });
  }

  const totNet = totCash + totPayments - totExpense;

  // Update summary cards
  document.getElementById('mCash').textContent = 'PKR ' + totCash.toLocaleString();
  document.getElementById('mCredit').textContent = 'PKR ' + totCredit.toLocaleString();
  document.getElementById('mIce').textContent = totIce + ' blocks';
  document.getElementById('mEarnings').textContent = 'PKR ' + totEarnings.toLocaleString();
  document.getElementById('mExpense').textContent = 'PKR ' + totExpense.toLocaleString();
  document.getElementById('mPayments').textContent = 'PKR ' + totPayments.toLocaleString();
  document.getElementById('mNet').textContent = 'PKR ' + totNet.toLocaleString();

  // Render table
  const container = document.getElementById('monthlyTable');
  if (rows.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#aaa;">Is mahine koi data nahi</div>';
    return;
  }

  container.innerHTML = `
    <div style="overflow-x:auto;">
    <table class="txn-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Cash Sale</th>
          <th>Credit Sale</th>
          <th>Ice Sold</th>
          <th>Total Earnings</th>
          <th>Expense</th>
          <th>Payments</th>
          <th>Net Balance</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => {
          const d = new Date(r.dateStr).toLocaleDateString('en-PK', {day:'2-digit', month:'short', year:'numeric'});
          return `<tr>
            <td style="font-weight:600;">${d}</td>
            <td class="text-green">PKR ${r.cash.toLocaleString()}</td>
            <td class="text-red">PKR ${r.credit.toLocaleString()}</td>
            <td class="text-blue">${r.ice} blk</td>
            <td style="font-weight:600;">PKR ${r.earnings.toLocaleString()}</td>
            <td class="text-red">PKR ${r.expense.toLocaleString()}</td>
            <td class="text-green">PKR ${r.payments.toLocaleString()}</td>
            <td style="font-weight:700; color:#1565C0;">PKR ${r.net.toLocaleString()}</td>
          </tr>`;
        }).join('')}
      </tbody>
      <tfoot>
        <tr style="background:#E3F2FD; font-weight:700;">
          <td>TOTAL</td>
          <td class="text-green">PKR ${totCash.toLocaleString()}</td>
          <td class="text-red">PKR ${totCredit.toLocaleString()}</td>
          <td class="text-blue">${totIce} blk</td>
          <td>PKR ${totEarnings.toLocaleString()}</td>
          <td class="text-red">PKR ${totExpense.toLocaleString()}</td>
          <td class="text-green">PKR ${totPayments.toLocaleString()}</td>
          <td style="color:#1565C0;">PKR ${totNet.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
    </div>`;
}