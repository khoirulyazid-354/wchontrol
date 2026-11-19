/* WHControl - halaman Total BOQ (memuat data/boq.csv) */
const BOQ_PER_PAGE = 20;
const BOQ_REQUIRED = ['subcont', 'region', 'site name', 'po number', 'material name', 'yofc qty'];
const BOQ_STATUS_ORDER = ['RFSC', 'BOQ Opname', 'Redline', 'FO Cut', 'Vandalisme'];
const BOQ_STATUS_STYLE = { 'rfsc': 'bg-lime-50 text-lime-700', 'boq opname': 'bg-sky-50 text-sky-700', 'redline': 'bg-rose-50 text-rose-700', 'fo cut': 'bg-amber-50 text-amber-700', 'vandalisme': 'bg-purple-50 text-purple-700' };
let BOQ_ROWS = [], boqStatus = 'loading', boqError = '';
const boqState = { q: '', sub: '', region: '', status: '', site: '', mat: '', sort: 'site', page: 1 };
const boqIsAdmin = () => !appState.user || appState.user.subconName === 'ADMIN';
const boqScope = () => boqIsAdmin() ? BOQ_ROWS : BOQ_ROWS.filter(r => r.sub === appState.user.subconName);

async function loadBOQ() {
  try {
    const raw = await loadCSV('data/boq.csv');
    if (!raw.length) throw new Error('File boq.csv kosong.');
    const miss = BOQ_REQUIRED.filter(k => !(k in raw[0]));
    if (miss.length) throw new Error('Kolom tidak ditemukan di boq.csv: ' + miss.join(', '));
    BOQ_ROWS = raw.map(r => {
      const qty = parseQty(r['yofc qty']);
      if (qty === null || !r['subcont'] || !r['site name'] || !r['material name']) return null;
      return { sub: r['subcont'], city: r['city'] || '', region: r['region'], site: r['site name'], type: r['site type'] || '', po: r['po number'],
        mat: r['material name'], qty, subQty: parseQty(r['subcont qty'] || ''), status: r['status'] || '', verified: r['verified'] || '', recon: r['recon date'] || '',
        link: /^https?:\/\//i.test(r['link doc'] || '') ? r['link doc'].replace(/"/g, '%22') : '' };
    }).filter(Boolean);
    boqStatus = 'ready';
    sourceDone(BOQ_ROWS.map(r => r.sub));
  } catch (e) {
    boqStatus = 'error'; sourceDone([]);
    boqError = e.message + (location.protocol === 'file:' ? ' Buka lewat alamat web (GitHub Pages), bukan langsung dari file.' : '');
  }
  initBOQ();
}

function initBOQ() {
  const adm = boqIsAdmin(), rows = boqScope();
  const uniq = k => [...new Set(rows.map(r => r[k]))];
  const fill = (id, label, vals) => { document.getElementById(id).innerHTML = '<option value="">' + label + '</option>' + vals.map(v => '<option value="' + escA(v) + '">' + escA(v) + '</option>').join(''); };
  const so = s => { const i = BOQ_STATUS_ORDER.findIndex(x => x.toLowerCase() === s.toLowerCase()); return i < 0 ? 99 : i; };
  fill('boq-sub', 'Semua Subcont', uniq('sub').sort());
  fill('boq-region', 'Semua Region', uniq('region').sort());
  fill('boq-status', 'Semua Status', uniq('status').filter(Boolean).sort((a, b) => so(a) - so(b) || a.localeCompare(b)));
  fill('boq-site', 'Semua Site', uniq('site').sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
  fill('boq-mat', 'Semua Material', uniq('mat').sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
  document.querySelectorAll('[data-admin]').forEach(e => e.classList.toggle('hidden', !adm));
  document.getElementById('boq-subtitle').textContent = 'Bill of Quantity · ' + (adm ? 'ADMIN · Semua Subcont' : appState.user.subconName);
  document.getElementById('boq-s-sub-l').textContent = adm ? 'Subcont' : 'Jenis Material';
  Object.assign(boqState, { q: '', sub: '', region: '', status: '', site: '', mat: '', sort: 'site', page: 1 });
  document.getElementById('boq-q').value = '';
  document.getElementById('boq-sort').value = 'site';
  renderBOQ();
}
function boqSet(k, v) { boqState[k] = v; boqState.page = 1; renderBOQ(); }
function boqPage(d) { boqState.page += d; renderBOQ(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function boqReset() { initBOQ(); }
function boqPick(n) {
  const v = boqState.sub === n ? '' : n;
  document.getElementById('boq-sub').value = v;
  boqSet('sub', v);
}

function renderBOQStatus() {
  const msg = boqStatus === 'loading' ? 'Memuat data BOQ...' : boqError;
  ['boq-s-rows', 'boq-s-site', 'boq-s-cable', 'boq-s-device', 'boq-s-sub'].forEach(id => document.getElementById(id).textContent = '0');
  document.getElementById('boq-recap').classList.add('hidden');
  ['boq-info', 'boq-page', 'boq-thead'].forEach(id => document.getElementById(id)[id === 'boq-thead' ? 'innerHTML' : 'textContent'] = '');
  document.getElementById('boq-prev').disabled = true;
  document.getElementById('boq-next').disabled = true;
  const box = '<div class="py-12 px-4 text-center text-sm ' + (boqStatus === 'error' ? 'text-rose-600' : 'text-slate-500') + '">' + msg + '</div>';
  document.getElementById('boq-tbody').innerHTML = '<tr><td>' + box + '</td></tr>';
  document.getElementById('boq-cards').innerHTML = box;
}

function renderBOQ() {
  const f = boqState, q = f.q.trim().toLowerCase(), adm = boqIsAdmin();
  if (boqStatus !== 'ready') { renderBOQStatus(); return; }
  const r = boqScope().filter(x => (!f.sub || x.sub === f.sub) && (!f.region || x.region === f.region) && (!f.status || x.status === f.status) && (!f.site || x.site === f.site) && (!f.mat || x.mat === f.mat) &&
    (!q || (x.site + ' ' + x.type + ' ' + x.po + ' ' + x.mat + ' ' + x.sub + ' ' + x.city + ' ' + x.region + ' ' + x.status).toLowerCase().includes(q)));
  const byName = (a, b) => a.site.localeCompare(b.site, undefined, { numeric: true }) || a.mat.localeCompare(b.mat, undefined, { numeric: true });
  const sorters = { 'site': byName, 'sub': (a, b) => a.sub.localeCompare(b.sub) || byName(a, b), 'qty-desc': (a, b) => b.qty - a.qty, 'qty-asc': (a, b) => a.qty - b.qty };
  r.sort(sorters[f.sort]);

  const tot = sumQty(r);
  document.getElementById('boq-s-rows').textContent = nf(r.length);
  document.getElementById('boq-s-site').textContent = nf(new Set(r.map(x => x.sub + '|' + x.site)).size);
  document.getElementById('boq-s-cable').textContent = nf(tot.cable);
  document.getElementById('boq-s-device').textContent = nf(tot.device);
  document.getElementById('boq-s-sub').textContent = nf(new Set(r.map(x => adm ? x.sub : x.mat)).size);

  document.getElementById('boq-recap').classList.toggle('hidden', !adm);
  if (adm) {
    const g = {};
    r.forEach(x => { const o = g[x.sub] || (g[x.sub] = { sites: new Set(), rows: 0, cable: 0, device: 0 }); o.sites.add(x.site); o.rows++; if (isCable(x.mat)) o.cable += x.qty; else o.device += x.qty; });
    const list = Object.entries(g).sort((a, b) => b[1].cable - a[1].cable || b[1].device - a[1].device);
    const c = 'py-2.5 px-4 text-right ';
    document.getElementById('boq-recap-body').innerHTML = list.length ? list.map(([n, o]) =>
      '<tr class="hover:bg-[#e6f2f8]/50 cursor-pointer ' + (f.sub === n ? 'bg-[#e6f2f8]' : '') + '" data-sub="' + escA(n) + '" onclick="boqPick(this.dataset.sub)">' +
      '<td class="py-2.5 px-4 font-semibold text-slate-900">' + n + '</td><td class="' + c + 'text-slate-700">' + o.sites.size + '</td><td class="' + c + 'text-slate-700">' + o.rows + '</td>' +
      '<td class="' + c + 'font-bold text-slate-900">' + nf(o.cable) + '</td><td class="' + c + 'font-bold text-slate-900">' + nf(o.device) + '</td></tr>').join('')
      : '<tr><td colspan="5" class="py-6 text-center text-sm text-slate-500">Tidak ada data.</td></tr>';
  }

  const pages = Math.max(1, Math.ceil(r.length / BOQ_PER_PAGE));
  f.page = Math.min(Math.max(1, f.page), pages);
  const off = (f.page - 1) * BOQ_PER_PAGE, slice = r.slice(off, off + BOQ_PER_PAGE);
  document.getElementById('boq-info').textContent = 'Menampilkan ' + slice.length + ' dari ' + nf(r.length) + ' baris data';
  document.getElementById('boq-page').textContent = 'Halaman ' + f.page + ' / ' + pages;
  document.getElementById('boq-prev').disabled = f.page <= 1;
  document.getElementById('boq-next').disabled = f.page >= pages;

  const cols = adm
    ? [['No', 'text-center'], ['Subcont', ''], ['Kota', ''], ['Region', ''], ['Site Name', ''], ['Site Type', ''], ['PO Number', ''], ['Material Name', ''], ['YOFC Qty', 'text-right'], ['Subcont Qty', 'text-right'], ['Status', ''], ['Verified', 'text-center'], ['Recon Date', ''], ['Dokumen', 'text-center']]
    : [['Site Name', ''], ['Site Type', ''], ['PO Number', ''], ['Material', ''], ['Qty', 'text-right'], ['Status', ''], ['Dokumen', 'text-center']];
  document.getElementById('boq-thead').innerHTML = '<tr class="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">' +
    cols.map(c => '<th class="py-3 px-4 font-bold whitespace-nowrap ' + c[1] + '">' + c[0] + '</th>').join('') + '</tr>';

  const empty = '<div class="py-12 text-center text-sm text-slate-500">Tidak ada data yang cocok dengan pencarian atau filter.</div>';
  const td = (v, c) => '<td class="py-3 px-4 ' + (c || '') + '">' + v + '</td>';
  const status = s => s ? '<span class="inline-block px-2 py-0.5 rounded-md text-[10.5px] font-bold whitespace-nowrap ' + (BOQ_STATUS_STYLE[s.toLowerCase()] || 'bg-slate-100 text-slate-600') + '">' + s + '</span>' : '<span class="text-slate-300">-</span>';
  const badge = v => '<span class="inline-block px-2 py-0.5 rounded-md bg-[#e6f2f8] text-[#006699] text-[10.5px] font-bold whitespace-nowrap">' + v + '</span>';
  const doc = x => x.link ? '<a href="' + x.link + '" target="_blank" rel="noopener" class="text-[#006699] font-bold hover:underline">Buka</a>' : '<span class="text-slate-300">-</span>';
  const dash = (v, c) => td(v || '-', (v ? c : 'text-slate-300'));
  document.getElementById('boq-tbody').innerHTML = slice.length ? slice.map((x, i) => '<tr class="hover:bg-slate-50/70">' + (adm
    ? td(off + i + 1, 'text-center text-slate-400') + td(x.sub, 'text-slate-800 whitespace-nowrap') + td(x.city || '-', 'text-slate-800') + td(badge(x.region)) +
      td(x.site, 'font-semibold text-slate-900') + td(x.type || '-', 'text-slate-600 whitespace-nowrap') + td(x.po, 'text-slate-600 whitespace-nowrap') +
      td(x.mat, 'font-semibold text-slate-900 whitespace-nowrap') + td(nf(x.qty), 'text-right font-extrabold text-slate-900') +
      td(x.subQty === null ? '-' : nf(x.subQty), 'text-right ' + (x.subQty === null ? 'text-slate-300' : 'text-slate-900')) + td(status(x.status)) +
      dash(x.verified, 'text-center text-slate-700') + dash(x.recon, 'whitespace-nowrap text-slate-700') + td(doc(x), 'text-center')
    : td(x.site, 'font-semibold text-slate-900') + td(x.type || '-', 'text-slate-600 whitespace-nowrap') + td(x.po, 'text-slate-600 whitespace-nowrap') +
      td(x.mat, 'font-semibold text-slate-900 whitespace-nowrap') + td(nf(x.qty), 'text-right font-extrabold text-slate-900') + td(status(x.status)) + td(doc(x), 'text-center')) + '</tr>').join('')
    : '<tr><td colspan="' + cols.length + '">' + empty + '</td></tr>';

  document.getElementById('boq-cards').innerHTML = slice.length ? slice.map(x =>
    '<div class="bg-white rounded-2xl border border-slate-200 p-4">' +
    '<div class="flex items-start justify-between gap-2"><div class="text-sm font-extrabold text-slate-900">' + x.site + '</div>' + status(x.status) + '</div>' +
    '<div class="mt-0.5 text-xs text-slate-500">' + [x.type, 'PO ' + x.po].filter(Boolean).join(' &middot; ') + '</div>' +
    (adm ? '<div class="mt-1 text-xs text-slate-500">' + x.sub + (x.city ? ' &middot; ' + x.city : '') + ' &middot; ' + x.region + '</div>' : '') +
    '<div class="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between gap-2"><div class="text-sm font-bold text-[#006699]">' + x.mat + '</div><div class="text-lg font-extrabold text-slate-900">' + nf(x.qty) + '</div></div>' +
    (x.link ? '<a href="' + x.link + '" target="_blank" rel="noopener" class="mt-3 inline-block text-xs font-bold text-[#006699] hover:underline">Buka dokumen</a>' : '') + '</div>').join('')
    : empty;
  lucide.createIcons();
}
initBOQ();
loadBOQ();
