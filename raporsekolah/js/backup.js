// Admin: backup & restore JSON
(async () => {
  if (!await init()) return;
  $('#content').innerHTML = `<div class="card"><h4>Backup Data</h4><p>Unduh seluruh data (guru, siswa, mapel, nilai, dll.) dalam format JSON.</p><button class="btn" onclick="doBackup()">Unduh Backup JSON</button></div>
  <div class="card"><h4>Restore Data</h4><p class="muted">Peringatan: restore menimpa SELURUH data yang ada. Akun login (Supabase Auth) tidak ikut dipulihkan, jadi restore paling cocok di project yang sama; profil guru hanya dipulihkan bila akun loginnya masih ada.</p><button class="btn alt" onclick="doRestore()">Pilih File Backup & Restore</button></div>`;
})();
async function doBackup() {
  try {
    const d = { meta: { dibuat: new Date().toISOString(), app: 'rapor-supabase' } };
    for (const t of ['profiles', 'setting', 'mapel', 'tp', 'siswa', 'nilai', 'absen', 'log']) d[t] = await all(() => sb.from(t).select('*').order(t == 'setting' ? 'k' : 'id'));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' }));
    a.download = 'backup_rapor_' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
  } catch (e) { fail(e); }
}
function doRestore() {
  const i = document.createElement('input'); i.type = 'file'; i.accept = '.json';
  i.onchange = async () => {
    if (!confirm('Yakin menimpa semua data dengan file ini?')) return;
    try { const payload = JSON.parse(await i.files[0].text()); chk(await sb.rpc('restore_data', { payload })); toast('Restore berhasil'); setTimeout(() => location.reload(), 1200); }
    catch (e) { fail(e); }
  };
  i.click();
}
