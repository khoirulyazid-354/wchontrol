/* WHControl - halaman Total DO (filter, pencarian, rekap, tabel) */
const DO_PER_PAGE = 20;
const doIsAdmin = () => !appState.user || appState.user.subconName === 'ADMIN';
const doScope = () => doIsAdmin() ? DO_ROWS : DO_ROWS.filter(r => r.sub === appState.user.subconName);
const doState = { q: '', sub: '', region: '', mat: '', year: '', sort: 'date-desc', page: 1 };

/* Memuat data/do.csv (judul kolom sama dengan file Excel asli) */
let DO_ROWS = [], doStatus = 'loading', doError = '', doSkipped = 0;
const DO_REQUIRED = ['outbound date', 'outbound number', 'subcont', 'city', 'region', 'material code', 'material name', 'material description', 'yofc qty'];
async function loadDO() {
  try {
    const raw = await loadCSV('data/do.csv');
    if (!raw.length) throw new Error('File do.csv kosong.');
    const miss = DO_REQUIRED.filter(k => !(k in raw[0]));
    if (miss.length) throw new Error('Kolom tidak ditemukan di do.csv: ' + miss.join(', '));
    DO_ROWS = raw.map(r => {
      const dt = parseDateID(r['outbound date']), qty = parseQty(r['yofc qty']);
      if (!dt || qty === null || !r['subcont'] || !r['outbound number']) { doSkipped++; return null; }
      const sq = parseQty(r['subcont qty'] || '');
      return { ts: dt.ts, date: dt.date, yr: dt.yr, no: r['outbound number'], sub: r['subcont'], city: r['city'], region: r['region'],
        code: r['material code'], mat: r['material name'], desc: r['material description'], qty,
        wh: r['outbound origin warehouse'] || '', verified: r['verified'] || '', recon: r['recon date'] || '', subQty: sq, link: /^https?:\/\//i.test(r['link doc'] || '') ? r['link doc'].replace(/"/g, '%22') : '' };
    }).filter(Boolean);
    doStatus = 'ready';
    sourceDone(DO_ROWS.map(r => r.sub));
  } catch (e) {
    doStatus = 'error'; sourceDone([]);
    doError = e.message + (location.protocol === 'file:' ? ' Buka lewat alamat web (GitHub Pages), bukan langsung dari file.' : '');
  }
  initDO();
}

function renderDOStatus() {
  const msg = doStatus === 'loading' ? 'Memuat data DO...' : doError;
  ['do-s-rows', 'do-s-out', 'do-s-cable', 'do-s-device', 'do-s-sub'].forEach(id => document.getElementById(id).textContent = '0');
  document.getElementById('do-recap').classList.add('hidden');
  document.getElementById('do-info').textContent = '';
  document.getElementById('do-page').textContent = '';
  document.getElementById('do-prev').disabled = true;
  document.getElementById('do-next').disabled = true;
  document.getElementById('do-thead').innerHTML = '';
  const box = '<div class="py-12 px-4 text-center text-sm ' + (doStatus === 'error' ? 'text-rose-600' : 'text-slate-500') + '">' + msg + '</div>';
  document.getElementById('do-tbody').innerHTML = '<tr><td>' + box + '</td></tr>';
  document.getElementById('do-cards').innerHTML = box;
}

function initDO() {
  const adm = doIsAdmin(), rows = doScope();
  const uniq = k => [...new Set(rows.map(r => r[k]))];
  const escA = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const fill = (id, label, vals) => { document.getElementById(id).innerHTML = '<option value="">' + label + '</option>' + vals.map(v => '<option value="' + escA(v) + '">' + escA(v) + '</option>').join(''); };
  fill('do-sub', 'Semua Subcont', uniq('sub').sort());
  fill('do-region', 'Semua Region', uniq('region').sort());
  fill('do-mat', 'Semua Material', uniq('mat').sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
  fill('do-year', 'Semua Tahun', uniq('yr').sort().reverse());
  document.querySelectorAll('[data-admin]').forEach(e => e.classList.toggle('hidden', !adm));
  document.getElementById('do-subtitle').textContent = 'Delivery Order · ' + (adm ? 'ADMIN · Semua Subcont' : appState.user.subconName);
  document.getElementById('do-s-sub-l').textContent = adm ? 'Subcont' : 'Jenis Material';
  Object.assign(doState, { q: '', sub: '', region: '', mat: '', year: '', sort: 'date-desc', page: 1 });
  document.getElementById('do-q').value = '';
  document.getElementById('do-sort').value = 'date-desc';
  renderDO();
}
function doSet(k, v) { doState[k] = v; doState.page = 1; renderDO(); }
function doPage(d) { doState.page += d; renderDO(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function doReset() { initDO(); }
function doPick(n) {
  const v = doState.sub === n ? '' : n;
  document.getElementById('do-sub').value = v;
  doSet('sub', v);
}

function renderDO() {
  const f = doState, q = f.q.trim().toLowerCase(), adm = doIsAdmin();
  if (doStatus !== 'ready') { renderDOStatus(); return; }
  let r = doScope().filter(x => (!f.sub || x.sub === f.sub) && (!f.region || x.region === f.region) && (!f.mat || x.mat === f.mat) && (!f.year || x.yr === f.year) &&
    (!q || (x.no + ' ' + x.sub + ' ' + x.city + ' ' + x.region + ' ' + x.mat + ' ' + x.code + ' ' + x.desc + ' ' + x.date).toLowerCase().includes(q)));
  const sorters = { 'date-desc': (a, b) => b.ts - a.ts, 'date-asc': (a, b) => a.ts - b.ts, 'qty-desc': (a, b) => b.qty - a.qty, 'qty-asc': (a, b) => a.qty - b.qty, 'sub': (a, b) => a.sub.localeCompare(b.sub) || b.ts - a.ts };
  r.sort(sorters[f.sort]);

  document.getElementById('do-s-rows').textContent = nf(r.length);
  document.getElementById('do-s-out').textContent = nf(new Set(r.map(x => x.no)).size);
  const tot = sumQty(r);
  document.getElementById('do-s-cable').textContent = nf(tot.cable);
  document.getElementById('do-s-device').textContent = nf(tot.device);
  document.getElementById('do-s-sub').textContent = nf(new Set(r.map(x => adm ? x.sub : x.mat)).size);

  const recap = document.getElementById('do-recap');
  recap.classList.toggle('hidden', !adm);
  if (adm) {
    const g = {};
    r.forEach(x => { const o = g[x.sub] || (g[x.sub] = { out: new Set(), rows: 0, cable: 0, device: 0 }); o.out.add(x.no); o.rows++; if (isCable(x.mat)) o.cable += x.qty; else o.device += x.qty; });
    const list = Object.entries(g).sort((a, b) => b[1].cable - a[1].cable || b[1].device - a[1].device);
    const c = 'py-2.5 px-4 text-right ';
    document.getElementById('do-recap-body').innerHTML = list.length ? list.map(([n, o]) =>
      '<tr class="hover:bg-[#e6f2f8]/50 cursor-pointer ' + (f.sub === n ? 'bg-[#e6f2f8]' : '') + '" data-sub="' + n + '" onclick="doPick(this.dataset.sub)">' +
      '<td class="py-2.5 px-4 font-semibold text-slate-900">' + n + '</td><td class="' + c + 'text-slate-700">' + o.out.size + '</td><td class="' + c + 'text-slate-700">' + o.rows + '</td>' +
      '<td class="' + c + 'font-bold text-slate-900">' + nf(o.cable) + '</td><td class="' + c + 'font-bold text-slate-900">' + nf(o.device) + '</td></tr>').join('')
      : '<tr><td colspan="5" class="py-6 text-center text-sm text-slate-500">Tidak ada data.</td></tr>';
  }

  const pages = Math.max(1, Math.ceil(r.length / DO_PER_PAGE));
  f.page = Math.min(Math.max(1, f.page), pages);
  const off = (f.page - 1) * DO_PER_PAGE, slice = r.slice(off, off + DO_PER_PAGE);
  document.getElementById('do-info').textContent = 'Menampilkan ' + slice.length + ' dari ' + nf(r.length) + ' baris data';
  document.getElementById('do-page').textContent = 'Halaman ' + f.page + ' / ' + pages;
  document.getElementById('do-prev').disabled = f.page <= 1;
  document.getElementById('do-next').disabled = f.page >= pages;

  const cols = adm
    ? [['No', 'text-center'], ['Tanggal Outbound', ''], ['Outbound No.', ''], ['Subcont', ''], ['Kota', ''], ['Region', ''], ['Gudang Asal', ''], ['Kode Material', ''], ['Nama Material', ''], ['Deskripsi Material', ''], ['YOFC Qty', 'text-right'], ['Subcont Qty', 'text-right'], ['Verified', 'text-center'], ['Recon Date', ''], ['Dokumen', 'text-center']]
    : [['Tanggal', ''], ['Outbound No.', ''], ['Kota / Region', ''], ['Material', ''], ['Qty', 'text-right'], ['Dokumen', 'text-center']];
  document.getElementById('do-thead').innerHTML = '<tr class="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">' +
    cols.map(c => '<th class="py-3 px-4 font-bold whitespace-nowrap ' + c[1] + '">' + c[0] + '</th>').join('') + '</tr>';

  const empty = '<div class="py-12 text-center text-sm text-slate-500">Tidak ada data yang cocok dengan pencarian atau filter.</div>';
  const td = (v, c) => '<td class="py-3 px-4 ' + (c || '') + '">' + v + '</td>';
  const doc = x => x.link ? '<a href="' + x.link + '" target="_blank" rel="noopener" class="text-[#006699] font-bold hover:underline">Buka</a>' : '<span class="text-slate-300">-</span>';
  const badge = v => '<span class="inline-block px-2 py-0.5 rounded-md bg-[#e6f2f8] text-[#006699] text-[10.5px] font-bold whitespace-nowrap">' + v + '</span>';
  document.getElementById('do-tbody').innerHTML = slice.length ? slice.map((x, i) => '<tr class="hover:bg-slate-50/70">' + (adm
    ? td(off + i + 1, 'text-center text-slate-400') + td(x.date, 'whitespace-nowrap text-slate-600') + td(x.no, 'font-semibold text-slate-900 whitespace-nowrap') +
      td(x.sub, 'text-slate-800 whitespace-nowrap') + td(x.city, 'text-slate-800') + td(badge(x.region)) + td(x.wh || '-', 'whitespace-nowrap text-slate-600') +
      td(x.code, 'text-slate-600 whitespace-nowrap') + td(x.mat, 'font-semibold text-slate-900 whitespace-nowrap') + td(x.desc || '-', 'text-slate-600 whitespace-nowrap') +
      td(nf(x.qty), 'text-right font-extrabold text-slate-900') + td(x.subQty === null ? '-' : nf(x.subQty), 'text-right ' + (x.subQty === null ? 'text-slate-300' : 'text-slate-900')) + td(x.verified || '-', 'text-center ' + (x.verified ? 'text-slate-700' : 'text-slate-300')) + td(x.recon || '-', 'whitespace-nowrap ' + (x.recon ? 'text-slate-700' : 'text-slate-300')) + td(doc(x), 'text-center')
    : td(x.date, 'whitespace-nowrap text-slate-600') + td(x.no, 'font-semibold text-slate-900') +
      td('<div class="text-slate-800">' + x.city + '</div>' + badge(x.region)) +
      td('<div class="font-semibold text-slate-900">' + x.mat + '</div><div class="text-[11px] text-slate-500">' + x.code + '</div>') +
      td(nf(x.qty), 'text-right font-extrabold text-slate-900 whitespace-nowrap') + td(doc(x), 'text-center')) + '</tr>').join('')
    : '<tr><td colspan="' + cols.length + '">' + empty + '</td></tr>';

  document.getElementById('do-cards').innerHTML = slice.length ? slice.map(x =>
    '<div class="bg-white rounded-2xl border border-slate-200 p-4">' +
    '<div class="flex items-center justify-between gap-2 text-[11px] text-slate-500"><span>' + x.date + '</span><span class="font-semibold text-slate-700 truncate">' + x.no + '</span></div>' +
    (adm ? '<div class="mt-2 text-sm font-extrabold text-slate-900">' + x.sub + '</div>' : '') +
    '<div class="' + (adm ? 'mt-0.5' : 'mt-2') + ' text-xs text-slate-500">' + x.city + ' &middot; ' + x.region + (adm && x.wh ? ' &middot; ' + x.wh : '') + '</div>' +
    '<div class="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between gap-2"><div><div class="text-sm font-bold text-[#006699]">' + x.mat + '</div><div class="text-[11px] text-slate-400">' + x.code + (adm && x.desc ? ' &middot; ' + x.desc : '') + '</div></div><div class="text-lg font-extrabold text-slate-900">' + nf(x.qty) + '</div></div>' + (x.link ? '<a href="' + x.link + '" target="_blank" rel="noopener" class="mt-3 inline-block text-xs font-bold text-[#006699] hover:underline">Buka dokumen</a>' : '') + '</div>').join('')
    : empty;
  lucide.createIcons();
}
initDO();
loadDO();
