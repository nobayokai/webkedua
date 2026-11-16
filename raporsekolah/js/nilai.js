// Guru: input nilai + ceklis tujuan pembelajaran
let MM = [], NG;
(async () => {
  if (!await init()) return;
  try {
    MM = chk(await (ME.role == 'guru' ? sb.from('mapel').select('id,nama,kelas,kkm').eq('guru_id', ME.id) : sb.from('mapel').select('id,nama,kelas,kkm')).order('kelas').order('urutan'));
  } catch (e) { return fail(e); }
  if (!MM.length) { $('#content').innerHTML = '<div class="card muted">Belum ada mata pelajaran.</div>'; return; }
  const sel = new URLSearchParams(location.search).get('m') || MM[0].id;
  $('#content').innerHTML = `<div class="card"><select id="ms" onchange="loadNilai(this.value)">${MM.map(m => `<option value="${m.id}" ${m.id == sel ? 'selected' : ''}>${esc(m.nama)} — Kelas ${esc(m.kelas)}</option>`).join('')}</select>
  <div style="margin-top:10px"><button class="btn" onclick="saveNilai()">Simpan Nilai</button><button class="btn alt" onclick="importNilai()">Import XLSX</button>
  <button class="btn ghost" onclick="tplNilai()">Unduh Template</button><button class="btn ghost" onclick="autoTP()">Centang Otomatis (≥ KKM)</button></div>
  <p class="muted" style="margin:8px 0 0">Kolom kiri: TP tercapai optimal. Kolom kanan: TP perlu peningkatan.</p></div><div id="ng" class="card"></div>`;
  loadNilai(sel);
})();
async function loadNilai(id) {
  try {
    const m = MM.find(x => x.id == id);
    const [tps, ss, nl] = (await Promise.all([
      sb.from('tp').select('id,teks').eq('mapel_id', id).order('id'),
      sb.from('siswa').select('id,nama,nisn,nis').eq('kelas', m.kelas).order('nama'),
      sb.from('nilai').select('*').eq('mapel_id', id).eq('tahun', CFG.tahun_ajaran).eq('semester', CFG.semester)])).map(r => chk(r));
    NG = { m, tps, ss: ss.map(s => { const n = nl.find(x => x.siswa_id == s.id) || {}; return { ...s, nilai: n.nilai, capai: n.tp_capai || [], perlu: n.tp_perlu || [] }; }) };
  } catch (e) { return fail(e); }
  if (!NG.ss.length) { $('#ng').innerHTML = '<p class="muted">Belum ada siswa di kelas ini. Wali kelas perlu mengisi data siswa.</p>'; return; }
  $('#ng').innerHTML = `<table class="tb"><tr><th>No</th><th>Nama Siswa</th><th>NISN / NIS</th><th>Nilai</th><th>TP Tercapai Optimal</th><th>TP Perlu Peningkatan</th></tr>
  ${NG.ss.map((s, i) => `<tr data-s="${s.id}"><td>${i + 1}</td><td>${esc(s.nama)}</td><td>${esc(s.nisn)} / ${esc(s.nis)}</td>
  <td style="width:90px"><input type="number" min="0" max="100" class="nv" value="${s.nilai ?? ''}"></td>
  <td>${NG.tps.map(t => `<label class="ck"><input type="checkbox" data-k="c" data-t="${t.id}" ${has(s.capai, t.id) ? 'checked' : ''} onchange="tpChg(this)"> ${esc(t.teks)}</label>`).join('') || '<span class="muted">Belum ada TP</span>'}</td>
  <td>${NG.tps.map(t => `<label class="ck"><input type="checkbox" data-k="p" data-t="${t.id}" ${has(s.perlu, t.id) ? 'checked' : ''} ${has(s.capai, t.id) ? 'disabled' : ''}> ${esc(t.teks)}</label>`).join('')}</td></tr>`).join('')}</table>`;
}
function tpChg(el) { const p = el.closest('tr').querySelector(`[data-k="p"][data-t="${el.dataset.t}"]`); p.disabled = el.checked; if (el.checked) p.checked = false; }
async function saveNilai() {
  const rows = [...document.querySelectorAll('#ng tr[data-s]')].map(r => { const v = r.querySelector('.nv').value;
    return { mapel_id: NG.m.id, siswa_id: +r.dataset.s, tahun: CFG.tahun_ajaran, semester: +CFG.semester, nilai: v === '' ? null : Math.max(0, Math.min(100, Math.round(+v))),
      tp_capai: [...r.querySelectorAll('[data-k="c"]:checked')].map(x => +x.dataset.t), tp_perlu: [...r.querySelectorAll('[data-k="p"]:checked')].map(x => +x.dataset.t) }; });
  try { chk(await sb.from('nilai').upsert(rows, { onConflict: 'mapel_id,siswa_id,tahun,semester' })); logit(`Nilai ${NG.m.nama} kelas ${NG.m.kelas} disimpan`); toast('Nilai disimpan'); } catch (e) { fail(e); }
}
function autoTP() {
  const kkm = +NG.m.kkm;
  document.querySelectorAll('#ng tr[data-s]').forEach(r => { const v = r.querySelector('.nv').value; if (v === '') return; const ok = +v >= kkm;
    r.querySelectorAll('[data-k="c"]').forEach(c => { c.checked = ok; tpChg(c); }); r.querySelectorAll('[data-k="p"]').forEach(p => { if (!ok) p.checked = true; }); });
}
function importNilai() {
  pickX(r => { let n = 0; const I = document.querySelectorAll('#ng .nv');
    r.forEach(x => { const k = x.nis || x.nisn; const s = NG.ss.findIndex(s => String(s.nis) == k || String(s.nisn) == k); if (s < 0) return; I[s].value = x.nilai; n++; });
    toast(n + ' nilai diimpor. Klik Simpan Nilai.'); });
}
function tplNilai() { tpl('template_nilai', ['nis', 'nama', 'nilai'], NG.ss.map(s => [s.nis, s.nama, s.nilai ?? ''])); }
