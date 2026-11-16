// Cetak rapor: semester 1 (kiri) + semester 2 (kanan)
let R, KL = '';
(async () => {
  if (!await init()) return;
  try {
    if (ME.role == 'admin') {
      const L = [...new Set((await all(() => sb.from('siswa').select('kelas'))).map(x => x.kelas))].sort();
      if (!L.length) { $('#content').innerHTML = '<div class="card muted">Belum ada data siswa.</div>'; return; }
      KL = L[0]; window.KLS = L;
    } else KL = ME.wali;
    show();
  } catch (e) { fail(e); }
})();

async function loadRapor(kelas) {
  const ta = CFG.tahun_ajaran;
  const M = chk(await sb.from('mapel').select('id,nama,kkm').eq('kelas', kelas).order('urutan').order('id'));
  const S = chk(await sb.from('siswa').select('id,nama,nisn,nis').eq('kelas', kelas).order('nama'));
  const ids = M.map(m => m.id), sids = S.map(s => s.id), TP = {}, N = {}, A = {};
  if (ids.length) {
    (await all(() => sb.from('tp').select('id,teks').in('mapel_id', ids))).forEach(t => TP[t.id] = t.teks);
    (await all(() => sb.from('nilai').select('*').eq('tahun', ta).in('mapel_id', ids))).forEach(n => { ((N[n.semester] ??= {})[n.siswa_id] ??= {})[n.mapel_id] = n; });
  }
  if (sids.length) (await all(() => sb.from('absen').select('*').eq('tahun', ta).in('siswa_id', sids))).forEach(a => { (A[a.semester] ??= {})[a.siswa_id] = a; });
  const W = chk(await sb.from('profiles').select('nama,kelas,jabatan')).find(p => /wali/i.test(p.jabatan || '') && (p.kelas || '').split(',')[0].trim() == kelas);
  const res = S.map(s => ({ ...s, sem: {} }));
  for (const sm of [1, 2]) {
    const rata = {};
    M.forEach(m => { const v = S.map(s => N[sm]?.[s.id]?.[m.id]?.nilai).filter(x => x != null); rata[m.id] = v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; });
    res.forEach(s => {
      let j = 0, c = 0;
      const rows = M.map(m => {
        const n = N[sm]?.[s.id]?.[m.id], nv = n?.nilai ?? null; if (nv != null) { j += nv; c++; }
        const jn = a => (a || []).map(i => TP[i]).filter(Boolean), cp = jn(n?.tp_capai), pr = jn(n?.tp_perlu), d = [];
        if (cp.length) d.push('Ananda menunjukkan capaian optimal dalam ' + cp.join('; ') + '.');
        if (pr.length) d.push('Perlu peningkatan dalam ' + pr.join('; ') + '.');
        return { nama: m.nama, kkm: m.kkm, nilai: nv, desc: d.join(' '), rata: rata[m.id] };
      });
      const a = A[sm]?.[s.id] || {};
      s.sem[sm] = { rows, jumlah: j, rata: c ? Math.round(j / c) : null, sakit: a.sakit || 0, izin: a.izin || 0, alpa: a.alpa || 0, catatan: a.catatan || '', keputusan: a.keputusan || '', ada: c > 0 };
    });
    let r = 0, prev = null;
    [...res].sort((a, b) => b.sem[sm].jumlah - a.sem[sm].jumlah).forEach((s, i) => { const t = s.sem[sm].jumlah; if (t !== prev) r = i + 1; prev = t; s.sem[sm].rank = t > 0 ? r : null; });
  }
  return { cfg: CFG, kelas, wali: W?.nama || '', siswa: res };
}
async function show() {
  try { R = await loadRapor(KL); } catch (e) { return fail(e); }
  $('#content').innerHTML = `<div class="card">${ME.role == 'admin' ? `<select style="max-width:220px;margin-bottom:10px" onchange="KL=this.value;show()">${KLS.map(k => `<option ${k == KL ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select>` : ''}
  <p class="muted">Rapor memuat Semester 1 (kiri) dan Semester 2 (kanan) untuk TA ${esc(CFG.tahun_ajaran)}. Gunakan kertas A4 landscape dan aktifkan "Background graphics" saat mencetak.</p>
  <button class="btn" onclick="cetak(R.siswa)">Cetak Semua (${R.siswa.length} siswa)</button></div>
  <div class="card"><table class="tb"><tr><th>No</th><th>Nama</th><th>NIS</th><th></th></tr>${R.siswa.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.nama)}</td><td>${esc(s.nis)}</td><td><button class="btn sm" onclick="cetak([R.siswa[${i}]])">Cetak</button></td></tr>`).join('')}</table></div>`;
}
function cetak(list) { $('#print').innerHTML = list.map(s => `<div class="sheet">${half(s, 1, R)}${half(s, 2, R)}</div>`).join(''); setTimeout(() => window.print(), 250); }

