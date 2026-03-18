 // ========================================
// SINDH ICE FACTORY - Reports Logic
// ========================================

let currentFilter = 'all';
let selectedDate = '';

// ── Page Load ──
window.onload = async function () {
  setToday();
};

// ── Aaj Ki Date Set ──
function setToday() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  document.getElementById('filterDate').value = today;
  selectedDate = today;
  loadReport();
}

// ── Report Load ──
async function loadReport() {
  selectedDate = document.getElementById('filterDate').value;
  if (!selectedDate) return;

  const txns = await DB.getTransactionsByDate(selectedDate);

  // Stats calculate
  const cashSales = txns
    .filter(t => t.type === 'Cash')
    .reduce((sum, t) => sum + (t.total || 0), 0);

  const creditSales = txns
    .filter(t => t.type === 'Credit')
    .reduce((sum, t) => sum + (t.total || 0), 0);

  const totalIce = txns
    .filter(t => t.type === 'Credit' || t.type === 'Cash')
    .reduce((sum, t) => sum + (t.qty || 0), 0);

  const totalEarnings = cashSales + creditSales;

  document.getElementById('statCash').textContent =
    'PKR ' + cashSales.toLocaleString();
  document.getElementById('statCredit').textContent =
    'PKR ' + creditSales.toLocaleString();
  document.getElementById('statIce').textContent =
    totalIce + ' blocks';
  document.getElementById('statTotal').textContent =
    'PKR ' + totalEarnings.toLocaleString();

  renderTable(txns);
}

// ── Filter Set ──
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

// ── Table Render ──
function renderTable(txns) {
  const container = document.getElementById('reportTable');

  let filtered = txns;
  if (currentFilter !== 'all') {
    filtered = txns.filter(t => t.type === currentFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;
        padding:2rem; color:#aaa;">
        <div style="font-size:36px;">📋</div>
        <p style="margin-top:10px;">
          Is date mein koi transaction nahi
        </p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <table class="txn-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Dealer</th>
          <th>Type</th>
          <th>Qty</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(t => {
          const time = new Date(t.date).toLocaleTimeString(
            'en-PK', {
              hour: '2-digit',
              minute: '2-digit'
            }
          );

          let typeBadge = '';
          if (t.type === 'Credit') {
            typeBadge =
              '<span class="badge badge-blue">Credit</span>';
          } else if (t.type === 'Cash') {
            typeBadge =
              '<span class="badge badge-green">Cash</span>';
          } else if (t.type === 'Payment') {
            typeBadge =
              '<span class="badge badge-orange">Payment</span>';
          }

          const amountClass = t.type === 'Payment'
            ? 'text-green' : 'text-red';

          return `
            <tr>
              <td style="font-size:13px;">${time}</td>
              <td style="font-weight:600;">
                ${t.dealer_name || 'Cash'}
              </td>
              <td>${typeBadge}</td>
              <td>${t.qty ? t.qty + ' blk' : '—'}</td>
              <td class="${amountClass}"
                style="font-weight:600;">
                PKR ${(t.total || 0).toLocaleString()}
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}