 let locType = 'Remote';
let editMode = false;

window.onload = async function () {
  await renderDealers();
};

async function renderDealers() {
  const dealers = await DB.getDealers();
  const searchEl = document.getElementById('searchInput');
  const query = searchEl ? searchEl.value.toLowerCase() : '';
  const filtered = dealers.filter(d =>
    d.name.toLowerCase().includes(query)
  );

  const totalBalance = dealers.reduce(
    (sum, d) => sum + (d.balance || 0), 0
  );
  document.getElementById('statTotal').textContent = dealers.length;
  document.getElementById('statBalance').textContent =
    'PKR ' + totalBalance.toLocaleString();

  const container = document.getElementById('dealerList');

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:3rem; color:#aaa;">
        <div style="font-size:40px;">👥</div>
        <p style="margin-top:10px;">Koi dealer nahi mila</p>
        <p style="font-size:13px; margin-top:5px;">
          "Dealer Add Karein" button dabao
        </p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(d => {
    const initials = d.name.split(' ')
      .map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const balanceClass = d.balance > 0 ? 'debt' : 'clear';
    const balanceText = d.balance > 0
      ? 'PKR ' + d.balance.toLocaleString() + ' baqi'
      : 'Clear ✅';
    const locBadge = d.location === 'Remote'
      ? '<span class="badge badge-purple">Remote</span>'
      : '<span class="badge badge-green">Mobile</span>';

    return `
      <div class="dealer-item">
        <div class="dealer-avatar" onclick="goToDealer(${d.id})"
          style="cursor:pointer;">
          ${initials}
        </div>
        <div class="dealer-info" onclick="goToDealer(${d.id})"
          style="cursor:pointer;">
          <div class="dealer-name">${d.name}</div>
          <div class="dealer-meta">
            ${d.phone ? '📞 ' + d.phone + ' &nbsp;' : ''}
            ${locBadge}
          </div>
        </div>
        <div style="display:flex; flex-direction:column;
          align-items:flex-end; gap:8px;">
          <div class="dealer-balance">
            <div class="balance-amount ${balanceClass}">
              ${balanceText}
            </div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary"
              style="padding:5px 12px; font-size:12px; width:auto;"
              onclick="openEditDealer(${d.id})">
              ✏️ Edit
            </button>
            <button class="btn btn-danger"
              style="padding:5px 12px; font-size:12px; width:auto;"
              onclick="confirmDelete(${d.id}, '${d.name}')">
              🗑 Delete
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function goToDealer(id) {
  window.location.href = `/dealer-detail?id=${id}`;
}

// ── Add Dealer ──
function openAddDealer() {
  editMode = false;
  document.getElementById('modalTitle').textContent =
    '➕ Naya Dealer Add Karein';
  document.getElementById('editDealerId').value = '';
  document.getElementById('fName').value = '';
  document.getElementById('fPhone').value = '';
  document.getElementById('fCnic').value = '';
  document.getElementById('fAddress').value = '';
  setLoc('Remote');
  document.getElementById('addDealerModal')
    .classList.remove('hidden');
}

// ── Edit Dealer ──
async function openEditDealer(id) {
  editMode = true;
  const dealer = await DB.getDealer(id);
  document.getElementById('modalTitle').textContent =
    '✏️ Dealer Edit Karein';
  document.getElementById('editDealerId').value = id;
  document.getElementById('fName').value = dealer.name || '';
  document.getElementById('fPhone').value = dealer.phone || '';
  document.getElementById('fCnic').value = dealer.cnic || '';
  document.getElementById('fAddress').value = dealer.address || '';
  setLoc(dealer.location || 'Remote');
  document.getElementById('addDealerModal')
    .classList.remove('hidden');
}

function closeAddDealer() {
  document.getElementById('addDealerModal')
    .classList.add('hidden');
  editMode = false;
}

function setLoc(type) {
  locType = type;
  document.getElementById('locRemote').className =
    'toggle-btn' + (type === 'Remote' ? ' active-blue' : '');
  document.getElementById('locMobile').className =
    'toggle-btn' + (type === 'Mobile' ? ' active-green' : '');
}

// ── Save (Add or Edit) ──
async function saveDealer() {
  const name = document.getElementById('fName').value.trim();
  const phone = document.getElementById('fPhone').value.trim();
  const cnic = document.getElementById('fCnic').value.trim();
  const address = document.getElementById('fAddress').value.trim();

  if (!name) { alert('❌ Dealer ka naam dalein!'); return; }

  if (editMode) {
    const id = document.getElementById('editDealerId').value;
    const result = await DB.updateDealer(id, {
      name, phone, cnic,
      location: locType, address
    });
    if (result.error) { alert('❌ ' + result.error); return; }
    closeAddDealer();
    await renderDealers();
    alert('✅ Dealer update ho gaya!');
  } else {
    const result = await DB.addDealer({
      name, phone, cnic,
      location: locType, address
    });
    if (result.error) { alert('❌ ' + result.error); return; }
    closeAddDealer();
    await renderDealers();
    alert('✅ Dealer add ho gaya!');
  }
}

// ── Delete ──
async function confirmDelete(id, name) {
  if (!confirm('⚠️ Kya aap sure hain?\n' + name + ' delete ho jayega!')) return;
  await DB.deleteDealer(id);
  await renderDealers();
  alert('✅ Dealer delete ho gaya!');
}
 