function half(s,sm,d){
  const c=d.cfg,x=s.sem[sm],g=sm==1?'ganjil':'genap';
  const rows=x.rows.map((r,i)=>`<tr><td class="c">${i+1}</td><td>${esc(r.nama)}</td><td class="c">${r.kkm}</td><td class="c"><b>${r.nilai??''}</b></td><td class="d">${esc(r.desc)}</td><td class="c">${r.rata??''}</td></tr>`).join('');
  return `<div class="half">
  <div class="rb"><span>LAPORAN HASIL BELAJAR</span><span>SEMESTER ${sm} • ${esc(c.tahun_ajaran)}</span></div>
  <table class="idt"><tr><td>Nama Murid</td><td>: ${esc(s.nama)}</td><td>Kelas</td><td>: ${esc(d.kelas)}</td></tr>
  <tr><td>NISN / NIS</td><td>: ${esc(s.nisn)} / ${esc(s.nis)}</td><td>Semester</td><td>: ${sm}</td></tr>
  <tr><td>Nama Sekolah</td><td>: ${esc(c.sekolah_nama)}</td><td>Tahun Pelajaran</td><td>: ${esc(c.tahun_ajaran)}</td></tr>
  <tr><td>Alamat</td><td colspan="3">: ${esc(c.alamat)} ${c.npsn?'(NPSN '+esc(c.npsn)+')':''}</td></tr></table>
  <table class="nl"><tr><th style="width:4%">No</th><th style="width:20%">Mata Pelajaran</th><th style="width:6%">KKM</th><th style="width:7%">Nilai</th><th>Deskripsi Capaian Kompetensi</th><th style="width:8%">Rata-rata Kelas</th></tr>${rows}
  <tr class="tot"><td colspan="3">Jumlah Nilai</td><td class="c">${x.ada?x.jumlah:''}</td><td colspan="2"></td></tr>
  <tr class="tot"><td colspan="3">Rata-rata Nilai</td><td class="c">${x.rata??''}</td><td colspan="2"></td></tr>
  <tr class="tot"><td colspan="3">Peringkat</td><td class="c">${x.rank??''}</td><td colspan="2"></td></tr></table>
  <div class="box"><h6>CATATAN</h6><p>${esc(x.catatan)}</p></div>
  <table class="ab" style="margin-top:4px;width:60%"><tr><th colspan="3">KETIDAKHADIRAN</th></tr><tr><td>1</td><td>Sakit</td><td>${x.sakit} hari</td></tr><tr><td>2</td><td>Izin</td><td>${x.izin} hari</td></tr><tr><td>3</td><td>Tanpa Keterangan</td><td>${x.alpa} hari</td></tr></table>
  ${sm==2?`<div class="box" style="margin-top:3px"><p><b>Keputusan:</b> Berdasarkan hasil semester 1 dan 2, siswa ditetapkan: <b>${esc(x.keputusan||'..............')}</b></p></div>`:''}
  <p style="margin:4px 0 0">Diberikan di: ${esc(c['tempat_'+g])||'..............'} &nbsp; Tanggal: ${tgl(c['tgl_'+g])}</p>
  <div class="sg"><div>Mengetahui,<br>Orang Tua/Wali<div class="ln"></div>( ................ )</div><div>Wali Kelas<div class="ln"></div>( ${esc(d.wali)||'................'} )</div><div>Kepala Sekolah<div class="ln"></div>( ${esc(c.kepsek)||'................'} )</div></div></div>`;
}
