// ─── STATE ────────────────────────────────────────────────────────────────────
// In a real app access tokens live in memory (not localStorage) to prevent XSS.
// Refresh tokens ideally live in httpOnly cookies; here we store in memory for
// demo simplicity.
const state = {
  accessToken: null,
  refreshToken: null,
  userId: null,
  userEmail: null,
  userRole: null,
};

const API = '/api';

// ─── API HELPER ───────────────────────────────────────────────────────────────
async function api(path, options = {}) {
  setLoading(true);

  const headers = { 'Content-Type': 'application/json' };

  // Attach JWT if we have one
  if (state.accessToken) {
    headers['Authorization'] = `Bearer ${state.accessToken}`;
  }

  try {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const body = res.status === 204 ? null : isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const msg = typeof body === 'object' ? body?.message || JSON.stringify(body) : body;
      throw new ApiError(res.status, msg);
    }

    showStatus(res.status, 'ok');
    return body;
  } catch (err) {
    if (err instanceof ApiError) {
      showStatus(err.status, 'error', err.message);
      throw err;
    }
    showStatus(0, 'error', err.message);
    throw err;
  } finally {
    setLoading(false);
  }
}

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ─── OUTPUT ───────────────────────────────────────────────────────────────────
const outputEl = document.getElementById('output');

function print(data, label) {
  const json = JSON.stringify(data, null, 2);
  const highlighted = syntaxHighlight(json);
  const prefix = label ? `<span class="json-key">// ${label}</span>\n` : '';
  outputEl.innerHTML = prefix + highlighted;
}

function syntaxHighlight(json) {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) return `<span class="json-key">${match}</span>`;
          return `<span class="json-str">${match}</span>`;
        }
        if (/true|false/.test(match)) return `<span class="json-bool">${match}</span>`;
        if (/null/.test(match)) return `<span class="json-null">${match}</span>`;
        return `<span class="json-num">${match}</span>`;
      }
    );
}

function showStatus(code, type, message) {
  const el = document.getElementById('output-status');
  const dot = `<span class="status-dot status-dot--${type}"></span>`;
  const codeText = code ? `HTTP ${code}` : 'Error';
  el.innerHTML = `${dot} <strong>${codeText}</strong>${message ? ' — ' + message : ''}`;
}

function setLoading(on) {
  const el = document.getElementById('output-status');
  if (on) el.innerHTML = `<span class="status-dot status-dot--loading"></span> <em>Loading…</em>`;
}

document.getElementById('clear-output').addEventListener('click', () => {
  outputEl.innerHTML = 'Cleared.';
  document.getElementById('output-status').innerHTML = '';
});

// ─── TOAST ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ─── SESSION UI ───────────────────────────────────────────────────────────────
function updateSessionUI() {
  const statusEl = document.getElementById('user-status');
  const tokenDisplay = document.getElementById('token-display');
  const refreshDisplay = document.getElementById('refresh-display');
  const useridDisplay = document.getElementById('userid-display');
  const refreshUseridInput = document.getElementById('refresh-userid-input');
  const refreshTokenInput = document.getElementById('refresh-token-input');

  if (state.accessToken) {
    const roleClass = state.userRole === 'admin' ? 'badge--admin' : 'badge--user';
    statusEl.innerHTML = `
      <div class="topbar__user-info">
        <span class="topbar__email">${state.userEmail || 'Unknown'}</span>
        <span class="topbar__email-dim">ID: ${state.userId?.slice(0, 8)}…</span>
      </div>
      <span class="badge ${roleClass}">${state.userRole || 'user'}</span>
    `;
  } else {
    statusEl.innerHTML = `<span class="badge badge--guest">Not logged in</span>`;
  }

  // Token panel
  const shortToken = state.accessToken
    ? state.accessToken.slice(0, 24) + '…'
    : '—';
  const shortRefresh = state.refreshToken
    ? state.refreshToken.slice(0, 20) + '…'
    : '—';

  tokenDisplay.textContent = shortToken;
  tokenDisplay.className = 'token-panel__value' + (state.accessToken ? '' : ' empty');

  refreshDisplay.textContent = shortRefresh;
  refreshDisplay.className = 'token-panel__value' + (state.refreshToken ? '' : ' empty');

  useridDisplay.textContent = state.userId || '—';
  useridDisplay.className = 'token-panel__value mono' + (state.userId ? '' : ' empty');

  // Auto-fill refresh form
  if (refreshUseridInput) refreshUseridInput.value = state.userId || '';
  if (refreshTokenInput) refreshTokenInput.value = state.refreshToken || '';
}

