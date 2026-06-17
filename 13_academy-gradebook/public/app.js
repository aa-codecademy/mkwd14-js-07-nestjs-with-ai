const API = '/api';
let currentUser = null;

// ── Utilities ────────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

let toastTimer;
function toast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = 'toast hidden'), 3000);
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function badgeClass(v) {
  return v >= 8 ? 'badge-high' : v >= 5 ? 'badge-mid' : 'badge-low';
}

function initials(firstName, lastName) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

function renderAuthBar() {
  const bar = document.getElementById('auth-bar');
  const lock = document.getElementById('lock-badge');
  const submitBtn = document.getElementById('btn-add-grade');

  if (currentUser) {
    bar.innerHTML = `
      <span class="username">👤 ${currentUser}</span>
      <button class="btn-auth" id="btn-logout">Logout</button>`;
    document.getElementById('btn-logout').addEventListener('click', doLogout);
    lock.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.title = '';
  } else {
    bar.innerHTML = `<button class="btn-auth login" id="btn-open-login">Trainer Login</button>`;
    document.getElementById('btn-open-login').addEventListener('click', openLoginModal);
    lock.style.display = '';
    submitBtn.disabled = true;
    submitBtn.title = 'Login as trainer to add grades';
  }
}

function openLoginModal() {
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.querySelector('#form-login input[name="username"]').focus();
}

function closeLoginModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('form-login').reset();
}

document.getElementById('btn-cancel-login').addEventListener('click', closeLoginModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeLoginModal();
});

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await api('POST', '/auth/login', formData(e.target));
    currentUser = res.username;
    closeLoginModal();
    renderAuthBar();
    toast(`Welcome, ${currentUser}!`);
  } catch (err) { toast(err.message, true); }
});

async function doLogout() {
  await api('POST', '/auth/logout').catch(() => null);
  currentUser = null;
  renderAuthBar();
  toast('Logged out');
}

async function checkSession() {
  try {
    const res = await api('GET', '/auth/me');
    currentUser = res.username;
  } catch { currentUser = null; }
  renderAuthBar();
}

// ── Tab navigation ────────────────────────────────────────────────────────────

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

document.querySelectorAll('.refresh-btn').forEach((btn) => {
  btn.addEventListener('click', () => loadList(btn.dataset.list));
});

// ── Students ─────────────────────────────────────────────────────────────────

function renderStudentList(students) {
  const list = document.getElementById('list-students');
  list.innerHTML = students.length
    ? students.map((s) => `
        <li>
          <div class="info">
            <strong>${s.firstName} ${s.lastName}</strong>
            <span>${s.email}</span>
          </div>
          <div class="actions">
            <button class="btn-delete" data-id="${s._id}" data-type="students">Delete</button>
          </div>
        </li>`).join('')
    : '<li class="empty">No students found.</li>';
  attachDeleteHandlers(list);
}

async function loadStudents() {
  try {
    const students = await api('GET', '/students');
    renderStudentList(students);
    populateSelect('grade', 'student', students, (s) => `${s.firstName} ${s.lastName}`);
    populateById('rpt-student-select', students, (s) => `${s.firstName} ${s.lastName}`);
  } catch (e) { toast(e.message, true); }
}

document.getElementById('form-student').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('POST', '/students', formData(e.target));
    toast('Student added');
    e.target.reset();
    document.getElementById('search-students').value = '';
    loadStudents();
  } catch (err) { toast(err.message, true); }
});

let searchTimer;
document.getElementById('search-students').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  const name = e.target.value.trim();
  searchTimer = setTimeout(async () => {
    try {
      const students = await api('GET', name ? `/students/search?name=${encodeURIComponent(name)}` : '/students');
      renderStudentList(students);
    } catch (err) { toast(err.message, true); }
  }, 300);
});

// ── Classes ───────────────────────────────────────────────────────────────────

async function loadClasses() {
  const list = document.getElementById('list-classes');
  try {
    const classes = await api('GET', '/classes');
    list.innerHTML = classes.length
      ? classes.map((c) => `
          <li>
            <span class="class-pill">${c.name}</span>
            <div class="info"><span>${c.description || '—'}</span></div>
            <div class="actions">
              <button class="btn-delete" data-id="${c._id}" data-type="classes">Delete</button>
            </div>
          </li>`).join('')
      : '<li class="empty">No classes yet.</li>';
    attachDeleteHandlers(list);
    populateSelect('homework', 'class', classes, (c) => c.name);
  } catch (e) { toast(e.message, true); }
}

