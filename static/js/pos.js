// ========================================
// SINDH ICE FACTORY - POS Logic
// ========================================

let customerType = 'dealer';
let txnType = 'Credit';

// ── Page Load ──
window.onload = async function () {
  setDateTime();
  await loadDealerDropdown();
};

// ── Date/Time Auto Set ──
function setDateTime() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const dt = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  document.getElementById('txnDate').value = dt;
}

// ── Dealer Dropdown Load ──
async function loadDealerDropdown() {
  const dealers = await DB.getDealers();
  const select = document.getElementById('dealerSelect');
  select.innerHTML = '<option value="">— Dealer chunein —</option>';
  dealers.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = d.name;
    select.appendChild(opt);
  });
}

// ── Customer Type Toggle ──
function setCustomerType(type) {
  customerType = type;
  document.getElementById('btnDealer').className =
    'toggle-btn' + (type === 'dealer' ? ' active-blue' : '');
  document.getElementById('btnWalkin').className =
    'toggle-btn' + (type === 'walkin' ? ' active-orange' : '');
  document.getElementById('dealerSection').classList
    .toggle('hidden', type !== 'dealer');
  document.getElementById('walkinSection').classList
    .toggle('hidden', type !== 'walkin');
}

// ── Transaction Type Toggle ──
function setTxnType(type) {
  txnType = type;
  document.getElementById('btnCredit').className =
    'toggle-btn' + (type === 'Credit' ? ' active-blue' : '');
  document.getElementById('btnCash').className =
    'toggle-btn' + (type === 'Cash' ? ' active-green' : '');
}

// ── Price Toggle ──
function togglePrice() {
  const cb = document.getElementById('editPrice');
  const priceInput = document.getElementById('price');
  priceInput.disabled = !cb.checked;
  if (!cb.checked) {
    priceInput.value = '';
    calcTotal();
  }
}

// ── Total Calculate ──
function calcTotal() {
  const qty = parseFloat(
    document.getElementById('qty').value) || 0;
  const price = parseFloat(
    document.getElementById('price').value) || 0;
  document.getElementById('totalDisplay').textContent =
    'PKR ' + (qty * price).toLocaleString();
}

// ── Submit POS ──
async function submitPOS() {
  const qty = parseFloat(document.getElementById('qty').value);
  const price = parseFloat(document.getElementById('price').value);
  const date = document.getElementById('txnDate').value;
  const reference = document.getElementById('reference').value;

  if (!qty || qty <= 0) {
    alert('❌ Quantity dalein!');
    return;
  }

  if (!price || price <= 0) {
    alert('❌ Price dalein!');
    return;
  }

  const total = qty * price;
  let dealerId = null;
  let displayName = '';
  let finalType = '';

  if (customerType === 'dealer') {
    const dealerSelect = document.getElementById('dealerSelect');
    dealerId = parseInt(dealerSelect.value);
    if (!dealerId) {
      alert('❌ Dealer chunein!');
      return;
    }
    displayName = dealerSelect
      .options[dealerSelect.selectedIndex].text;
    finalType = txnType;
  } else {
    const walkinName = document.getElementById('walkinName')
      .value.trim();
    displayName = walkinName || 'Cash';
    finalType = 'Cash';
  }

  // Transaction Save
  const res = await DB.addTransaction({
    dealerId: dealerId,
    dealerName: displayName,
    type: finalType,
    qty: qty,
    price: price,
    total: total,
    reference: reference,
    date: date
  });

  // Serial number
  const serial = res.serial || 'REC-0000';

  showReceipt(
    serial, displayName, finalType,
    qty, price, total, date, reference
  );
}

// ── Receipt Show ──
function showReceipt(serial, name, type, qty,
                     price, total, date, ref) {
  const formatted = new Date(date).toLocaleString('en-PK', {
    dateStyle: 'medium', timeStyle: 'short'
  });
  document.getElementById('receiptDate').textContent = formatted;

  let typeBadge = '';
  if (type === 'Credit') {
    typeBadge =
      '<span class="badge badge-blue">Udhaar (Credit)</span>';
  } else {
    typeBadge =
      '<span class="badge badge-green">Naqd (Cash)</span>';
  }

  document.getElementById('receiptBody').innerHTML = `
    <div class="receipt-row">
      <span class="r-label">Serial No.</span>
      <span class="r-value" style="color:#1565C0;
        font-weight:700;">${serial}</span>
    </div>
    <div class="receipt-row">
      <span class="r-label">Customer</span>
      <span class="r-value">${name}</span>
    </div>
    <div class="receipt-row">
      <span class="r-label">Type</span>
      <span class="r-value">${typeBadge}</span>
    </div>
    <div class="receipt-row">
      <span class="r-label">Ice Blocks</span>
      <span class="r-value" style="font-size:20px;
        font-weight:700; color:#1565C0;">
        ${qty} blocks
      </span>
    </div>
    <div class="receipt-row">
      <span class="r-label">Price / Block</span>
      <span class="r-value">
        PKR ${price.toLocaleString()}
      </span>
    </div>
    ${ref ? `
    <div class="receipt-row">
      <span class="r-label">Reference</span>
      <span class="r-value">${ref}</span>
    </div>` : ''}
    <div class="receipt-total">
      <span>Total</span>
      <span>PKR ${total.toLocaleString()}</span>
    </div>
  `;

  document.getElementById('receiptModal')
    .classList.remove('hidden');
}

// ── Receipt Close ──
function closeReceipt() {
  document.getElementById('receiptModal')
    .classList.add('hidden');
  resetForm();
}

// ── Reset Form ──
function resetForm() {
  document.getElementById('qty').value = '';
  document.getElementById('price').value = '';
  document.getElementById('price').disabled = true;
  document.getElementById('editPrice').checked = false;
  document.getElementById('reference').value = '';
  document.getElementById('walkinName').value = '';
  document.getElementById('dealerSelect').value = '';
  document.getElementById('totalDisplay').textContent = 'PKR 0';
  setDateTime();
  setCustomerType('dealer');
  setTxnType('Credit');
}