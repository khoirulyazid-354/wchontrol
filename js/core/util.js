/* Fungsi bantu bersama */
const nf = n => n.toLocaleString('id-ID');
const escA = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
/* Kabel = material berawalan CABLE; selain itu dihitung sebagai perangkat */
const isCable = name => /^cable/i.test(String(name).trim());
function sumQty(rows) {
  let cable = 0, device = 0;
  rows.forEach(r => { if (isCable(r.mat)) cable += r.qty; else device += r.qty; });
  return { cable, device };
}