function setSession({ user, accessToken, refreshToken }) {
  state.accessToken = accessToken;
  state.refreshToken = refreshToken ?? state.refreshToken;
  state.userId = user?.id ?? state.userId;
  state.userEmail = user?.email ?? state.userEmail;
  state.userRole = user?.role ?? state.userRole;
  updateSessionUI();
}

function clearSession() {
  state.accessToken = null;
  state.refreshToken = null;
  state.userId = null;
  state.userEmail = null;
  state.userRole = null;
  updateSessionUI();
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`section-${btn.dataset.section}`).classList.add('active');
  });
});

// ─── TAB SWITCHING ────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const parent = tab.closest('.section') || document;
    parent.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    parent.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('active');
  });
});

// ─── AUTH: REGISTER ───────────────────────────────────────────────────────────
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const user = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
    });
    print({ registered: user }, 'POST /auth/register');
    toast('✅ Registered! Now login to get your tokens.');
    e.target.reset();
  } catch (err) {
    print({ error: err.message }, 'POST /auth/register');
  }
});

// ─── AUTH: LOGIN ──────────────────────────────────────────────────────────────
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
    });
    setSession(data);
    print(data, 'POST /auth/login');
    toast(`✅ Logged in as ${data.user.email} (${data.user.role})`);
    e.target.reset();
  } catch (err) {
    print({ error: err.message }, 'POST /auth/login');
  }
});

// ─── AUTH: FORGOT PASSWORD ────────────────────────────────────────────────────
document.getElementById('forgot-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: fd.get('email') }),
    });
    print(data, 'POST /auth/forgot-password');
    if (data.resetToken) {
      toast('🔑 Reset token returned — copy it and use the Reset tab.');
      // Auto-fill the reset form for convenience
      document.querySelector('#reset-form input[name="token"]').value = data.resetToken;
    } else {
      toast('✅ ' + data.message);
    }
    e.target.reset();
  } catch (err) {
    print({ error: err.message }, 'POST /auth/forgot-password');
  }
});

// ─── AUTH: RESET PASSWORD ─────────────────────────────────────────────────────
document.getElementById('reset-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: fd.get('token'), newPassword: fd.get('newPassword') }),
    });
    print(data, 'POST /auth/reset-password');
    toast('✅ Password reset. Login again with your new password.');
    e.target.reset();
  } catch (err) {
    print({ error: err.message }, 'POST /auth/reset-password');
  }
});

// ─── AUTH: REFRESH TOKEN ──────────────────────────────────────────────────────
document.getElementById('refresh-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ userId: fd.get('userId'), refreshToken: fd.get('refreshToken') }),
    });
    // Update tokens — keep existing user info
    state.accessToken = data.accessToken;
    state.refreshToken = data.refreshToken;
    updateSessionUI();
    print(data, 'POST /auth/refresh');
    toast('🔄 Tokens rotated — old refresh token is now invalid.');
  } catch (err) {
    print({ error: err.message }, 'POST /auth/refresh');
  }
});

// ─── AUTH: LOGOUT ─────────────────────────────────────────────────────────────
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    const data = await api('/auth/logout', { method: 'POST' });
    print(data, 'POST /auth/logout');
    clearSession();
    toast('👋 Logged out. Refresh token revoked.');
  } catch (err) {
    print({ error: err.message }, 'POST /auth/logout');
  }
});

// ─── ARTISTS ──────────────────────────────────────────────────────────────────
document.getElementById('artist-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/artist', {
      method: 'POST',
      body: JSON.stringify({
        name: fd.get('name'),
        genre: fd.get('genre'),
        isActive: true,
        profile: { country: fd.get('country') },
      }),
    });
    print(data, 'POST /artist (admin only)');
    toast('✅ Artist created!');
    e.target.reset();
    loadArtists();
  } catch (err) {
    print({ error: err.message }, 'POST /artist');
    if (err.status === 401) toast('🔒 Not logged in', 'error');
    if (err.status === 403) toast('🚫 Admin only', 'error');
  }
});