document.getElementById('form-class').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = formData(e.target);
  if (!data.description) delete data.description;
  try {
    await api('POST', '/classes', data);
    toast('Class added');
    e.target.reset();
    loadClasses();
  } catch (err) { toast(err.message, true); }
});

// ── Homeworks ─────────────────────────────────────────────────────────────────

async function loadHomeworks() {
  const list = document.getElementById('list-homeworks');
  try {
    const homeworks = await api('GET', '/homeworks');
    list.innerHTML = homeworks.length
      ? homeworks.map((h) => `
          <li>
            <div class="info">
              <strong>${h.title}</strong>
              <span>${h.class?.name ?? '—'}${h.description ? ' · ' + h.description : ''}</span>
            </div>
            <div class="actions">
              <button class="btn-delete" data-id="${h._id}" data-type="homeworks">Delete</button>
            </div>
          </li>`).join('')
      : '<li class="empty">No homeworks yet.</li>';
    attachDeleteHandlers(list);
    populateSelect('grade', 'homework', homeworks, (h) => `${h.title} (${h.class?.name ?? '?'})`);
    populateById('rpt-homework-select', homeworks, (h) => `${h.title} (${h.class?.name ?? '?'})`);
  } catch (e) { toast(e.message, true); }
}

document.getElementById('form-homework').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = formData(e.target);
  if (!data.description) delete data.description;
  try {
    await api('POST', '/homeworks', data);
    toast('Homework added');
    e.target.reset();
    loadHomeworks();
  } catch (err) { toast(err.message, true); }
});

// ── Grades ────────────────────────────────────────────────────────────────────

async function loadGrades() {
  const list = document.getElementById('list-grades');
  try {
    const grades = await api('GET', '/grades');
    list.innerHTML = renderGradeRows(grades, { showStudent: true, showHomework: true });
    attachDeleteHandlers(list);
  } catch (e) { toast(e.message, true); }
}

document.getElementById('form-grade').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return toast('You must be logged in to add grades', true);
  const data = formData(e.target);
  data.value = Number(data.value);
  if (!data.notes) delete data.notes;
  try {
    await api('POST', '/grades', data);
    toast('Grade added');
    e.target.reset();
    loadGrades();
  } catch (err) {
    if (err.message.includes('logged in')) toast('Session expired — please log in again', true);
    else toast(err.message, true);
  }
});

// ── Reports ───────────────────────────────────────────────────────────────────

