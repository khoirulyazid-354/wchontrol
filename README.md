# WHControl

Warehouse Control System YOFC: MASTER SMDT, Total DO, Total TO, Total BOQ.

## Struktur folder
```
index.html              Kerangka semua halaman
css/style.css           Gaya kustom
js/tailwind-config.js   Warna dan font merek
js/core/ui.js           Notifikasi toast
js/core/csv.js          Pembaca CSV (pemisah koma / titik koma, tanggal, angka)
js/core/util.js         Fungsi bantu (format angka, pemisah Kabel/Perangkat)
js/core/auth.js         Login, logout, sesi
js/core/nav.js          Navigasi halaman dan menu MASTER SMDT
js/pages/do.js          Halaman Total DO (memuat data/do.csv)
js/pages/to.js          Halaman Total TO (menunggu data)
js/pages/boq.js         Halaman Total BOQ (memuat data/boq.csv)
data/do.csv             Data Delivery Order
data/to-data.js         Kerangka data TO
data/boq.csv            Data Bill of Quantity
```

## Login
Username: `ADMIN` atau nama subcont persis seperti di kolom Subcont pada `data/do.csv`. Password: `12345678`.
Daftar subcont dibaca otomatis dari `do.csv` dan `boq.csv`.

## Memperbarui data DO
Ganti `data/do.csv` (Save as CSV dari Excel, encoding UTF-8). Judul kolom harus sama:
Verified, Recon Date, Outbound Date, Outbound Origin Warehouse, Outbound Number, Subcont, City,
Subcont City, Region, Material Code, Material Name, Material Description, YOFC Qty, Subcont Qty.

Kolom wajib terisi: Outbound Date, Outbound Number, Subcont, City, Region, Material Code,
Material Name, Material Description, YOFC Qty. Baris yang tanggal atau Qty-nya tidak terbaca dilewati.

Halaman harus dibuka lewat alamat web (mis. GitHub Pages), bukan klik dua kali pada index.html.

## Memperbarui data BOQ
Ganti `data/boq.csv`. Kolom wajib: Subcont, Region, Site Name, PO Number, Material Name, YOFC Qty.
Kolom lain (City, Site Type, Status, Link Doc, Verified, Recon Date, Subcont Qty) opsional.
Status yang diberi warna: RFSC, BOQ Opname, Redline, FO Cut, Vandalisme (status lain tetap tampil, warna abu-abu).

## Total Kabel dan Perangkat
Material berawalan `CABLE` dihitung sebagai Kabel. Material lain (FAT, FDT, closure, tiang, dll) dihitung sebagai Perangkat.