document.getElementById('load-artists').addEventListener('click', loadArtists);

document.getElementById('artist-search').addEventListener('input', (e) => {
  const q = e.target.value.trim();
  if (!q) { loadArtists(); return; }
  loadArtists(q);
});

async function loadArtists(search) {
  try {
    const qs = search ? `?name=${encodeURIComponent(search)}` : '';
    const data = await api(`/artist${qs}`);
    print(data, `GET /artist${qs}`);
    renderList('artist-list', data, renderArtistCard);
  } catch (err) {
    print({ error: err.message }, 'GET /artist');
  }
}

function renderArtistCard(artist) {
  return `
    <div class="item-card">
      <div class="item-card__name">${esc(artist.name)}</div>
      <div class="item-card__meta">
        <span>🎸 ${esc(artist.genre)}</span>
        <span>🌍 ${esc(artist.profile?.country || '—')}</span>
        <span>${artist.isActive ? '✅ Active' : '⏸ Inactive'}</span>
      </div>
      <div class="item-card__id" title="Click to copy" onclick="copy('${artist.id}')">${artist.id}</div>
    </div>
  `;
}

// ─── SONGS ────────────────────────────────────────────────────────────────────
document.getElementById('song-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/song', {
      method: 'POST',
      body: JSON.stringify({
        title: fd.get('title'),
        durationSeconds: Number(fd.get('durationSeconds')),
        artistId: fd.get('artistId'),
        isExplicit: fd.get('isExplicit') === 'on',
      }),
    });
    print(data, 'POST /song (admin only)');
    toast('✅ Song created!');
    e.target.reset();
    loadSongs();
  } catch (err) {
    print({ error: err.message }, 'POST /song');
    if (err.status === 403) toast('🚫 Admin only', 'error');
  }
});

document.getElementById('load-songs').addEventListener('click', loadSongs);

async function loadSongs() {
  try {
    const data = await api('/song');
    print(data, 'GET /song');
    renderList('song-list', data, renderSongCard);
  } catch (err) {
    print({ error: err.message }, 'GET /song');
  }
}

function renderSongCard(song) {
  const mins = Math.floor(song.durationSeconds / 60);
  const secs = String(song.durationSeconds % 60).padStart(2, '0');
  return `
    <div class="item-card">
      <div class="item-card__name">${esc(song.title)} ${song.isExplicit ? '🅴' : ''}</div>
      <div class="item-card__meta">
        <span>⏱ ${mins}:${secs}</span>
      </div>
      <div class="item-card__id" title="Click to copy" onclick="copy('${song.id}')">${song.id}</div>
    </div>
  `;
}

// ─── ALBUMS ───────────────────────────────────────────────────────────────────
document.getElementById('album-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const releaseDate = fd.get('releaseDate');
    const data = await api('/album', {
      method: 'POST',
      body: JSON.stringify({
        title: fd.get('title'),
        ...(releaseDate ? { releaseDate: new Date(releaseDate).toISOString() } : {}),
        artistId: fd.get('artistId'),
        editions: [{
          format: fd.get('editionFormat'),
          copies: Number(fd.get('editionCopies')),
          isLimited: false,
        }],
      }),
    });
    print(data, 'POST /album (admin only)');
    toast('✅ Album created!');
    e.target.reset();
    loadAlbums();
  } catch (err) {
    print({ error: err.message }, 'POST /album');
    if (err.status === 403) toast('🚫 Admin only', 'error');
  }
});

document.getElementById('load-albums').addEventListener('click', loadAlbums);

async function loadAlbums() {
  try {
    const data = await api('/album');
    print(data, 'GET /album');
    renderList('album-list', data, renderAlbumCard);
  } catch (err) {
    print({ error: err.message }, 'GET /album');
  }
}

