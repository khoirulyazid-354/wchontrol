/* Komponen UI bersama: notifikasi toast */
function showUserProfileToast() { showToast('Profil aktif: ' + (appState.user?.subconName || 'ADMIN'), 'info'); }

function showToast(message, type = 'success') {
  const c = document.getElementById('toast-container');
  const colors = { success: 'bg-slate-900 text-white border-slate-800', error: 'bg-rose-600 text-white border-rose-500', info: 'bg-[#006699] text-white border-sky-600' };
  const t = document.createElement('div');
  t.className = (colors[type] || colors.success) + ' px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-medium pointer-events-auto transition-all duration-300';
  t.textContent = message;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-6px)'; setTimeout(() => t.remove(), 300); }, 3000);
}
