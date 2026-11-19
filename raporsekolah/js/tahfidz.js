// Guru Tahfidz: (1) target kelas, (2) siswa khusus, (3) nilai hafalan, (4) nilai bacaan
let KLS = [], KL = '', SS = [], TG = null, TSK = {}, NL = {}, TS = {}, HIS = {}, GP = [];
(async () => {
  if (!await init()) return;
  KLS = (ME.kelas || '').split(',').map(x => x.trim()).filter(Boolean);
  if (!KLS.length) { $('#content').innerHTML = '<div class="card muted">Kolom kelas pada akun Anda masih kosong. Minta admin mengisi kelas yang Anda ajar.</div>'; return; }
  KL = KLS[0]; load();
})();
const num = v => v === '' || v == null ? null : Math.max(0, Math.min(100, Math.round(+v)));

async function load() {
  const ta = CFG.tahun_ajaran, sm = +CFG.semester;
  try {
    SS = chk(await sb.from('siswa').select('id,nama,nis').eq('kelas', KL).order('nama'));
    TG = chk(await sb.from('tahfidz_target').select('*').eq('kelas', KL).eq('tahun', ta).eq('semester', sm).maybeSingle());
    const ids = SS.map(s => s.id); NL = {}; TS = {}; TSK = {}; HIS = {};
    if (ids.length) {
      (await all(() => sb.from('tahfidz_nilai').select('*').in('siswa_id', ids))).forEach(r => {
        if (r.tahun == ta && r.semester == sm) (NL[r.siswa_id] ??= {})[r.surah] = r;
        else if (r.tahun < ta || (r.tahun == ta && r.semester < sm)) { const k = r.tahun + '|' + r.semester, o = (HIS[r.siswa_id] ??= {}); if (!o[r.surah] || k > o[r.surah].k) o[r.surah] = { ...r, k }; }
      });
      chk(await sb.from('tahfidz_tahsin').select('*').eq('tahun', ta).eq('semester', sm).in('siswa_id', ids)).forEach(r => TS[r.siswa_id] = r);
      chk(await sb.from('tahfidz_target_siswa').select('*').eq('tahun', ta).eq('semester', sm).in('siswa_id', ids)).forEach(r => TSK[r.siswa_id] = r);
    }
  } catch (e) { return fail(e); }
  render();
}
function render() {
  const sm = +CFG.semester, L = TG ? rentang(TG.dari, TG.sampai) : [];
  const opt = URUTAN.map((n, i) => `<option value="${i + 1}">${i + 1}. ${LATIN[n - 1]} (${ARAB[n - 1]})</option>`).join('');
  // kolom nilai = gabungan target kelas + target khusus semua siswa
  const pos = new Set(BASE_POS), add = t => { if (t) for (let p = t.dari; p <= t.sampai; p++) pos.add(p); };
  add(TG); SS.forEach(s => add(TSK[s.id]));
  const P = GP = [...pos].sort((a, b) => a - b), inR = (p, t) => t && p >= t.dari && p <= t.sampai;

  const khusus = `<div class="card"><h4>2. Siswa Khusus (target hafalan berbeda)</h4><p class="muted" style="margin-top:0">Centang siswa yang targetnya berbeda dari target kelas, misalnya yang hafalannya sudah melewati An-Naba'. Rapornya otomatis menambah surah tersebut, dan nilai akhir dihitung dari target khususnya. Simpan nilai di langkah 3 terlebih dulu sebelum mengubah bagian ini.</p>
    <div class="hgrid"><table id="kh"><tr><th>Nama Siswa</th><th>Target khusus</th><th>Dari surah</th><th>Sampai surah</th></tr>
    ${SS.map(s => `<tr data-s="${s.id}"><td>${esc(s.nama)}</td><td><input type="checkbox" class="kc" ${TSK[s.id] ? 'checked' : ''} onchange="this.closest('tr').querySelectorAll('select').forEach(x=>x.disabled=!this.checked)"></td>
      <td><select class="kd" ${TSK[s.id] ? '' : 'disabled'}>${opt}</select></td><td><select class="ks" ${TSK[s.id] ? '' : 'disabled'}>${opt}</select></td></tr>`).join('')}</table></div>
    <button class="btn" onclick="saveKhusus()">Simpan Siswa Khusus</button></div>`;
  const grid = `<div class="card"><h4>3. Nilai Hafalan per Surah</h4><p class="muted" style="margin-top:0">Semua surah sampai An-Naba' (dan surah tambahan siswa khusus) ditampilkan sebagai riwayat. Kolom berlatar ungu muda = target semester ini: isi 0 jika belum hafal, kosong berarti belum diinput (rapor belum bisa dicetak). Sel berlatar kuning = nilai dari semester/kelas sebelumnya; ubah angkanya untuk memperbaiki nilai lama (mengosongkan tidak menghapus).</p>
    <div class="hgrid"><table id="hg"><tr><th>Nama Siswa</th>${P.map(p => { const n = URUTAN[p - 1]; return `<th><div class="ar">${ARAB[n - 1]}</div><small>${LATIN[n - 1]}</small></th>`; }).join('')}<th>Rata²</th></tr>
    ${SS.map(s => { const t = TSK[s.id] || TG; return `<tr data-s="${s.id}"><td>${esc(s.nama)}${TSK[s.id] ? ' <span class="chip proses">khusus</span>' : ''}</td>${P.map(p => { const n = URUTAN[p - 1];
      const cu = NL[s.id]?.[n], hi = HIS[s.id]?.[n], tg = inR(p, t), v = cu?.nilai ?? hi?.nilai ?? '', dr = !cu && hi;
      return `<td class="${tg ? 'tgc' : ''} ${dr ? 'hist' : ''}" ${dr ? `title="Riwayat: semester ${hi.semester} TA ${hi.tahun}"` : ''}><input type="number" min="0" max="100" class="hv ${tg ? 'tg' : ''}" data-n="${n}" value="${v}" oninput="recalc()"></td>`; }).join('')}<td class="rt"></td></tr>`; }).join('')}</table></div>
    <button class="btn" onclick="saveNilai()">Simpan Nilai Hafalan</button>
    <button class="btn ghost" onclick="tplHafalan()">Template Excel</button><button class="btn alt" onclick="importHafalan()">Import Excel</button><button class="btn ghost" onclick="lembarHafalan()">Lembar PDF</button></div>`;
  const tahsin = `<div class="card"><h4>4. Penilaian Bacaan (Tahsinul Qiro'ah)</h4><p class="muted" style="margin-top:0">Pencapaian target hafalan dihitung otomatis: persentase surah target siswa yang nilainya lebih dari 0.</p>
    <div class="hgrid"><table id="tg"><tr><th>Nama Siswa</th><th>Tajwid</th><th>Tartil (dengan irama)</th><th>Fashahah</th><th>Adab & Halaqoh</th><th>Pencapaian Target (otomatis)</th><th>Nilai Akhir</th></tr>
    ${SS.map(s => `<tr data-s="${s.id}"><td>${esc(s.nama)}</td>${['tajwid', 'tartil', 'fashahah', 'adab'].map(k => `<td><input type="number" min="0" max="100" class="tv" data-k="${k}" value="${TS[s.id]?.[k] ?? ''}" oninput="recalc()"></td>`).join('')}<td class="pen c"></td><td class="fin c"></td></tr>`).join('')}</table></div>
    <button class="btn" onclick="saveTahsin()">Simpan Nilai Bacaan</button>
    <button class="btn ghost" onclick="tplBacaan()">Template Excel</button><button class="btn alt" onclick="importBacaan()">Import Excel</button><button class="btn ghost" onclick="lembarBacaan()">Lembar PDF</button> <a class="btn alt" href="rapor-tahfidz.html">5. Lanjut ke Cetak Rapor →</a></div>`;
  $('#content').innerHTML = `<div class="card"><h4>Kelas & Semester</h4><div class="grid">
    <div><label class="muted">Kelas yang diinput</label><select id="kls" onchange="KL=this.value;load()">${KLS.map(k => `<option ${k == KL ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></div>
    <div><label class="muted">Semester aktif</label><input disabled value="${sm} (${sm == 1 ? 'Ganjil' : 'Genap'}) • TA ${esc(CFG.tahun_ajaran)}"></div></div></div>
  <div class="card"><h4>1. Target Hafalan Kelas — ${esc(KL)}</h4><div class="grid">
    <div><label class="muted">Dari surah</label><select id="tgd">${opt}</select></div><div><label class="muted">Sampai surah</label><select id="tgs">${opt}</select></div></div>
    <p class="muted" style="margin-top:0">Urutan hafalan: Al-Fatihah, lalu An-Nas, Al-Falaq, Al-Ikhlash, dst. (Juz 30 mundur, dilanjutkan ke surah sebelumnya). Rapor selalu menampilkan semua surah dari Al-Fatihah sampai An-Naba'; nilai akhir hanya dihitung dari target ini.</p>
    <button class="btn" onclick="saveTarget()">Simpan Target</button> ${TG ? `<span class="muted">Target tersimpan: ${L.length} surah</span>` : ''}</div>
  ${!TG ? '<div class="card muted">Simpan target hafalan kelas dulu untuk membuka langkah berikutnya.</div>' : !SS.length ? '<div class="card muted">Belum ada siswa di kelas ini. Wali kelas perlu mengisi data siswa.</div>' : khusus + grid + tahsin}`;
  $('#tgd').value = TG ? TG.dari : 1; $('#tgs').value = TG ? TG.sampai : 38;
  document.querySelectorAll('#kh tr[data-s]').forEach(r => { const t = TSK[r.dataset.s] || TG; r.querySelector('.kd').value = t.dari; r.querySelector('.ks').value = t.sampai; });
  recalc();
}
function recalc() {
  document.querySelectorAll('#hg tr[data-s]').forEach(r => { const v = [...r.querySelectorAll('.hv.tg')].map(i => +i.value || 0); r.querySelector('.rt').textContent = v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : ''; });
  document.querySelectorAll('#tg tr[data-s]').forEach(r => {
    const hv = [...document.querySelectorAll(`#hg tr[data-s="${r.dataset.s}"] .hv.tg`)];
    const pen = hv.length ? Math.round(hv.filter(i => +i.value > 0).length * 100 / hv.length) : 0;
    const t = [...r.querySelectorAll('.tv')].map(i => +i.value || 0);
    r.querySelector('.pen').textContent = pen; r.querySelector('.fin').textContent = Math.round((t.reduce((a, b) => a + b, 0) + pen) / 5);
  });
}
async function saveTarget() {
  const dari = +$('#tgd').value, sampai = +$('#tgs').value;
  if (dari > sampai) return toast('Surah awal harus sebelum atau sama dengan surah akhir (urut hafalan)', 1);
  try {
    chk(await sb.from('tahfidz_target').upsert({ kelas: KL, tahun: CFG.tahun_ajaran, semester: +CFG.semester, dari, sampai }, { onConflict: 'kelas,tahun,semester' }));
    logit(`Target tahfidz kelas ${KL} disimpan`); toast('Target hafalan disimpan'); load();
  } catch (e) { fail(e); }
}
async function saveKhusus() {
  const ta = CFG.tahun_ajaran, sm = +CFG.semester, up = [], del = []; let bad = false;
  document.querySelectorAll('#kh tr[data-s]').forEach(r => {
    const sid = +r.dataset.s;
    if (r.querySelector('.kc').checked) { const dari = +r.querySelector('.kd').value, sampai = +r.querySelector('.ks').value; if (dari > sampai) bad = true; up.push({ siswa_id: sid, tahun: ta, semester: sm, dari, sampai }); }
    else if (TSK[sid]) del.push(TSK[sid].id);
  });
  if (bad) return toast('Ada siswa khusus yang surah awalnya setelah surah akhir', 1);
  try {
    if (del.length) chk(await sb.from('tahfidz_target_siswa').delete().in('id', del));
    if (up.length) chk(await sb.from('tahfidz_target_siswa').upsert(up, { onConflict: 'siswa_id,tahun,semester' }));
    logit(`Target khusus siswa kelas ${KL} disimpan`); toast('Target siswa khusus disimpan'); load();
  } catch (e) { fail(e); }
}
async function saveNilai() {
  const ta = CFG.tahun_ajaran, sm = +CFG.semester, up = [], del = [], koreksi = [];
  document.querySelectorAll('#hg tr[data-s]').forEach(r => r.querySelectorAll('.hv').forEach(i => {
    const sid = +r.dataset.s, n = +i.dataset.n, v = num(i.value), tg = i.classList.contains('tg'), cu = NL[sid]?.[n], hi = HIS[sid]?.[n];
    const baru = { siswa_id: sid, tahun: ta, semester: sm, surah: n, nilai: v };
    if (tg) { if (v !== null) up.push(baru); else if (cu) del.push(cu.id); }       // surah target: tersimpan di semester ini
    else {                                                                           // surah di luar target = riwayat
      if (v === null) return;                                                         // mengosongkan riwayat tidak menghapus data
      if (cu) { if (cu.nilai !== v) up.push(baru); }
      else if (hi) { if (hi.nilai !== v) koreksi.push({ id: hi.id, nilai: v }); }     // perbaikan nilai semester/kelas sebelumnya
      else up.push(baru);
    }
  }));
  try {
    if (del.length) chk(await sb.from('tahfidz_nilai').delete().in('id', del));
    if (up.length) chk(await sb.from('tahfidz_nilai').upsert(up, { onConflict: 'siswa_id,tahun,semester,surah' }));
    for (const k of koreksi) chk(await sb.from('tahfidz_nilai').update({ nilai: k.nilai }).eq('id', k.id));
    logit(`Nilai hafalan kelas ${KL} disimpan`); toast('Nilai hafalan disimpan' + (koreksi.length ? ` (${koreksi.length} perbaikan riwayat)` : '')); load();
  } catch (e) { fail(e); }
}
async function saveTahsin() {
  const rows = [...document.querySelectorAll('#tg tr[data-s]')].map(r => { const o = { siswa_id: +r.dataset.s, tahun: CFG.tahun_ajaran, semester: +CFG.semester };
    r.querySelectorAll('.tv').forEach(i => o[i.dataset.k] = num(i.value)); return o; });
  try { chk(await sb.from('tahfidz_tahsin').upsert(rows, { onConflict: 'siswa_id,tahun,semester' })); logit(`Nilai bacaan tahfidz kelas ${KL} disimpan`); toast('Nilai bacaan disimpan'); load(); } catch (e) { fail(e); }
}

