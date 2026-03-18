 // ========================================
// SINDH ICE FACTORY - Dealer Detail Logic
// ========================================

let currentDealer = null;

// ── Page Load ──
window.onload = async function () {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));

  if (!id) {
    window.location.href = '/dealers';
    return;
  }

  currentDealer = await DB.getDealer(id);

  if (!currentDealer || currentDealer.error) {
    alert('Dealer nahi mila!');
    window.location.href = '/dealers';
    return;
  }

  renderDealerInfo();
  await renderStats();
  await renderHistory();
};

// ── Dealer Info ──
function renderDealerInfo() {
  const d = currentDealer;

  const initials = d.name.split(' ')
    .map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('dealerAvatar').textContent = initials;
  document.getElementById('dealerNameTitle').textContent = d.name;

  const locBadge = d.location === 'Remote'
    ? '<span class="badge badge-purple">Remote</span>'
    : '<span class="badge badge-green">Mobile</span>';

  document.getElementById('dealerMeta').innerHTML = `
    ${d.phone ? '📞 ' + d.phone + ' &nbsp;' : ''}
    ${d.cnic ? '🪪 ' + d.cnic + ' &nbsp;' : ''}
    ${locBadge}
    ${d.address ? '<br>📍 ' + d.address : ''}
  `;
}

// ── Stats ──
async function renderStats() {
  const txns = await DB.getDealerTransactions(currentDealer.id);

  const totalIce = txns
    .filter(t => t.type === 'Credit' || t.type === 'Cash')
    .reduce((sum, t) => sum + (t.qty || 0), 0);

  const totalCredit = txns
    .filter(t => t.type === 'Credit')
    .reduce((sum, t) => sum + (t.total || 0), 0);

  const totalPaid = txns
    .filter(t => t.type === 'Payment')
    .reduce((sum, t) => sum + (t.total || 0), 0);

  // Fresh dealer data lo balance ke liye
  const freshDealer = await DB.getDealer(currentDealer.id);
  const balance = freshDealer.balance || 0;

  document.getElementById('statIce').textContent =
    totalIce + ' blocks';
  document.getElementById('statCredit').textContent =
    'PKR ' + totalCredit.toLocaleString();
  document.getElementById('statPaid').textContent =
    'PKR ' + totalPaid.toLocaleString();

  const balEl = document.getElementById('statBalance');
  balEl.textContent = 'PKR ' + balance.toLocaleString();
  balEl.className = balance > 0
    ? 's-value text-red'
    : 's-value text-green';
}

// ── Transaction History ──
async function renderHistory() {
  const txns = await DB.getDealerTransactions(currentDealer.id);
  const container = document.getElementById('txnHistory');

  if (txns.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:2rem; color:#aaa;">
        <p>Abhi koi transaction nahi hai</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <table class="txn-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Qty</th>
          <th>Amount</th>
          <th>Reference</th>
        </tr>
      </thead>
      <tbody>
        ${txns.map(t => {
          const date = new Date(t.date).toLocaleDateString(
            'en-PK', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }
          );
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
              <td>
                ${date}<br>
                <span style="font-size:11px; color:#aaa;">
                  ${time}
                </span>
              </td>
              <td>${typeBadge}</td>
              <td>${t.qty ? t.qty + ' blk' : '—'}</td>
              <td class="${amountClass}"
                style="font-weight:600;">
                PKR ${(t.total || 0).toLocaleString()}
              </td>
              <td style="color:#888; font-size:13px;">
                ${t.reference || '—'}
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ── Pay Debt Open ──
async function openPayDebt() {
  const freshDealer = await DB.getDealer(currentDealer.id);
  const balance = freshDealer.balance || 0;

  if (balance <= 0) {
    alert('✅ Is dealer ka koi qarz nahi hai!');
    return;
  }

  document.getElementById('modalDebt').textContent =
    'PKR ' + balance.toLocaleString();
  document.getElementById('payAmount').value = '';
  document.getElementById('payReference').value = '';
  document.getElementById('payDebtModal')
    .classList.remove('hidden');
}

// ── Pay Debt Close ──
function closePayDebt() {
  document.getElementById('payDebtModal')
    .classList.add('hidden');
}

// ── Submit Payment ──
async function submitPayment() {
  const amount = parseFloat(
    document.getElementById('payAmount').value
  );
  const reference = document.getElementById('payReference').value;

  const freshDealer = await DB.getDealer(currentDealer.id);
  const balance = freshDealer.balance || 0;

  if (!amount || amount <= 0) {
    alert('❌ Amount dalein!');
    return;
  }

  if (amount > balance) {
    alert('❌ Amount baqi se zyada hai! Baqi: PKR ' +
      balance.toLocaleString());
    return;
  }

  await DB.addTransaction({
    dealerId: currentDealer.id,
    dealerName: currentDealer.name,
    type: 'Payment',
    qty: 0,
    price: 0,
    total: amount,
    reference: reference || 'Payment',
    date: new Date().toISOString()
  });

  closePayDebt();
  await renderStats();
  await renderHistory();

  alert('✅ Payment save ho gayi! PKR ' +
    amount.toLocaleString());
}

// ── Delete Dealer ──
async function deleteDealer() {
  if (!confirm('⚠️ Kya aap sure hain? ' +
    currentDealer.name + ' delete ho jayega!')) return;

  await DB.deleteDealer(currentDealer.id);
  window.location.href = '/dealers';
}