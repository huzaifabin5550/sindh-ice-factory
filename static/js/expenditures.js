// ========================================
// SINDH ICE FACTORY - Expenditures Logic
// ========================================

window.onload = async function () {
  setToday();
  await loadStats();
};

// ── Date Set ──
function setToday() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  document.getElementById('filterDate').value = today;
  loadExpenditures();
}

// ── Stats ──
async function loadStats() {
  const all = await fetch('/api/expenditures').then(r => r.json());
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

  const todayTotal = all
    .filter(e => e.date && e.date.startsWith(today))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const grandTotal = all
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  document.getElementById('statToday').textContent =
    'PKR ' + todayTotal.toLocaleString();
  document.getElementById('statTotal').textContent =
    'PKR ' + grandTotal.toLocaleString();
}

// ── Load Expenditures ──
async function loadExpenditures() {
  const date = document.getElementById('filterDate').value;
  let exps = [];

  if (date) {
    exps = await fetch(
      '/api/expenditures/date/' + date
    ).then(r => r.json());
  } else {
    exps = await fetch('/api/expenditures').then(r => r.json());
  }

  renderList(exps);
}

// ── Load All ──
async function loadAll() {
  document.getElementById('filterDate').value = '';
  const exps = await fetch('/api/expenditures').then(r => r.json());
  renderList(exps);
}

// ── Render List ──
function renderList(exps) {
  const container = document.getElementById('expendituresList');

  if (!exps || exps.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:2rem; color:#aaa;">
        <div style="font-size:40px;">💸</div>
        <p style="margin-top:10px;">Koi kharcha nahi mila</p>
      </div>`;
    return;
  }

  const total = exps.reduce((sum, e) => sum + (e.amount || 0), 0);

  container.innerHTML = `
    <table class="txn-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Reason</th>
          <th>Amount</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${exps.map(e => {
          const date = new Date(e.date).toLocaleDateString('en-PK', {
            day: '2-digit', month: 'short', year: 'numeric'
          });
          const time = new Date(e.date).toLocaleTimeString('en-PK', {
            hour: '2-digit', minute: '2-digit'
          });
          return `
            <tr>
              <td>
                ${date}<br>
                <span style="font-size:11px; color:#aaa;">${time}</span>
              </td>
              <td style="font-weight:500;">${e.reason || '—'}</td>
              <td class="text-red" style="font-weight:700;">
                PKR ${(e.amount || 0).toLocaleString()}
              </td>
              <td>
                <button class="btn btn-danger"
                  style="width:auto; padding:4px 12px; font-size:12px;"
                  onclick="deleteExp(${e.id})">
                  🗑 Delete
                </button>
              </td>
            </tr>`;
        }).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2"
            style="font-weight:700; padding:12px; color:#555;">
            Total
          </td>
          <td style="font-weight:700; color:#C62828; padding:12px;">
            PKR ${total.toLocaleString()}
          </td>
          <td></td>
        </tr>
      </tfoot>
    </table>`;
}

// ── Open Modal ──
function openAddExpenditure() {
  document.getElementById('expAmount').value = '';
  document.getElementById('expReason').value = '';
  const now = new Date();
  const pk = new Date(now.getTime() + 5*60*60*1000)
    .toISOString().slice(0,16);
  document.getElementById('expDate').value = pk;
  document.getElementById('addModal').classList.remove('hidden');
}

// ── Close Modal ──
function closeModal() {
  document.getElementById('addModal').classList.add('hidden');
}

// ── Save Expenditure ──
async function saveExpenditure() {
  const amount = parseFloat(
    document.getElementById('expAmount').value
  );
  const reason = document.getElementById('expReason').value.trim();
  const date = document.getElementById('expDate').value;

  if (!amount || amount <= 0) {
    alert('❌ Amount dalein!');
    return;
  }

  if (!reason) {
    alert('❌ Reason dalein!');
    return;
  }

  const res = await fetch('/api/expenditures', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, reason, date })
  });

  const data = await res.json();

  if (data.error) {
    alert('❌ ' + data.error);
    return;
  }

  closeModal();
  await loadStats();
  await loadExpenditures();
  alert('✅ Kharcha save ho gaya!');
}

// ── Delete ──
async function deleteExp(id) {
  if (!confirm('⚠️ Yeh kharcha delete ho jayega!')) return;

  await fetch('/api/expenditures/' + id, {
    method: 'DELETE'
  });

  await loadStats();
  await loadExpenditures();
}