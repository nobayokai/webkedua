// Wali kelas: ketidakhadiran, catatan, keputusan
let A = [];
(async () => { if (await init()) render(); })();
async function render() {
  try {
    const [ss, ab] = (await Promise.all([sb.from('siswa').select('id,nama,nis').eq('kelas', ME.wali).order('nama'),
      sb.from('absen').select('*').eq('tahun', CFG.tahun_ajaran).eq('semester', CFG.semester)])).map(r => chk(r));
    A = ss.map(s => ({ ...s, ...(ab.find(a => a.siswa_id == s.id) || {}) , id: s.id }));
  } catch (e) { return fail(e); }
  const g2 = CFG.semester == 2, KEP = parseInt(ME.wali) == 6 ? ['Lulus', 'Tidak Lulus'] : ['Naik Kelas', 'Tinggal Kelas'];
  $('#content').innerHTML = `<div class="card"><h4>Ketidakhadiran & Catatan — Kelas ${esc(ME.wali)}, Semester ${CFG.semester}</h4>
  <button class="btn" onclick="saveAbsen()">Simpan</button><button class="btn alt" onclick="importAbsen()">Import XLSX</button>
  <button class="btn ghost" onclick="tpl('template_absen',['nis','nama','sakit','izin','alpa'],A.map(s=>[s.nis,s.nama,s.sakit||0,s.izin||0,s.alpa||0]))">Unduh Template</button></div>
  <div class="card"><table class="tb" id="at"><tr><th>Nama</th><th>Sakit</th><th>Izin</th><th>Tanpa Ket.</th><th>Catatan Wali Kelas</th>${g2 ? '<th>Keputusan</th>' : ''}</tr>
  ${A.map(s => `<tr data-s="${s.id}"><td>${esc(s.nama)}</td><td><input type="number" min="0" class="a1" value="${s.sakit || 0}"></td><td><input type="number" min="0" class="a2" value="${s.izin || 0}"></td><td><input type="number" min="0" class="a3" value="${s.alpa || 0}"></td>
  <td><input class="cat" value="${esc(s.catatan)}"></td>${g2 ? `<td><select class="kp"><option value="">-</option>${KEP.map(o => `<option ${s.keputusan == o ? 'selected' : ''}>${o}</option>`).join('')}</select></td>` : ''}</tr>`).join('')}</table></div>`;
}
async function saveAbsen() {
  const rows = [...document.querySelectorAll('#at tr[data-s]')].map(r => ({ siswa_id: +r.dataset.s, tahun: CFG.tahun_ajaran, semester: +CFG.semester,
    sakit: +r.querySelector('.a1').value || 0, izin: +r.querySelector('.a2').value || 0, alpa: +r.querySelector('.a3').value || 0,
    catatan: r.querySelector('.cat').value.trim(), keputusan: r.querySelector('.kp')?.value || '' }));
  try { chk(await sb.from('absen').upsert(rows, { onConflict: 'siswa_id,tahun,semester' })); logit(`Ketidakhadiran kelas ${ME.wali} disimpan`); toast('Ketidakhadiran disimpan'); } catch (e) { fail(e); }
}
function importAbsen() {
  pickX(r => { let n = 0; const T = [...document.querySelectorAll('#at tr[data-s]')];
    r.forEach(x => { const i = A.findIndex(s => String(s.nis) == x.nis); if (i < 0) return; T[i].querySelector('.a1').value = x.sakit || 0; T[i].querySelector('.a2').value = x.izin || 0; T[i].querySelector('.a3').value = x.alpa || 0; n++; });
    toast(n + ' data diimpor. Klik Simpan.'); });
}
