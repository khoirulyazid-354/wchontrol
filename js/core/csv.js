/* Pembaca CSV: mengenali pemisah koma / titik koma / tab, tanda kutip, dan BOM UTF-8 */
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const first = text.split(/\r?\n/, 1)[0];
  const sep = [',', ';', '\t'].map(c => [c, first.split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cur = '', q = false;
  const endRow = () => { row.push(cur); cur = ''; if (row.some(c => c.trim() !== '')) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; endRow(); }
    else cur += ch;
  }
  if (cur !== '' || row.length) endRow();
  if (!rows.length) return [];
  const head = rows.shift().map(h => h.trim().toLowerCase());
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

async function loadCSV(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error('File ' + url + ' tidak ditemukan (' + res.status + ')');
  return parseCSV(await res.text());
}

/* Tanggal d.m.yyyy, d/m/yyyy, d-m-yyyy atau yyyy-mm-dd -> { ts, date: 'dd/mm/yyyy', yr } */
function parseDateID(s) {
  let m = String(s).trim().match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/), d, mo, y;
  if (m) { d = +m[1]; mo = +m[2]; y = +m[3]; }
  else if ((m = String(s).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else return null;
  return { ts: new Date(y, mo - 1, d).getTime(), date: String(d).padStart(2, '0') + '/' + String(mo).padStart(2, '0') + '/' + y, yr: String(y) };
}

/* Angka: "18000", "18.000", "18,000" atau "18000,5" */
function parseQty(s) {
  s = String(s).replace(/\s/g, '');
  if (!s) return null;
  s = /^\d{1,3}([.,]\d{3})+$/.test(s) ? s.replace(/[.,]/g, '') : s.replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}
