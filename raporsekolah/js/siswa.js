// Wali kelas: data siswa
let S = [];
(async () => { if (await init()) render(); })();
async function render() {
  try { S = chk(await sb.from('siswa').select('*').eq('kelas', ME.wali).order('nama')); } catch (e) { return fail(e); }
  $('#content').innerHTML = `<div class="card"><h4>Data Siswa Kelas ${esc(ME.wali)}</h4><input type="hidden" id="sid">
  <div class="grid"><input id="sn_" placeholder="Nama lengkap"><input id="sb_" placeholder="NISN"><input id="si_" placeholder="NIS"></div>
  <button class="btn" onclick="saveSiswa()">Simpan</button><button class="btn alt" onclick="importSiswa()">Import XLSX</button>
  <button class="btn ghost" onclick="tpl('template_siswa',['nama','nisn','nis'],[['Abizar Arrasyid Ginanjar','3176958633','202501001']])">Unduh Template</button></div>
  <div class="card"><table class="tb"><tr><th>No</th><th>Nama</th><th>NISN</th><th>NIS</th><th></th></tr>
  ${S.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.nama)}</td><td>${esc(s.nisn)}</td><td>${esc(s.nis)}</td><td><button class="btn sm ghost" onclick="editSiswa(${i})">Ubah</button><button class="btn sm del" onclick="delSiswa(${s.id})">Hapus</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Belum ada siswa.</td></tr>'}</table></div>`;
}
function editSiswa(i) { const s = S[i]; sid.value = s.id; sn_.value = s.nama; sb_.value = s.nisn; si_.value = s.nis; scrollTo(0, 0); }
async function saveSiswa() {
  const d = { nama: sn_.value.trim(), nisn: sb_.value.trim(), nis: si_.value.trim() }; if (!d.nama) return toast('Nama siswa wajib diisi', 1);
  try { chk(await (sid.value ? sb.from('siswa').update(d).eq('id', sid.value) : sb.from('siswa').insert({ ...d, kelas: ME.wali }))); render(); } catch (e) { fail(e); }
}
async function delSiswa(id) { if (!confirm('Hapus siswa ini beserta nilainya?')) return; try { chk(await sb.from('siswa').delete().eq('id', id)); render(); } catch (e) { fail(e); } }
function importSiswa() {
  pickX(async rows => {
    try {
      let n = 0; const ins = [];
      for (const r of rows) {
        if (!r.nama) continue; const ex = r.nis && S.find(s => s.nis == r.nis);
        if (ex) chk(await sb.from('siswa').update({ nama: r.nama, nisn: r.nisn || '' }).eq('id', ex.id)); else ins.push({ nama: r.nama, nisn: r.nisn || '', nis: r.nis || '', kelas: ME.wali });
        n++;
      }
      if (ins.length) chk(await sb.from('siswa').insert(ins));
      logit(`Impor ${n} siswa kelas ${ME.wali}`); toast(n + ' siswa diimpor'); render();
    } catch (e) { fail(e); }
  });
}
