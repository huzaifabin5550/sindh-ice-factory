 let currentFilter = 'all';
let selectedDate = '';

window.onload = async function () {
  setToday();
  await loadMonthlySummary();
};

function setToday() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  document.getElementById('filterDate').value = today;
  selectedDate = today;
  loadReport();
}

async function loadReport() {
  selectedDate = document.getElementById('filterDate').value;
  if (!selectedDate) return;

  const txns = await DB.getTransactionsByDate(selectedDate);

  const cashSales = txns
    .filter(t => t.type === 'Cash')
    .reduce((sum, t) => sum + (t.total || 0), 0);
  const creditSales = txns
    .filter(t => t.type === 'Credit')
    .reduce((sum, t) => sum + (t.total || 0), 0);
  const totalIce = txns
    .filter(t => t.type === 'Credit' || t.type === 'Cash')
    .reduce((sum, t) => sum + (t.qty || 0), 0);

  document.getElementById('statCash').textContent =
    'PKR ' + cashSales.toLocaleString();
  document.getElementById('statCredit').textContent =
    'PKR ' + creditSales.toLocaleString();
  document.getElementById('statIce').textContent =
    totalIce + ' blocks';
  document.getElementById('statTotal').textContent =
    'PKR ' + (cashSales + creditSales).toLocaleString();

  renderTable(txns);
}

function setFilter(filter) {
  currentFilter = filter;
  document.getElementById('filterAll').className =
    'toggle-btn' + (filter === 'all' ? ' active-blue' : '');
  document.getElementById('filterCredit').className =
    'toggle-btn' + (filter === 'Credit' ? ' active-blue' : '');
  document.getElementById('filterCash').className =
    'toggle-btn' + (filter === 'Cash' ? ' active-green' : '');
  document.getElementById('filterPayment').className =
    'toggle-btn' + (filter === 'Payment' ? ' active-orange' : '');
  loadReport();
}

function renderTable(txns) {
  const container = document.getElementById('reportTable');
  let filtered = currentFilter === 'all'
    ? txns
    : txns.filter(t => t.type === currentFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:2rem; color:#aaa;">
        <div style="font-size:36px;">📋</div>
        <p style="margin-top:10px;">Koi transaction nahi</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <table class="txn-table">
      <thead>
        <tr>
          <th>Serial #</th>
          <th>Time</th>
          <th>Dealer</th>
          <th>Type</th>
          <th>Qty</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(t => {
          const time = new Date(t.date).toLocaleTimeString('en-PK', {
            hour:'2-digit', minute:'2-digit'
          });
          let typeBadge = '';
          if (t.type === 'Credit')
            typeBadge = '<span class="badge badge-blue">Credit</span>';
          else if (t.type === 'Cash')
            typeBadge = '<span class="badge badge-green">Cash</span>';
          else if (t.type === 'Payment')
            typeBadge = '<span class="badge badge-orange">Payment</span>';

          const amountClass = t.type === 'Payment'
            ? 'text-green' : 'text-red';

          return `
            <tr>
              <td style="font-weight:700; color:#1565C0;">
                ${t.serial_number || '—'}
              </td>
              <td style="font-size:13px;">${time}</td>
              <td style="font-weight:600;">
                ${t.dealer_name || 'Cash'}
              </td>
              <td>${typeBadge}</td>
              <td>${t.qty ? t.qty + ' blk' : '—'}</td>
              <td class="${amountClass}" style="font-weight:600;">
                PKR ${(t.total || 0).toLocaleString()}
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

async function loadMonthlySummary() {
  const summary = await DB.getMonthlySummary();
  const container = document.getElementById('monthlySummary');

  if (!summary || summary.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:2rem; color:#aaa;">
        <p>Abhi koi data nahi hai</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <table class="txn-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Cash Sales</th>
          <th>Credit Sales</th>
          <th>Payments</th>
          <th>Ice Sold</th>
          <th>Total Earnings</th>
        </tr>
      </thead>
      <tbody>
        ${summary.map(s => {
          const monthName = new Date(s.month + '-01')
            .toLocaleDateString('en-PK', {
              month: 'long', year: 'numeric'
            });
          const total = (s.cash || 0) + (s.credit || 0);
          return `
            <tr>
              <td style="font-weight:600;">${monthName}</td>
              <td class="text-green">
                PKR ${(s.cash || 0).toLocaleString()}
              </td>
              <td class="text-red">
                PKR ${(s.credit || 0).toLocaleString()}
              </td>
              <td class="text-blue">
                PKR ${(s.payments || 0).toLocaleString()}
              </td>
              <td>${(s.ice || 0).toLocaleString()} blk</td>
              <td style="font-weight:700; color:#1565C0;">
                PKR ${total.toLocaleString()}
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}