document.getElementById('rpt-student-select').addEventListener('change', async (e) => {
  const id = e.target.value;
  const container = document.getElementById('rpt-student-result');
  if (!id) {
    container.innerHTML = '<p class="report-placeholder">Select a student to view their report</p>';
    return;
  }

  container.innerHTML = '<p class="report-placeholder">Loading…</p>';
  try {
    const [grades, { average, count }] = await Promise.all([
      api('GET', `/grades/student/${id}`),
      api('GET', `/grades/student/${id}/average`),
    ]);

    // find student info from the select label
    const label = e.target.selectedOptions[0].text;
    const [firstName, ...rest] = label.split(' ');
    const lastName = rest.join(' ');

    const avgClass = badgeClass(average);

    const rows = grades.length
      ? grades.map((g) => `
          <tr>
            <td>${g.homework?.title ?? '—'}</td>
            <td><span class="class-pill">${g.homework?.class?.name ?? '—'}</span></td>
            <td><span class="badge ${badgeClass(g.value)}" style="width:28px;height:28px;font-size:.8rem">${g.value}</span></td>
            <td style="color:var(--muted)">${g.notes || '—'}</td>
          </tr>`).join('')
      : `<tr><td colspan="4" style="color:var(--muted);padding:16px 12px">No grades recorded yet</td></tr>`;

    container.innerHTML = `
      <div class="rc-summary">
        <div class="rc-avatar">${initials(firstName, lastName)}</div>
        <div class="rc-info">
          <div class="rc-name">${label}</div>
        </div>
        <div class="rc-avg">
          <div class="rc-avg-num" style="color:${average >= 8 ? '#166534' : average >= 5 ? '#854d0e' : '#991b1b'}">${average}</div>
          <div class="rc-avg-label">${count} grade${count !== 1 ? 's' : ''} · average</div>
        </div>
      </div>
      <table class="rc-table">
        <thead>
          <tr>
            <th>Homework</th>
            <th>Class</th>
            <th>Grade</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  } catch (err) { toast(err.message, true); }
});

document.getElementById('rpt-homework-select').addEventListener('change', async (e) => {
  const id = e.target.value;
  const container = document.getElementById('rpt-homework-result');
  if (!id) {
    container.innerHTML = '<p class="report-placeholder">Select a homework to view the leaderboard</p>';
    return;
  }

  container.innerHTML = '<p class="report-placeholder">Loading…</p>';
  try {
    const grades = await api('GET', `/grades/homework/${id}`);
    const label = e.target.selectedOptions[0].text;

    if (!grades.length) {
      container.innerHTML = '<p class="report-placeholder">No grades recorded for this homework yet</p>';
      return;
    }

    const rankClass = (i) => i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const rankIcon  = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;

    const rows = grades.map((g, i) => `
      <tr>
        <td class="lb-rank ${rankClass(i)}">${rankIcon(i)}</td>
        <td><strong>${g.student?.firstName ?? ''} ${g.student?.lastName ?? ''}</strong></td>
        <td>${g.student?.email ?? ''}</td>
        <td><span class="badge ${badgeClass(g.value)}" style="width:28px;height:28px;font-size:.8rem">${g.value}</span></td>
        <td style="color:var(--muted)">${g.notes || '—'}</td>
      </tr>`).join('');

    container.innerHTML = `
      <table class="lb-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Student</th>
            <th>Email</th>
            <th>Grade</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  } catch (err) { toast(err.message, true); }
});

// ── Render helpers ────────────────────────────────────────────────────────────

function renderGradeRows(grades, { showStudent = false, showHomework = false } = {}) {
  if (!grades.length) return '<li class="empty">No grades yet.</li>';
  return grades.map((g) => {
    const bc = badgeClass(g.value);
    const parts = [
      showStudent && g.student ? `${g.student.firstName} ${g.student.lastName}` : null,
      showHomework && g.homework ? g.homework.title : null,
      showHomework && g.homework?.class ? `(${g.homework.class.name})` : null,
      g.notes || null,
    ].filter(Boolean);
    const deleteBtn = currentUser
      ? `<button class="btn-delete" data-id="${g._id}" data-type="grades">Delete</button>`
      : '';
    return `
      <li>
        <span class="badge ${bc}">${g.value}</span>
        <div class="info"><span>${parts.join(' · ')}</span></div>
        <div class="actions">${deleteBtn}</div>
      </li>`;
  }).join('');
}

// ── Select helpers ────────────────────────────────────────────────────────────

function populateSelect(formId, name, items, labelFn) {
  const sel = document.querySelector(`#form-${formId} select[name="${name}"]`);
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = `<option value="">— Select —</option>` +
    items.map((i) => `<option value="${i._id}">${labelFn(i)}</option>`).join('');
  if (cur) sel.value = cur;
}

function populateById(id, items, labelFn) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = `<option value="">— Select —</option>` +
    items.map((i) => `<option value="${i._id}">${labelFn(i)}</option>`).join('');
  if (cur) sel.value = cur;
}

// ── Delete handler ────────────────────────────────────────────────────────────

function attachDeleteHandlers(container) {
  container.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this item?')) return;
      try {
        await api('DELETE', `/${btn.dataset.type}/${btn.dataset.id}`);
        toast('Deleted');
        loadList(btn.dataset.type);
      } catch (err) {
        if (err.message.includes('logged in')) toast('You must be logged in to delete grades', true);
        else toast(err.message, true);
      }
    });
  });
}

function loadList(type) {
  if (type === 'students') loadStudents();
  else if (type === 'classes') loadClasses();
  else if (type === 'homeworks') loadHomeworks();
  else if (type === 'grades') loadGrades();
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

checkSession();
loadStudents();
loadClasses();
loadHomeworks();
loadGrades();
