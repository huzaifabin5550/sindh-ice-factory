 let currentDealer = null;
let allTransactions = [];

window.onload = async function () {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  if (!id) { window.location.href = '/dealers'; return; }
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

function renderDealerInfo() {
  const d = currentDealer;
  const initials = d.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
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

async function renderStats() {
  const txns = await DB.getDealerTransactions(currentDealer.id);
  const totalIce = txns.filter(t => t.type === 'Credit' || t.type === 'Cash').reduce((sum, t) => sum + (t.qty || 0), 0);
  const totalCredit = txns.filter(t => t.type === 'Credit').reduce((sum, t) => sum + (t.total || 0), 0);
  const totalPaid = txns.filter(t => t.type === 'Payment').reduce((sum, t) => sum + (t.total || 0), 0);
  const freshDealer = await DB.getDealer(currentDealer.id);
  const balance = freshDealer.balance || 0;
  document.getElementById('statIce').textContent = totalIce + ' blocks';
  document.getElementById('statCredit').textContent = 'PKR ' + totalCredit.toLocaleString();
  document.getElementById('statPaid').textContent = 'PKR ' + totalPaid.toLocaleString();
  const balEl = document.getElementById('statBalance');
  balEl.textContent = 'PKR ' + balance.toLocaleString();
  balEl.className = balance > 0 ? 's-value text-red' : 's-value text-green';
}

 async function renderHistory() {
  const txns = await DB.getDealerTransactions(currentDealer.id);
  allTransactions = txns;
  renderHistoryData(txns);
}

function renderHistoryData(txns) {
  const container = document.getElementById('txnHistory');
  if (txns.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:2rem; color:#aaa;"><p>Abhi koi transaction nahi hai</p></div>';
    return;
  }
  container.innerHTML = `
    <table class="txn-table">
      <thead>
        <tr>
          <th>Serial #</th>
          <th>Date</th>
          <th>Type</th>
          <th>Qty</th>
          <th>Amount</th>
          <th>Ref</th>
        </tr>
      </thead>
      <tbody>
        ${txns.map(t => {
          const date = new Date(t.date).toLocaleDateString('en-PK', {day:'2-digit', month:'short', year:'numeric'});
          const time = new Date(t.date).toLocaleTimeString('en-PK', {hour:'2-digit', minute:'2-digit'});
          let typeBadge = '';
          if (t.type === 'Credit') typeBadge = '<span class="badge badge-blue">Credit</span>';
          else if (t.type === 'Cash') typeBadge = '<span class="badge badge-green">Cash</span>';
          else if (t.type === 'Payment') typeBadge = '<span class="badge badge-orange">Payment</span>';
          const amountClass = t.type === 'Payment' ? 'text-green' : 'text-red';
          return `
            <tr>
              <td style="font-weight:700; color:#1565C0;">${t.serial_number || '—'}</td>
              <td>${date}<br><span style="font-size:11px; color:#aaa;">${time}</span></td>
              <td>${typeBadge}</td>
              <td>${t.qty ? t.qty + ' blk' : '—'}</td>
              <td class="${amountClass}" style="font-weight:600;">PKR ${(t.total || 0).toLocaleString()}</td>
              <td style="color:#888; font-size:13px;">${t.reference || '—'}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

async function openPayDebt() {
  const freshDealer = await DB.getDealer(currentDealer.id);
  const balance = freshDealer.balance || 0;
  if (balance <= 0) { alert('✅ Is dealer ka koi qarz nahi hai!'); return; }
  document.getElementById('modalDebt').textContent = 'PKR ' + balance.toLocaleString();
  document.getElementById('payAmount').value = '';
  document.getElementById('payReference').value = '';
  document.getElementById('payDebtModal').classList.remove('hidden');
}

function closePayDebt() {
  document.getElementById('payDebtModal').classList.add('hidden');
}

async function submitPayment() {
  const amount = parseFloat(document.getElementById('payAmount').value);
  const reference = document.getElementById('payReference').value;
  const freshDealer = await DB.getDealer(currentDealer.id);
  const balance = freshDealer.balance || 0;
  if (!amount || amount <= 0) { alert('❌ Amount dalein!'); return; }
  if (amount > balance) { alert('❌ Amount baqi se zyada hai! Baqi: PKR ' + balance.toLocaleString()); return; }

  // Pakistan timezone date
  const now = new Date();
  const pkDate = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 19);

  const result = await DB.addTransaction({
    dealerId: currentDealer.id,
    dealerName: currentDealer.name,
    type: 'Payment',
    qty: 0,
    price: 0,
    total: amount,
    reference: reference || 'Payment',
    date: pkDate
  });

  closePayDebt();
  currentDealer = await DB.getDealer(currentDealer.id);
  await renderStats();
  await renderHistory();
  showPaymentReceipt(result.serial || '—', currentDealer.name, amount, reference || 'Payment');
}

function showPaymentReceipt(serial, name, amount, reference) {
  const now = new Date().toLocaleString('en-PK', {dateStyle:'medium', timeStyle:'short'});
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html><head><title>Payment Receipt</title></head>
    <body style="font-family:Arial; max-width:400px; margin:0 auto; padding:20px;">
      <div style="text-align:center; border-bottom:1px dashed #ccc; padding-bottom:12px; margin-bottom:12px;">
        <div style="font-size:22px; font-weight:bold; color:#1565C0;">🧊 Sindh Ice Factory</div>
        <div style="font-size:12px; color:#888;">Payment Receipt</div>
        <div style="font-size:12px; color:#aaa;">${now}</div>
      </div>
      <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #eee;">
        <span style="color:#777;">Serial No.</span>
        <span style="font-weight:700; color:#1565C0;">${serial}</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #eee;">
        <span style="color:#777;">Dealer</span>
        <span style="font-weight:600;">${name}</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #eee;">
        <span style="color:#777;">Reference</span>
        <span style="font-weight:600;">${reference}</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:10px 0 0; font-size:18px; font-weight:bold; color:#2E7D32;">
        <span>Amount Paid</span>
        <span>PKR ${amount.toLocaleString()}</span>
      </div>
      <div style="text-align:center; color:#aaa; font-size:12px; margin-top:16px; border-top:1px dashed #ccc; padding-top:10px;">
        Shukriya! Dobara tashreef lain. 🙏
      </div>
      <div style="text-align:center; margin-top:20px;">
        <button onclick="window.print()" style="background:#1565C0; color:white; border:none; padding:10px 24px; border-radius:8px; font-size:15px; cursor:pointer;">🖨️ Print</button>
        <button onclick="window.close()" style="background:#eee; color:#333; border:none; padding:10px 24px; border-radius:8px; font-size:15px; cursor:pointer; margin-left:10px;">✖ Band</button>
      </div>
    </body></html>
  `);
  printWindow.document.close();
}

async function deleteDealer() {
  if (!confirm('⚠️ Kya aap sure hain? ' + currentDealer.name + ' delete ho jayega!')) return;
  await DB.deleteDealer(currentDealer.id);
  window.location.href = '/dealers';
}
// ── Date Filter ──
function filterHistory() {
  const date = document.getElementById('historyDate').value;
  if (!date) {
    renderHistoryData(allTransactions);
    return;
  }
  const filtered = allTransactions.filter(t =>
    t.date && t.date.startsWith(date)
  );
  renderHistoryData(filtered);
}

function clearFilter() {
  document.getElementById('historyDate').value = '';
  renderHistoryData(allTransactions);
}
 