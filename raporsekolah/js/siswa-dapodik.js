// Admin: import seluruh data siswa dari file Excel Dapodik
const COL = { nama: 1, nis: 2, nisn: 4, kelas: 42 };   // indeks kolom: B, C, E, AQ
let ROWS = [], SKIP = [];
(async () => {
  if (!await init()) return;
  $('#content').innerHTML = `<div class="card"><h4>Import Siswa dari Dapodik</h4>
    <p>Unggah file Excel "Daftar Peserta Didik" hasil unduhan Dapodik. Kolom yang dibaca: <b>B</b> Nama, <b>C</b> NIS (NIPD), <b>E</b> NISN, <b>AQ</b> Kelas (Rombel Saat Ini). Data dimulai tepat setelah baris judul "Nama".</p>
    <label class="ck"><input type="checkbox" id="upd" checked> Perbarui nama, NIS, dan kelas siswa yang sudah ada (dicocokkan lewat NISN, atau NIS bila NISN kosong). Nilai dan riwayat tahfidz mereka tetap terbawa, cocok untuk kenaikan kelas.</label>
    <button class="btn" style="margin-top:10px" onclick="pilih()">Pilih File Excel Dapodik</button></div><div id="hasil"></div>`;
})();

function pilih() {
  const i = document.createElement('input'); i.type = 'file'; i.accept = '.xlsx,.xls';
  i.onchange = async () => { try { await baca(await i.files[0].arrayBuffer()); } catch (e) { fail(e); } };
  i.click();
}
async function baca(ab) {
  const ws = (wb => wb.Sheets[wb.SheetNames[0]])(XLSX.read(ab)), rg = XLSX.utils.decode_range(ws['!ref']);
  const A = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  const g = (r, c) => String(r[c - rg.s.c] ?? '').trim();
  const h = A.findIndex(r => g(r, COL.nama).toLowerCase() == 'nama');
  if (h < 0) return toast('Baris judul "Nama" tidak ditemukan di kolom B. Pastikan file dari Dapodik.', 1);
  const db = await all(() => sb.from('siswa').select('*').order('id'));
  const byNisn = {}, byNis = {}; db.forEach(s => { if (s.nisn) byNisn[s.nisn] = s; if (s.nis) byNis[s.nis] = s; });
  ROWS = []; SKIP = []; const seen = new Set();
  A.slice(h + 1).forEach((r, i) => {
    const o = { nama: g(r, COL.nama), nis: g(r, COL.nis), nisn: g(r, COL.nisn), kelas: g(r, COL.kelas).replace(/^kelas\s*/i, '').toUpperCase(), baris: rg.s.r + h + i + 2 };
    if (!o.nama && !o.kelas) return;
    if (!o.nama || !o.kelas) return SKIP.push({ ...o, alasan: !o.nama ? 'Nama kosong' : 'Kelas kosong' });
    const key = o.nisn || o.nis; if (key && seen.has(key)) return SKIP.push({ ...o, alasan: 'Data ganda di file' }); seen.add(key);
    o.m = (o.nisn && byNisn[o.nisn]) || (o.nis && byNis[o.nis]) || null;
    o.st = !o.m ? 'baru' : (o.m.nama != o.nama || o.m.nis != o.nis || o.m.nisn != o.nisn || o.m.kelas != o.kelas) ? 'ubah' : 'sama';
    ROWS.push(o);
  });
  tampil();
}
function tampil() {
  const n = s => ROWS.filter(r => r.st == s).length, per = {}; ROWS.forEach(r => per[r.kelas] = (per[r.kelas] || 0) + 1);
  const LB = { baru: ['Baru', 'selesai'], ubah: ['Diperbarui', 'proses'], sama: ['Sama', 'belum'] };
  $('#hasil').innerHTML = `<div class="card"><h4>Hasil Pembacaan File</h4>
    <p><span class="chip selesai">${n('baru')} baru</span> <span class="chip proses">${n('ubah')} diperbarui</span> <span class="chip belum">${n('sama')} tidak berubah</span> <span class="chip" style="background:#fde2e2;color:#c0392b">${SKIP.length} dilewati</span></p>
    <p class="muted">Jumlah per kelas: ${Object.keys(per).sort().map(k => `<b>${esc(k)}</b> (${per[k]})`).join(', ') || '-'}</p>
    <p class="muted" style="margin-top:0">Pastikan nama kelas di sini sama dengan kolom "kelas" pada akun guru dan mata pelajaran (misalnya 3A).</p>
    <button class="btn" id="go" onclick="jalankan()" ${n('baru') + n('ubah') ? '' : 'disabled'}>Import ${n('baru')} siswa baru${$('#upd').checked ? ` & perbarui ${n('ubah')}` : ''}</button></div>
    ${SKIP.length ? `<div class="card"><h4>Baris Dilewati</h4><table class="tb"><tr><th>Baris</th><th>Nama</th><th>Kelas</th><th>Alasan</th></tr>${SKIP.slice(0, 50).map(r => `<tr><td>${r.baris}</td><td>${esc(r.nama)}</td><td>${esc(r.kelas)}</td><td>${r.alasan}</td></tr>`).join('')}</table></div>` : ''}
    <div class="card"><h4>Pratinjau ${Math.min(ROWS.length, 100)} dari ${ROWS.length} siswa</h4><table class="tb"><tr><th>Nama</th><th>NIS</th><th>NISN</th><th>Kelas</th><th>Status</th></tr>
    ${ROWS.slice(0, 100).map(r => `<tr><td>${esc(r.nama)}</td><td>${esc(r.nis)}</td><td>${esc(r.nisn)}</td><td>${esc(r.kelas)}${r.st == 'ubah' && r.m.kelas != r.kelas ? ` <small class="muted">(dulu ${esc(r.m.kelas)})</small>` : ''}</td><td><span class="chip ${LB[r.st][1]}">${LB[r.st][0]}</span></td></tr>`).join('')}</table></div>`;
}
async function jalankan() {
  const btn = $('#go'); btn.disabled = true;
  const baru = ROWS.filter(r => r.st == 'baru').map(r => ({ nama: r.nama, nisn: r.nisn, nis: r.nis, kelas: r.kelas }));
  const ubah = $('#upd').checked ? ROWS.filter(r => r.st == 'ubah').map(r => ({ id: r.m.id, nama: r.nama, nisn: r.nisn, nis: r.nis, kelas: r.kelas })) : [];
  try {
    for (let i = 0; i < baru.length; i += 200) { btn.textContent = `Menyimpan siswa baru ${Math.min(i + 200, baru.length)}/${baru.length}…`; chk(await sb.from('siswa').insert(baru.slice(i, i + 200))); }
    for (let i = 0; i < ubah.length; i += 200) { btn.textContent = `Memperbarui siswa ${Math.min(i + 200, ubah.length)}/${ubah.length}…`; chk(await sb.from('siswa').upsert(ubah.slice(i, i + 200), { onConflict: 'id' })); }
    logit(`Import Dapodik: ${baru.length} baru, ${ubah.length} diperbarui`);
    $('#hasil').innerHTML = `<div class="card"><h4>Import Selesai ✅</h4><p>${baru.length} siswa baru ditambahkan, ${ubah.length} siswa diperbarui.</p><a class="btn" href="siswa-dapodik.html">Import Lagi</a> <a class="btn alt" href="dashboard.html">Ke Dashboard</a></div>`;
  } catch (e) { fail(e); btn.disabled = false; btn.textContent = 'Coba lagi'; }
}