// ---------- Template Excel & import ----------
const hdrSurah = p => { const n = URUTAN[p - 1]; return `${n} ${LATIN[n - 1]}`; };   // contoh: "114 An-Nas" (angka = nomor surah mushaf)
function tplHafalan() {
  tpl(`template_hafalan_${KL}`, ['nis', 'nama', ...GP.map(hdrSurah)],
    SS.map(s => [s.nis, s.nama, ...GP.map(p => { const n = URUTAN[p - 1]; return NL[s.id]?.[n]?.nilai ?? HIS[s.id]?.[n]?.nilai ?? ''; })]));
}
function importHafalan() {
  pickX(rows => {
    let n = 0;
    rows.forEach(r => {
      const s = SS.find(x => r.nis && String(x.nis) == r.nis), tr = s && document.querySelector(`#hg tr[data-s="${s.id}"]`); if (!tr) return;
      Object.keys(r).forEach(h => { const m = h.match(/^(\d+)\s/); if (!m || r[h] === '') return;
        const inp = tr.querySelector(`.hv[data-n="${m[1]}"]`), v = num(r[h]); if (!inp || v === null) return; inp.value = v; n++; });
    });
    recalc(); toast(`${n} nilai diimpor. Klik Simpan Nilai Hafalan.`);
  });
}
function tplBacaan() {
  tpl(`template_bacaan_${KL}`, ['nis', 'nama', 'tajwid', 'tartil', 'fashahah', 'adab'], SS.map(s => [s.nis, s.nama, ...['tajwid', 'tartil', 'fashahah', 'adab'].map(k => TS[s.id]?.[k] ?? '')]));
}
function importBacaan() {
  pickX(rows => {
    let n = 0;
    rows.forEach(r => {
      const s = SS.find(x => r.nis && String(x.nis) == r.nis), tr = s && document.querySelector(`#tg tr[data-s="${s.id}"]`); if (!tr) return;
      ['tajwid', 'tartil', 'fashahah', 'adab'].forEach(k => { const v = num(r[k] ?? ''), inp = tr.querySelector(`.tv[data-k="${k}"]`); if (inp && v !== null) { inp.value = v; n++; } });
    });
    recalc(); toast(`${n} nilai diimpor. Klik Simpan Nilai Bacaan.`);
  });
}

