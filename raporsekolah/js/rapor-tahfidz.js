// Cetak rapor tahfidz (hanya siswa yang datanya sudah lengkap)
let KLS = [], KL = '', R;
(async () => {
  if (!await init()) return;
  try {
    KLS = ME.role == 'admin' ? [...new Set((await all(() => sb.from('siswa').select('kelas'))).map(x => x.kelas))].sort()
      : (ME.kelas || '').split(',').map(x => x.trim()).filter(Boolean);
  } catch (e) { return fail(e); }
  if (!KLS.length) { $('#content').innerHTML = '<div class="card muted">Belum ada kelas / data siswa.</div>'; return; }
  KL = KLS[0]; show();
})();

async function loadData(kelas) {
  const ta = CFG.tahun_ajaran, sm = +CFG.semester;
  const S = chk(await sb.from('siswa').select('id,nama,nisn,nis').eq('kelas', kelas).order('nama'));
  const TG = chk(await sb.from('tahfidz_target').select('*').eq('kelas', kelas).eq('tahun', ta).eq('semester', sm).maybeSingle());
  const ids = S.map(s => s.id), cur = {}, hist = {}, TSK = {}, TS = {};
  if (ids.length) {
    // semua nilai hafalan siswa: semester ini = cur; nilai terakhir sampai semester ini = hist (rapor berkelanjutan)
    (await all(() => sb.from('tahfidz_nilai').select('*').in('siswa_id', ids))).forEach(r => {
      if (r.tahun == ta && r.semester == sm) (cur[r.siswa_id] ??= {})[r.surah] = r.nilai;
      if (r.tahun < ta || (r.tahun == ta && r.semester <= sm)) {
        const k = r.tahun + '|' + r.semester, o = (hist[r.siswa_id] ??= {}); if (!o[r.surah] || k > o[r.surah].k) o[r.surah] = { k, v: r.nilai };
      }
    });
    chk(await sb.from('tahfidz_target_siswa').select('*').eq('tahun', ta).eq('semester', sm).in('siswa_id', ids)).forEach(r => TSK[r.siswa_id] = r);
    chk(await sb.from('tahfidz_tahsin').select('*').eq('tahun', ta).eq('semester', sm).in('siswa_id', ids)).forEach(r => TS[r.siswa_id] = r);
  }
  const guru = chk(await sb.from('profiles').select('nama,jabatan,kelas')).find(p => /tahfidz/i.test(p.jabatan || '') && (p.kelas || '').split(',').map(x => x.trim()).includes(kelas));
  const logo = chk(await sb.from('setting').select('v').eq('k', 'logo').maybeSingle())?.v || '';
  const TK = ['tajwid', 'tartil', 'fashahah', 'adab'];
  const siswa = S.map(s => {
    const eff = TSK[s.id] || TG, E = eff ? rentang(eff.dari, eff.sampai) : [], c = cur[s.id] || {}, t = TS[s.id] || {};
    // daftar rapor = surah standar (Al-Fatihah..An-Naba') + surah target siswa yang di luar daftar standar
    const posSet = new Set(BASE_POS); if (eff) for (let p = eff.dari; p <= eff.sampai; p++) posSet.add(p);
    const list = [...posSet].sort((a, b) => a - b).map(p => URUTAN[p - 1]), val = {};
    list.forEach(n => { val[n] = c[n] != null ? c[n] : (hist[s.id]?.[n]?.v ?? null); });
    const filled = E.filter(n => c[n] != null).length, tf = TK.filter(k => t[k] != null).length;
    const pen = E.length ? Math.round(E.filter(n => (c[n] || 0) > 0).length * 100 / E.length) : 0;
    const akhirH = E.length ? E.reduce((a, n) => a + (c[n] || 0), 0) / E.length : 0;
    const akhirT = Math.round((TK.reduce((a, k) => a + (t[k] || 0), 0) + pen) / 5);
    const lengkap = E.length > 0 && filled == E.length && tf == 4;
    return { ...s, list, val, t, pen, akhirH, akhirT, lengkap, khusus: !!TSK[s.id],
      status: !E.length ? 'Target belum diisi' : lengkap ? 'Lengkap' : `Hafalan ${filled}/${E.length}, bacaan ${tf}/4` };
  });
  return { cfg: CFG, kelas, guru: guru?.nama || '', logo, siswa };
}
async function show() {
  try { R = await loadData(KL); } catch (e) { return fail(e); }
  const ok = R.siswa.filter(s => s.lengkap).length;
  $('#content').innerHTML = `<div class="card"><select style="max-width:220px;margin-bottom:10px" onchange="KL=this.value;show()">${KLS.map(k => `<option ${k == KL ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select>
  <p class="muted">Rapor Tahfidz Semester ${CFG.semester == 1 ? 'Ganjil' : 'Genap'} TA ${esc(CFG.tahun_ajaran)}. Rapor hanya bisa dicetak jika target hafalan sudah diisi, semua surah target sudah bernilai (0 jika belum hafal), dan keempat nilai bacaan terisi. Atur kertas F4 potret dan aktifkan "Background graphics".</p>
  <button class="btn" onclick="cetak(R.siswa.filter(s=>s.lengkap))" ${ok ? '' : 'disabled'}>Cetak Semua yang Lengkap (${ok})</button></div>
  <div class="card"><table class="tb"><tr><th>No</th><th>Nama</th><th>NIS</th><th>Status</th><th></th></tr>
  ${R.siswa.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.nama)}${s.khusus ? ' <span class="chip proses">khusus</span>' : ''}</td><td>${esc(s.nis)}</td><td><span class="chip ${s.lengkap ? 'selesai' : 'belum'}">${esc(s.status)}</span></td><td><button class="btn sm" ${s.lengkap ? '' : 'disabled'} onclick="cetak([R.siswa[${i}]])">Cetak</button></td></tr>`).join('')}</table></div>`;
}
async function cetak(list) { if (!list.length) return toast('Belum ada data yang lengkap', 1); $('#print').innerHTML = list.map(s => `<div class="sheet">${lembar(s, R)}</div>`).join(''); await document.fonts?.ready; fitSheets(); setTimeout(() => window.print(), 150); }

