 // ========================================
// SINDH ICE FACTORY - Reminders Logic
// ========================================

window.onload = function () {
  loadReminders();
};

function openModal() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const dt = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  document.getElementById('remDate').value = dt;
  document.getElementById('remTitle').value = '';
  document.getElementById('remDesc').value = '';
  document.getElementById('addModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('addModal').classList.add('hidden');
}

async function saveReminder() {
  const title = document.getElementById('remTitle').value.trim();
  const desc = document.getElementById('remDesc').value.trim();
  const date = document.getElementById('remDate').value;

  if (!title) { alert('❌ Title dalein!'); return; }
  if (!date) { alert('❌ Date dalein!'); return; }

  const res = await DB.addReminder({ title, description: desc, reminder_date: date });
  if (res.success) {
    closeModal();
    loadReminders();
  } else {
    alert('❌ Error: ' + (res.error || 'Kuch masla hua'));
  }
}

async function loadReminders() {
  const reminders = await DB.getAllReminders();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  let total = reminders.length;
  let pending = 0, done = 0;
  let todayItems = [], upcomingItems = [], overdueItems = [], doneItems = [];

  reminders.forEach(r => {
    const rDate = new Date(r.reminder_date);
    const rDateStr = r.reminder_date.split('T')[0];

    if (r.is_done) {
      done++;
      doneItems.push(r);
    } else {
      pending++;
      if (rDateStr === todayStr) {
        todayItems.push(r);
      } else if (rDate < now) {
        overdueItems.push(r);
      } else {
        upcomingItems.push(r);
      }
    }
  });

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statDone').textContent = done;

  renderList('overdueList', overdueItems, 'overdue');
  renderList('todayList', todayItems, 'today');
  renderList('upcomingList', upcomingItems, 'upcoming');
  renderList('doneList', doneItems, 'done');
}

function renderList(containerId, items, type) {
  const container = document.getElementById(containerId);
  if (!items.length) {
    container.innerHTML = '<p style="color:#aaa; text-align:center; padding:12px;">Koi reminder nahi</p>';
    return;
  }

  container.innerHTML = items.map(r => {
    const dateStr = new Date(r.reminder_date).toLocaleString('en-PK', {
      dateStyle: 'medium', timeStyle: 'short'
    });

    let borderColor = '#1565c0';
    if (type === 'overdue') borderColor = '#c62828';
    if (type === 'today') borderColor = '#e65100';
    if (type === 'done') borderColor = '#2e7d32';

    return `
      <div style="
        border-left: 4px solid ${borderColor};
        background: #fafafa;
        border-radius: 8px;
        padding: 12px 14px;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div>
          <div style="font-weight:600; font-size:14px; color:#222;">
            ${r.is_done ? '✅' : '🔔'} ${r.title}
          </div>
          ${r.description ? `<div style="font-size:12px; color:#666; margin-top:3px;">📝 ${r.description}</div>` : ''}
          <div style="font-size:12px; color:#888; margin-top:4px;">🕐 ${dateStr}</div>
        </div>
        <div style="display:flex; gap:8px;">
          ${!r.is_done ? `
            <button onclick="markDone(${r.id})" style="
              background:#e8f5e9; color:#2e7d32;
              border:1px solid #a5d6a7;
              padding:6px 12px; border-radius:8px;
              cursor:pointer; font-size:12px;">
              ✅ Done
            </button>
          ` : ''}
          <button onclick="deleteReminder(${r.id})" style="
            background:#ffebee; color:#c62828;
            border:1px solid #ef9a9a;
            padding:6px 12px; border-radius:8px;
            cursor:pointer; font-size:12px;">
            🗑 Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function markDone(id) {
  await DB.markReminderDone(id);
  loadReminders();
}

async function deleteReminder(id) {
  if (confirm('Yeh reminder delete karna chahte hain?')) {
    await DB.deleteReminder(id);
    loadReminders();
  }
}