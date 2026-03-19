 let currentFilter = 'all';
let selectedDate = '';

window.onload = async function () {
  setToday();
  await loadMonthlySummary();
};

function setToday() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const today = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate());
  document.getElementById('filterDate').value = today;
  selectedDate = today;
  loadReport();
}

async function loadReport() {
  selectedDate = document.getElementById('filterDate').value;
  if (!selectedDate) return;
  const txns = await DB.getTransactionsByDate(selectedDate);
  const exps = await fetch('/api/expenditures/date/' + selectedDate).then(r => r.json());
  const totalExp = exps.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPayments = txns.filter(t => t.type === 'Payment').reduce((sum, t) => sum + (t.total || 0), 0);
  const cashSales = txns.filter(t => t.type === 'Cash').reduce((sum, t) => sum + (t.total || 0), 0);
  const creditSales = txns.filter(t => t.type === 'Credit').reduce((sum, t) => sum + (t.total || 0), 0);
  const totalIce = txns.filter(t => t.type === 'Credit' || t.type === 'Cash').reduce((sum, t) => sum + (t.qty || 0), 0);
  const totalEarnings = cashSales + creditSales;
  const netBalance = cashSales + totalPayments - totalExp;
  document.getElementById('statCash').textContent = 'PKR ' + cashSales.toLocaleString();
  document.getElementById('statCredit').textContent = 'PKR ' + creditSales.toLocaleString();
  document.getElementById('statIce').textContent = totalIce + ' blocks';
  document.getElementById('statTotal').textContent = 'PKR ' + totalEarnings.toLocaleString();
  document.getElementById('statExp').textContent = 'PKR ' + totalExp.toLocaleString();
  document.getElementById('statPayments').textContent = 'PKR ' + totalPayments.toLocaleString();
  document.getElementById('statNet').textContent = 'PKR ' + netBalance.toLocaleString();
  renderTable(txns);
}

function setFilter(filter) {
  currentFilter = filter;
  document.getElementById('filterAll').className = 'toggle-btn' + (filter === 'all' ? ' active-blue' : '');
  document.getElementById('filterCredit').className = 'toggle-btn' + (filter === 'Credit' ? ' active-blue' : '');
  document.getElementById('filterCash').className = 'toggle-btn' + (filter === 'Cash' ? ' active-green' : '');
  document.getElementById('filterPayment').className = 'toggle-btn' + (filter === 'Payment' ? ' active-orange' : '');
  loadReport();
}