function lembar(s, d) {
  const c = d.cfg, sm = +c.semester, g = sm == 1 ? 'ganjil' : 'genap', L = s.list, n = L.length, h = Math.ceil(n / 2);
  const cell = i => { if (i >= n) return '<td></td><td></td><td></td><td></td>'; const sr = L[i], v = s.val[sr] ?? null;
    return `<td class="c">${i + 1}</td><td class="sr">${esc(LATIN[sr - 1])} / <span class="ar">${ARAB[sr - 1]}</span></td><td class="c">${v ?? ''}</td><td class="c">${v == null ? '' : predTeks(v)}</td>`; };
  let rows = ''; for (let i = 0; i < h; i++) rows += `<tr>${cell(i)}${cell(i + h)}</tr>`;
  const SK = [['TAJWID', 'tajwid'], ['TARTIL (DENGAN IRAMA)', 'tartil'], ['FASHAHAH', 'fashahah'], ['ADAB DAN HALAQOH', 'adab']];
  const sk = SK.map(([l, k], i) => `<tr><td class="c">${i + 1}</td><td>${l}</td><td class="c">${s.t[k]}</td><td class="c">${predTeks(s.t[k])}</td></tr>`).join('')
    + `<tr><td class="c">5</td><td>PENCAPAIAN TARGET HAFALAN</td><td class="c">${s.pen}</td><td class="c">${predTeks(s.pen)}</td></tr>`;
  const hij = c.tahun_hijriyah ? ' / ' + esc(c.tahun_hijriyah) : '';
  const head2 = '<th rowspan="2">NO</th><th rowspan="2">SURAH</th><th colspan="2">NILAI</th>';
  const CG = '<colgroup>' + ['5%', '21%', '7%', '17%', '5%', '21%', '7%', '17%'].map(w => `<col style="width:${w}">`).join('') + '</colgroup>';
  return `<div class="th ${n > 44 ? 'dense' : ''}">${d.logo ? `<img class="wm" src="${d.logo}" alt="">` : ''}
  <div class="thh"><div class="t1">Rapor Penilaian Akhir Semester</div><div class="t2">TAHFIDZUL QUR'AN</div><div class="t3">${esc((c.sekolah_nama || '').toUpperCase())}</div></div>
  <table class="idt"><tr><td>NAMA</td><td>: ${esc(s.nama)}</td><td>KELAS</td><td>: ${esc(kelasTeks(d.kelas))}</td></tr>
  <tr><td>NIS / NISN</td><td>: ${esc(s.nis)} / ${esc(s.nisn)}</td><td>SEMESTER</td><td>: ${sm} (${sm == 1 ? 'Ganjil' : 'Genap'})</td></tr>
  <tr><td></td><td></td><td>TAHUN</td><td>: ${esc(c.tahun_ajaran)}${hij}</td></tr></table>
  <h5>A. TAHFIDZ (HAFALAN)</h5>
  <table class="tb2 fx">${CG}<tr>${head2}${head2}</tr><tr><th>ANGKA</th><th>PREDIKAT</th><th>ANGKA</th><th>PREDIKAT</th></tr>${rows}
  <tr class="tot"><td colspan="6" class="r">NILAI AKHIR</td><td colspan="2" class="c">${s.akhirH.toFixed(1)}</td></tr></table>
  <h5>B. TAHSINUL QIRO'AH (PENILAIAN BACAAN)</h5>
  <table class="tb2"><tr><th style="width:6%">NO</th><th>SIKAP</th><th style="width:14%">NILAI</th><th style="width:30%">PREDIKAT</th></tr>${sk}
  <tr class="tot"><td colspan="2" class="r">NILAI AKHIR</td><td colspan="2" class="c">${s.akhirT}</td></tr></table>
  <div class="bt"><div><b>PENILAIAN :</b><table class="idt pn"><tr><td>Tahfidz (Hafalan)</td><td>: 50%</td></tr><tr><td>Tahsinul Qiro'ah</td><td>: 50%</td></tr></table></div>
  <div><table class="tb2 pd"><tr><th colspan="3">KETERANGAN PREDIKAT :</th></tr>${PRED.map(p => `<tr><td>${p[1].toUpperCase()}</td><td class="c">${p[3]}</td><td class="c ar">${p[2]}</td></tr>`).join('')}</table></div></div>
  <table class="idt" style="width:auto;margin-top:6px"><tr><td>Diberikan di</td><td>: ${esc(c['tempat_' + g]) || ''}</td></tr><tr><td>Tanggal</td><td>: ${tgl(c['tgl_' + g])}</td></tr></table>
  <div class="sgt"><div><span class="lb">Orang Tua / Wali</span><span class="ln"></span><span class="nm">( <span class="bl"></span> )</span></div>
    <div><span class="lb">Guru Tahfidz</span><span class="ln"></span><span class="nm">( ${esc(d.guru) || '<span class="bl"></span>'} )</span></div></div>
  <div class="sgt mid"><div><span class="lb">Mengetahui,<br>Kepala Sekolah</span><span class="ln"></span><span class="nm">( ${esc(c.kepsek) || '<span class="bl"></span>'} )</span></div></div></div>`;
}