function renderAlbumCard(album) {
  return `
    <div class="item-card">
      <div class="item-card__name">💿 ${esc(album.title)}</div>
      <div class="item-card__meta">
        <span>📅 ${album.releaseDate ? new Date(album.releaseDate).getFullYear() : '—'}</span>
        <span>${album.songs?.length ?? 0} songs</span>
      </div>
      <div class="item-card__id" title="Click to copy" onclick="copy('${album.id}')">${album.id}</div>
    </div>
  `;
}

// ─── PLAYLISTS ────────────────────────────────────────────────────────────────
document.getElementById('playlist-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/playlist', {
      method: 'POST',
      body: JSON.stringify({ title: fd.get('title'), author: fd.get('author') }),
    });
    print(data, 'POST /playlist');
    toast('✅ Playlist created! You own it.');
    e.target.reset();
    loadPlaylists();
  } catch (err) {
    print({ error: err.message }, 'POST /playlist');
    if (err.status === 401) toast('🔒 Login first', 'error');
  }
});

document.getElementById('playlist-songs-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const id = fd.get('playlistId').trim();
  const songIds = fd.get('songIds').split('\n').map(s => s.trim()).filter(Boolean);
  try {
    const data = await api(`/playlist/${id}/songs`, {
      method: 'PUT',
      body: JSON.stringify({ songIds }),
    });
    print(data, `PUT /playlist/${id}/songs`);
    toast('✅ Songs updated!');
    e.target.reset();
    loadPlaylists();
  } catch (err) {
    print({ error: err.message }, `PUT /playlist/${id}/songs`);
    if (err.status === 403) toast('🚫 You don\'t own this playlist', 'error');
  }
});

document.getElementById('playlist-delete-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const id = fd.get('playlistId').trim();
  if (!confirm(`Delete playlist ${id}?`)) return;
  try {
    await api(`/playlist/${id}`, { method: 'DELETE' });
    print({ deleted: id }, `DELETE /playlist/${id}`);
    toast('🗑 Playlist deleted.');
    e.target.reset();
    loadPlaylists();
  } catch (err) {
    print({ error: err.message }, `DELETE /playlist/${id}`);
    if (err.status === 403) toast('🚫 You don\'t own this playlist', 'error');
  }
});

document.getElementById('load-playlists').addEventListener('click', loadPlaylists);

async function loadPlaylists() {
  try {
    const data = await api('/playlist');
    print(data, 'GET /playlist');
    renderList('playlist-list', data, renderPlaylistCard);
  } catch (err) {
    print({ error: err.message }, 'GET /playlist');
  }
}

function renderPlaylistCard(pl) {
  const isOwner = pl.owner?.id && pl.owner.id === state.userId;
  const isAdmin = state.userRole === 'admin';
  const canEdit = isOwner || isAdmin;
  const ownerTag = pl.owner
    ? `<span>👤 ${esc(pl.owner.email ?? pl.owner.id?.slice(0, 8))}</span>`
    : `<span style="color:var(--text-dim)">No owner</span>`;
  const mineBadge = isOwner
    ? `<span class="item-card__mine">MINE</span>`
    : isAdmin && pl.owner
    ? `<span class="item-card__mine" style="background:rgba(245,158,11,.1);color:var(--warning)">ADMIN</span>`
    : '';
  return `
    <div class="item-card">
      <div class="item-card__name">📋 ${esc(pl.title)} ${mineBadge}</div>
      <div class="item-card__meta">
        <span>✍ ${esc(pl.author)}</span>
        <span>🎵 ${pl.songs?.length ?? '—'} songs</span>
      </div>
      <div class="item-card__owner">${ownerTag}</div>
      <div class="item-card__id" title="Click to copy" onclick="copy('${pl.id}')">${pl.id}</div>
    </div>
  `;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function renderList(containerId, items, cardFn) {
  const el = document.getElementById(containerId);
  if (!items || !items.length) {
    el.innerHTML = `<div class="empty-state">No items yet.</div>`;
    return;
  }
  el.innerHTML = items.map(cardFn).join('');
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function copy(text) {
  navigator.clipboard.writeText(text).then(() => toast('📋 Copied: ' + text.slice(0, 20) + '…'));
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
updateSessionUI();
