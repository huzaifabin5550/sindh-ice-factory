 // ========================================
// SINDH ICE FACTORY - Dealers Logic
// ========================================

let locType = 'Remote';

// ── Page Load ──
window.onload = async function () {
  await renderDealers();
};

// ── Render Dealer List ──
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
  document.getElementById('statTotal').textContent =
    dealers.length;
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
      <div class="dealer-item"
        onclick="goToDealer(${d.id})">
        <div class="dealer-avatar">${initials}</div>
        <div class="dealer-info">
          <div class="dealer-name">${d.name}</div>
          <div class="dealer-meta">
            ${d.phone ? '📞 ' + d.phone + ' &nbsp;' : ''}
            ${locBadge}
          </div>
        </div>
        <div class="dealer-balance">
          <div class="balance-amount ${balanceClass}">
            ${balanceText}
          </div>
          <div style="font-size:11px; color:#aaa;
            margin-top:3px;">
            Tap karein details ke liye →
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Go To Dealer Detail ──
function goToDealer(id) {
  window.location.href = `/dealer-detail?id=${id}`;
}

// ── Open Add Dealer Modal ──
function openAddDealer() {
  document.getElementById('fName').value = '';
  document.getElementById('fPhone').value = '';
  document.getElementById('fCnic').value = '';
  document.getElementById('fAddress').value = '';
  setLoc('Remote');
  document.getElementById('addDealerModal')
    .classList.remove('hidden');
}

// ── Close Modal ──
function closeAddDealer() {
  document.getElementById('addDealerModal')
    .classList.add('hidden');
}

// ── Location Type ──
function setLoc(type) {
  locType = type;
  document.getElementById('locRemote').className =
    'toggle-btn' + (type === 'Remote' ? ' active-blue' : '');
  document.getElementById('locMobile').className =
    'toggle-btn' + (type === 'Mobile' ? ' active-green' : '');
}

// ── Save Dealer ──
async function saveDealer() {
  const name = document.getElementById('fName').value.trim();
  const phone = document.getElementById('fPhone').value.trim();
  const cnic = document.getElementById('fCnic').value.trim();
  const address = document.getElementById('fAddress')
    .value.trim();

  if (!name) {
    alert('❌ Dealer ka naam dalein!');
    return;
  }

  const result = await DB.addDealer({
    name: name,
    phone: phone,
    cnic: cnic,
    location: locType,
    address: address
  });

  if (result.error) {
    alert('❌ ' + result.error);
    return;
  }

  closeAddDealer();
  await renderDealers();
  alert('✅ Dealer successfully add ho gaya!');
}