// ---------- Lembar penilaian kosong (cetak / Simpan sebagai PDF) ----------
function lembar(judul, thead, rows) {
  const sm = +CFG.semester;
  $('#print').innerHTML = `<div class="form-land"><h3>${judul}</h3><p>Kelas ${esc(KL)} • Semester ${sm} (${sm == 1 ? 'Ganjil' : 'Genap'}) • TA ${esc(CFG.tahun_ajaran)} • Guru: ${esc(ME.nama)} • Nilai 0–100</p>
    <table class="fm"><thead><tr><th>No</th><th>Nama Siswa</th><th>NIS</th>${thead}</tr></thead><tbody>${rows}</tbody></table></div>`;
  setTimeout(() => {
    // ukuran kertas F4 landscape (330 x 215 mm); style ini ditaruh terakhir agar mengalahkan aturan F4 potret rapor
    const st = document.createElement('style'); st.textContent = '@media print{@page{size:330mm 215mm;margin:8mm}}'; document.head.appendChild(st);
    addEventListener('afterprint', () => st.remove(), { once: true }); window.print();
  }, 250);
}
function lembarHafalan() {
  lembar('LEMBAR PENILAIAN HAFALAN TAHFIDZ (nilai yang sudah ada ikut tercetak)', GP.map(p => `<th class="v"><span>${hdrSurah(p).replace(' ', '. ')}</span></th>`).join(''),
    SS.map((s, i) => `<tr><td>${i + 1}</td><td class="nm">${esc(s.nama)}</td><td>${esc(s.nis)}</td>${GP.map(p => { const n = URUTAN[p - 1]; return `<td>${NL[s.id]?.[n]?.nilai ?? HIS[s.id]?.[n]?.nilai ?? ''}</td>`; }).join('')}</tr>`).join(''));
}
function lembarBacaan() {
  lembar("LEMBAR PENILAIAN BACAAN (TAHSINUL QIRO'AH)", '<th>Tajwid</th><th>Tartil (dengan irama)</th><th>Fashahah</th><th>Adab & Halaqoh</th><th>Catatan</th>',
    SS.map((s, i) => `<tr><td>${i + 1}</td><td class="nm">${esc(s.nama)}</td><td>${esc(s.nis)}</td>${['tajwid', 'tartil', 'fashahah', 'adab'].map(k => `<td>${TS[s.id]?.[k] ?? ''}</td>`).join('')}<td></td></tr>`).join(''));
}