function renderTable(txns) {
  const container = document.getElementById('reportTable');
  let filtered = currentFilter === 'all' ? txns : txns.filter(t => t.type === currentFilter);
  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:2rem; color:#aaa;"><div style="font-size:36px;">📋</div><p style="margin-top:10px;">Koi transaction nahi</p></div>';
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
          const time = new Date(t.date).toLocaleTimeString('en-PK', {hour:'2-digit', minute:'2-digit'});
          let typeBadge = '';
          if (t.type === 'Credit') typeBadge = '<span class="badge badge-blue">Credit</span>';
          else if (t.type === 'Cash') typeBadge = '<span class="badge badge-green">Cash</span>';
          else if (t.type === 'Payment') typeBadge = '<span class="badge badge-orange">Payment</span>';
          const amountClass = t.type === 'Payment' ? 'text-green' : 'text-red';
          return `
            <tr>
              <td style="font-weight:700; color:#1565C0;">${t.serial_number || '—'}</td>
              <td style="font-size:13px;">${time}</td>
              <td style="font-weight:600;">${t.dealer_name || 'Cash'}</td>
              <td>${typeBadge}</td>
              <td>${t.qty ? t.qty + ' blk' : '—'}</td>
              <td class="${amountClass}" style="font-weight:600;">PKR ${(t.total || 0).toLocaleString()}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

async function loadMonthlySummary() {
  const summary = await DB.getMonthlySummary();
  const container = document.getElementById('monthlySummary');
  if (!summary || summary.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:2rem; color:#aaa;"><p>Abhi koi data nahi</p></div>';
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
          <th>Ice Sold</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${summary.map(s => {
          const monthName = new Date(s.month + '-01').toLocaleDateString('en-PK', {month:'long', year:'numeric'});
          const total = (s.cash || 0) + (s.credit || 0);
          return `
            <tr>
              <td style="font-weight:600;">${monthName}</td>
              <td class="text-green">PKR ${(s.cash || 0).toLocaleString()}</td>
              <td class="text-red">PKR ${(s.credit || 0).toLocaleString()}</td>
              <td class="text-blue">PKR ${(s.payments || 0).toLocaleString()}</td>
              <td>${(s.ice || 0).toLocaleString()} blk</td>
              <td style="font-weight:700; color:#1565C0;">PKR ${total.toLocaleString()}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function handleSearchEnter(e) {
  if (e.key === 'Enter') searchReceipt();
}

async function searchReceipt() {
  const serial = document.getElementById('searchSerial').value.trim().toUpperCase();
  if (!serial) { alert('❌ Serial number dalein! e.g. REC-0001'); return; }
  const container = document.getElementById('searchResult');
  container.innerHTML = '<p style="color:#888;">Dhundh raha hoon...</p>';
  const txn = await DB.searchTransaction(serial);
  if (txn.error) {
    container.innerHTML = '<div style="background:#FFEBEE; border:1px solid #EF9A9A; border-radius:8px; padding:12px; color:#C62828;">❌ "' + serial + '" ki koi receipt nahi mili!</div>';
    return;
  }
  const date = new Date(txn.date).toLocaleString('en-PK', {dateStyle:'medium', timeStyle:'short'});
  let typeBadge = '';
  if (txn.type === 'Credit') typeBadge = '<span class="badge badge-blue">Credit</span>';
  else if (txn.type === 'Cash') typeBadge = '<span class="badge badge-green">Cash</span>';
  else if (txn.type === 'Payment') typeBadge = '<span class="badge badge-orange">Payment</span>';
  container.innerHTML = `
    <div style="background:#E3F2FD; border:1px solid #90CAF9; border-radius:10px; padding:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span style="font-size:16px; font-weight:700; color:#1565C0;">${txn.serial_number}</span>
        ${typeBadge}
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13px;">
        <div><span style="color:#888;">Dealer:</span> <strong>${txn.dealer_name || 'Cash'}</strong></div>
        <div><span style="color:#888;">Date:</span> <strong>${date}</strong></div>
        <div><span style="color:#888;">Quantity:</span> <strong>${txn.qty ? txn.qty + ' blocks' : '—'}</strong></div>
        <div><span style="color:#888;">Price/Block:</span> <strong>${txn.price ? 'PKR ' + txn.price.toLocaleString() : '—'}</strong></div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:10px; border-top:1px solid #90CAF9;">
        <span style="font-size:18px; font-weight:700; color:#0D47A1;">Total: PKR ${(txn.total || 0).toLocaleString()}</span>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-primary" style="width:auto; padding:8px 14px; font-size:13px;" onclick='printSearchReceipt(${JSON.stringify(txn).replace(/'/g, "&#39;")})'>🖨️ Print</button>
          <button class="btn btn-secondary" style="width:auto; padding:8px 14px; font-size:13px;" onclick="openEditReceipt(${txn.id})">✏️ Edit</button>
          <button class="btn btn-danger" style="width:auto; padding:8px 14px; font-size:13px;" onclick="deleteSearchReceipt(${txn.id}, '${txn.serial_number}')">🗑 Delete</button>
        </div>
      </div>
    </div>`;
}

function printSearchReceipt(txn) {
  const date = new Date(txn.date).toLocaleString('en-PK', {dateStyle:'medium', timeStyle:'short'});
  var w = window.open('', '_blank');
  var html = '<!DOCTYPE html><html><head><title>Receipt ' + txn.serial_number + '</title><style>';
  html += 'body{font-family:Arial;padding:20px;max-width:400px;margin:0 auto}';
  html += '.receipt-company{font-size:22px;font-weight:bold;color:#1565C0;text-align:center}';
  html += '.receipt-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:14px}';
  html += '.receipt-total{display:flex;justify-content:space-between;font-size:18px;font-weight:bold;color:#1565C0;padding-top:10px}';
  html += '.r-label{color:#777}.r-value{font-weight:600}';
  html += '.badge-blue{background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:4px;font-size:12px}';
  html += '.badge-green{background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:4px;font-size:12px}';
  html += '.badge-orange{background:#FFF8E1;color:#E65100;padding:2px 8px;border-radius:4px;font-size:12px}';
  html += '.footer{text-align:center;color:#aaa;font-size:12px;margin-top:16px;border-top:1px dashed #ccc;padding-top:10px}';
  html += '</style></head><body>';
  html += '<div class="receipt-company">🧊 Sindh Ice Factory</div>';
  html += '<p style="text-align:center;color:#888;font-size:12px;margin:4px 0">' + date + '</p>';
  html += '<hr style="border:1px dashed #ccc;margin:10px 0">';
  html += '<div class="receipt-row"><span class="r-label">Serial No.</span><span class="r-value" style="color:#1565C0;font-weight:700">' + txn.serial_number + '</span></div>';
  html += '<div class="receipt-row"><span class="r-label">Dealer</span><span class="r-value">' + (txn.dealer_name || 'Cash') + '</span></div>';
  html += '<div class="receipt-row"><span class="r-label">Type</span><span class="r-value">' + txn.type + '</span></div>';
  if (txn.qty) html += '<div class="receipt-row"><span class="r-label">Quantity</span><span class="r-value" style="font-size:18px;font-weight:700;color:#1565C0">' + txn.qty + ' blocks</span></div>';
  if (txn.price) html += '<div class="receipt-row"><span class="r-label">Price/Block</span><span class="r-value">PKR ' + (txn.price || 0).toLocaleString() + '</span></div>';
  if (txn.reference) html += '<div class="receipt-row"><span class="r-label">Reference</span><span class="r-value">' + txn.reference + '</span></div>';
  html += '<div class="receipt-total"><span>Total</span><span>PKR ' + (txn.total || 0).toLocaleString() + '</span></div>';
  html += '<div class="footer">Shukriya! Dobara tashreef lain.</div>';
  html += '</body></html>';
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  w.onafterprint = function() { w.close(); };
}

async function deleteSearchReceipt(id, serial) {
  if (!confirm('⚠️ Kya aap sure hain?\n' + serial + ' delete ho jayegi!')) return;
  await DB.deleteTransaction(id);
  document.getElementById('searchResult').innerHTML = '<div style="background:#E8F5E9; border:1px solid #A5D6A7; border-radius:8px; padding:12px; color:#2E7D32;">✅ Receipt delete ho gayi!</div>';
  document.getElementById('searchSerial').value = '';
}

async function openEditReceipt(id) {
  const txn = await DB.getTransaction(id);
  if (!txn || txn.error) { alert('❌ Receipt nahi mili!'); return; }
  const container = document.getElementById('searchResult');
  container.innerHTML += `
    <div style="background:white; border:1px solid #E3EAF3; border-radius:10px; padding:14px; margin-top:12px;">
      <div style="font-size:15px; font-weight:600; margin-bottom:12px; color:#1565C0;">✏️ Receipt Edit — ${txn.serial_number}</div>
      <div class="grid-2" style="gap:12px;">
        <div class="field-group">
          <label class="field-label">Quantity</label>
          <input type="number" id="editQty" value="${txn.qty || 0}" min="0" oninput="calcEditTotal()" />
        </div>
        <div class="field-group">
          <label class="field-label">Price/Block</label>
          <input type="number" id="editPrice" value="${txn.price || 0}" min="0" oninput="calcEditTotal()" />
        </div>
      </div>
      <div class="field-group" style="margin-top:8px;">
        <label class="field-label">Reference</label>
        <input type="text" id="editReference" value="${txn.reference || ''}" />
      </div>
      <div class="total-box" style="margin:12px 0;">
        <span class="label">Total</span>
        <span class="amount" id="editTotal">PKR ${(txn.total || 0).toLocaleString()}</span>
      </div>
      <div class="grid-2" style="gap:8px;">
        <button class="btn btn-primary" onclick="saveEditReceipt(${id})">✅ Save</button>
        <button class="btn btn-secondary" onclick="searchReceipt()" style="width:100%;">✖ Cancel</button>
      </div>
    </div>`;
}

function calcEditTotal() {
  const qty = parseFloat(document.getElementById('editQty').value) || 0;
  const price = parseFloat(document.getElementById('editPrice').value) || 0;
  document.getElementById('editTotal').textContent = 'PKR ' + (qty * price).toLocaleString();
}

async function saveEditReceipt(id) {
  const qty = parseFloat(document.getElementById('editQty').value) || 0;
  const price = parseFloat(document.getElementById('editPrice').value) || 0;
  const reference = document.getElementById('editReference').value;
  const total = qty * price;
  if (qty <= 0 || price <= 0) { alert('❌ Quantity aur Price dalein!'); return; }
  const result = await DB.updateTransaction(id, {qty, price, total, reference});
  if (result.error) { alert('❌ ' + result.error); return; }
  alert('✅ Receipt update ho gayi!');
  document.getElementById('searchSerial').value = '';
  document.getElementById('searchResult').innerHTML = '';
  await loadReport();
}
 