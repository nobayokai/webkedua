// Guru: KKM & tujuan pembelajaran per mapel (TP dipisah per semester)
(async () => { if (await init()) render(); })();
const SMT = () => +CFG.semester;
const tpRow = (id, t) => `<div class="tprow" data-id="${id}"><input value="${esc(t)}" placeholder="mis. memahami konsep dasar komputer"><button class="btn sm del" onclick="this.parentNode.remove()">✕</button></div>`;
async function render() {
  let M;
  try { M = chk(await (ME.role == 'guru' ? sb.from('mapel').select('*,tp(id,teks,semester)').eq('guru_id', ME.id) : sb.from('mapel').select('*,tp(id,teks,semester)')).order('kelas').order('urutan')); } catch (e) { return fail(e); }
  const nm = SMT() == 1 ? 'Ganjil' : 'Genap';
  $('#content').innerHTML = `<div class="card"><b>Semester aktif: ${nm}.</b> <span class="muted">Daftar tujuan pembelajaran di bawah khusus semester ${nm}. Saat admin mengganti semester aktif, yang tampil adalah TP semester tersebut.</span></div>` +
  (M.map(m => `<div class="card" data-m="${m.id}"><h4>${esc(m.nama)} <small class="muted">• Kelas ${esc(m.kelas)}</small></h4>
  <div style="max-width:180px"><label class="muted">KKM</label><input type="number" min="0" max="100" class="kkm" value="${m.kkm}"></div>
  <label class="muted" style="display:block;margin-top:12px">Tujuan Pembelajaran Semester ${nm}</label><div class="tps">${m.tp.filter(t => t.semester == SMT()).sort((a, b) => a.id - b.id).map(t => tpRow(t.id, t.teks)).join('')}</div>
  <button class="btn sm ghost" onclick="this.previousElementSibling.insertAdjacentHTML('beforeend',tpRow('',''))">+ Tambah TP</button>
  <button class="btn" onclick="saveTP(this.closest('.card'))">Simpan</button></div>`).join('') || '<div class="card muted">Anda belum memiliki mata pelajaran. Hubungi admin.</div>');
}
async function saveTP(c) {
  const id = +c.dataset.m;
  try {
    chk(await sb.from('mapel').update({ kkm: Math.max(0, Math.min(100, +c.querySelector('.kkm').value || 0)) }).eq('id', id));
    const rows = [...c.querySelectorAll('.tprow')].map(r => ({ id: r.dataset.id, teks: r.querySelector('input').value.trim() })).filter(r => r.teks);
    const old = chk(await sb.from('tp').select('id').eq('mapel_id', id).eq('semester', SMT())).map(x => x.id);
    const keep = rows.filter(r => r.id).map(r => +r.id), del = old.filter(x => !keep.includes(x));
    if (del.length) chk(await sb.from('tp').delete().in('id', del));
    for (const r of rows.filter(r => r.id)) chk(await sb.from('tp').update({ teks: r.teks }).eq('id', r.id));
    const nw = rows.filter(r => !r.id).map(r => ({ mapel_id: id, teks: r.teks, semester: SMT() }));
    if (nw.length) chk(await sb.from('tp').insert(nw));
    logit('KKM & TP diperbarui'); toast('KKM & tujuan pembelajaran disimpan'); render();
  } catch (e) { fail(e); }
}
