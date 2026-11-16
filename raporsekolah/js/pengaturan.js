// Admin: tahun ajaran, semester, data sekolah
const SF = [['tahun_ajaran', 'Tahun Ajaran', 'text', '2025/2026'], ['semester', 'Semester Aktif', 'sel'],
  ['tgl_ganjil', 'Tanggal Pengambilan Rapor (Ganjil)', 'date'], ['tempat_ganjil', 'Tempat Pengambilan Rapor (Ganjil)', 'text'],
  ['tgl_genap', 'Tanggal Pengambilan Rapor (Genap)', 'date'], ['tempat_genap', 'Tempat Pengambilan Rapor (Genap)', 'text'],
  ['sekolah_nama', 'Nama Sekolah', 'text'], ['npsn', 'NPSN', 'text'], ['alamat', 'Alamat Sekolah', 'text'], ['kepsek', 'Nama Kepala Sekolah', 'text']];
(async () => {
  if (!await init()) return;
  $('#content').innerHTML = `<div class="card"><h4>Tahun Ajaran, Semester & Data Sekolah</h4><div class="grid">
  ${SF.map(([k, l, t, ph]) => `<div><label class="muted">${l}</label>${t == 'sel' ? `<select id="s_${k}"><option value="1">1 - Ganjil</option><option value="2">2 - Genap</option></select>` : `<input id="s_${k}" type="${t}" placeholder="${ph || ''}">`}</div>`).join('')}</div>
  <button class="btn" onclick="saveSet()">Simpan Pengaturan</button></div>`;
  SF.forEach(([k]) => $('#s_' + k).value = CFG[k] || '');
})();
async function saveSet() {
  try {
    chk(await sb.from('setting').upsert(SF.map(([k]) => ({ k, v: $('#s_' + k).value.trim() })), { onConflict: 'k' }));
    SF.forEach(([k]) => CFG[k] = $('#s_' + k).value.trim()); headInfo(); logit('Pengaturan sekolah & tahun ajaran diperbarui'); toast('Pengaturan disimpan');
  } catch (e) { fail(e); }
}
