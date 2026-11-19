/* Login, logout, sesi pengguna (appState) */
let appState = { isLoggedIn: false, user: { subconName: 'ADMIN', picName: 'Admin Gudang' } };

/* Daftar subcont diisi otomatis dari kolom Subcont di file CSV */
const SUBCONTS = [];
let dataStatus = 'loading';
const DATA_SOURCES = 2; /* jumlah file data yang memuat daftar subcont: DO dan BOQ */
let sourcesDone = 0;
function sourceDone(names) {
  (names || []).forEach(n => { if (n && !SUBCONTS.includes(n)) SUBCONTS.push(n); });
  if (++sourcesDone < DATA_SOURCES) return;
  dataStatus = SUBCONTS.length ? 'ready' : 'error';
  if (appState.isLoggedIn && !canonSubcont(appState.user.subconName)) {
    appState.isLoggedIn = false;
    try { localStorage.removeItem('whcontrol_auth'); } catch (e) {}
    updateAuthUI();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    const saved = localStorage.getItem('whcontrol_auth');
    if (saved) {
      const p = JSON.parse(saved);
      appState.isLoggedIn = !!p.isLoggedIn;
      if (p.user) appState.user = p.user;
    }
  } catch (e) { console.error(e); }
  updateAuthUI();
});

function updateAuthUI() {
  const u = document.getElementById('smdt-logged-user');
  if (u && appState.user) { u.textContent = appState.user.subconName; const w = document.getElementById('smdt-welcome-name'); if (w) w.textContent = appState.user.subconName; const av = document.getElementById('smdt-avatar'); if (av) av.textContent = (appState.user.subconName || 'A').charAt(0).toUpperCase(); }
  renderSmdtMenu();
  showView(appState.isLoggedIn ? 'view-smdt-home' : 'view-landing');
}

function togglePasswordVisibility() {
  const i = document.getElementById('login-password-input');
  const b = document.getElementById('toggle-password-btn');
  const hidden = i.type === 'password';
  i.type = hidden ? 'text' : 'password';
  b.textContent = hidden ? 'Sembunyikan' : 'Tampilkan';
}

function fillDemoCredentials() {
  document.getElementById('login-subcont-input').value = 'ADMIN';
  document.getElementById('login-password-input').value = '12345678';
  showToast('Akun demo terisi. Klik tombol Masuk.', 'info');
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('login-subcont-input').value.trim();
  const pass = document.getElementById('login-password-input').value;
  if (!name || !pass) { showToast('Subcont Name dan Password wajib diisi!', 'error'); return; }
  const canon = canonSubcont(name);
  if (!canon && dataStatus !== 'ready') { showToast(dataStatus === 'error' ? 'Data subcont gagal dimuat. Hanya ADMIN yang bisa masuk.' : 'Data sedang dimuat, coba lagi sebentar.', 'error'); return; }
  if (!canon || pass !== '12345678') { showToast('Subcont Name atau password salah.', 'error'); return; }
  appState.isLoggedIn = true;
  appState.user = { subconName: canon, picName: canon === 'ADMIN' ? 'Admin Gudang' : 'PIC ' + canon };
  try { localStorage.setItem('whcontrol_auth', JSON.stringify({ isLoggedIn: true, user: appState.user })); } catch (err) {}
  updateAuthUI();
  showToast('Berhasil masuk sebagai ' + canon);
}

function handleLogout() {
  appState.isLoggedIn = false;
  try { localStorage.removeItem('whcontrol_auth'); } catch (err) {}
  document.getElementById('login-password-input').value = '';
  updateAuthUI();
  showToast('Anda telah keluar dari akun.', 'info');
}

function canonSubcont(n) {
  const k = String(n || '').trim().toUpperCase();
  return k === 'ADMIN' ? 'ADMIN' : (SUBCONTS.find(x => x.toUpperCase() === k) || null);
}
