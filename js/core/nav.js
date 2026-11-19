/* Navigasi antar halaman dan menu MASTER SMDT */
const VIEWS = ['view-landing', 'view-login', 'view-smdt-home', 'view-report', 'view-do', 'view-to', 'view-boq'];

function showView(id) {
  VIEWS.forEach(v => document.getElementById(v).classList.toggle('hidden', v !== id));
  lucide.createIcons();
}

function openLoginPage() { showView('view-login'); document.getElementById('login-subcont-input').focus(); }

function backToLandingFromLogin() { showView('view-landing'); }

function backToSmdtHome() { showView('view-smdt-home'); }

function openReportForm() { showView('view-report'); window.scrollTo({ top: 0, behavior: 'smooth' }); }

const SMDT_MENU = [
  { name: 'Dashboard', sub: 'Ringkasan aktivitas', icon: 'layout-grid', tint: 'bg-[#e6f2f8] text-[#006699]' },
  { name: 'Total DO', sub: 'Delivery Order', icon: 'truck', tint: 'bg-sky-50 text-sky-600', view: 'view-do', init: 'initDO' },
  { name: 'Total TO', sub: 'Transfer Order', icon: 'refresh-cw', tint: 'bg-amber-50 text-amber-600', view: 'view-to', init: 'initTO' },
  { name: 'Total BOQ', sub: 'Bill of Quantity', icon: 'clipboard-list', tint: 'bg-lime-50 text-lime-700', view: 'view-boq', init: 'initBOQ' },
  { name: 'WHControl', sub: 'Warehouse Control', icon: 'warehouse', tint: 'bg-pink-50 text-pink-600', open: true }
];

let activeSmdtMenu = 'Dashboard';

function renderSmdtMenu() {
  const list = document.getElementById('smdt-menu-list');
  list.innerHTML = '';
  SMDT_MENU.forEach((m, i) => {
    const on = m.name === activeSmdtMenu;
    const last = i === SMDT_MENU.length - 1;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'text-left p-4 sm:p-6 rounded-2xl border bg-white flex flex-col justify-between gap-5 min-h-[150px] sm:min-h-[210px] transition-all cursor-pointer group hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-12px_rgba(15,23,42,0.18)] ' +
      (last ? 'col-span-2 lg:col-span-1 ' : '') +
      (on ? 'border-[#006699] ring-2 ring-[#006699]/15' : 'border-slate-200 hover:border-[#006699]/40');
    b.innerHTML = '<div class="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ' + m.tint + '"><i data-lucide="' + m.icon + '" class="w-5 h-5 sm:w-6 sm:h-6"></i></div>' +
      '<div><div class="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">' + m.name + '</div><div class="text-xs sm:text-[13px] text-slate-500 mt-1">' + m.sub + '</div></div>' +
      '<div class="flex items-center gap-1 text-xs font-bold ' + (on ? 'text-[#006699]' : 'text-slate-400 group-hover:text-[#006699]') + ' transition-colors"><span>' + (on ? 'Aktif' : 'Buka') + '</span><i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"></i></div>';
    b.onclick = () => selectSmdtMenu(m);
    list.appendChild(b);
  });
  lucide.createIcons();
}

function selectSmdtMenu(m) {
  if (m.open) { openReportForm(); return; }
  if (m.view) { if (m.init && typeof window[m.init] === 'function') window[m.init](); showView(m.view); window.scrollTo(0, 0); return; }
  activeSmdtMenu = m.name;
  renderSmdtMenu();
  showToast('Menu ' + m.name + ' dipilih', 'info');
}
