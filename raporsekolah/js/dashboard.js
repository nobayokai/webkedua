// Dashboard progres input nilai
(async () => {
  if (!await init({ aside: true })) return;
  try {
    const ta = CFG.tahun_ajaran, sm = CFG.semester;
    const M = await all(() => { let q = sb.from('mapel').select('id,nama,kelas,kkm,profiles(nama)').order('kelas').order('urutan'); return ME.role == 'guru' ? q.eq('guru_id', ME.id) : q; });
    const ids = M.map(m => m.id);
    const [S, T, N, L] = await Promise.all([
      all(() => sb.from('siswa').select('kelas')),
      all(() => sb.from('tp').select('mapel_id').eq('semester', sm)),
      ids.length ? all(() => sb.from('nilai').select('mapel_id').eq('tahun', ta).eq('semester', sm).not('nilai', 'is', null).in('mapel_id', ids)) : [],
      sb.from('log').select('teks,waktu').order('id', { ascending: false }).limit(8).then(chk)]);
    const cnt = (arr, f) => arr.reduce((o, x) => (o[f(x)] = (o[f(x)] || 0) + 1, o), {});
    const cs = cnt(S, x => x.kelas), ct = cnt(T, x => x.mapel_id), cn = cnt(N, x => x.mapel_id);
    const items = M.map(m => { const total = cs[m.kelas] || 0, isi = cn[m.id] || 0;
      return { ...m, guru: m.profiles?.nama, total, isi, ntp: ct[m.id] || 0, status: total > 0 && isi >= total ? 'selesai' : isi > 0 ? 'proses' : 'belum' }; });
    const st = { selesai: 0, proses: 0, belum: 0 }; items.forEach(i => st[i.status]++);
    const n = items.length, LB = { selesai: 'Selesai', proses: 'Berjalan', belum: 'Belum' };
    const ring = (v, t, col, lbl) => { const c = 326.7; return `<div><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" stroke-width="8"/><circle cx="60" cy="60" r="52" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${t ? c * v / t : 0} ${c}" transform="rotate(-90 60 60)"/><text x="60" y="68" text-anchor="middle" font-size="28" font-weight="600" fill="${col}">${v}<tspan font-size="16" fill="#bbb">/${t}</tspan></text></svg><span style="color:${col}">${lbl}</span></div>`; };
    $('#content').innerHTML = `<h3 class="sec" style="margin-top:0">PROGRES INPUT NILAI <small>Semester ${sm == 1 ? 'Ganjil' : 'Genap'}</small></h3>
    <div class="card"><table class="tb"><tr><th>Kelas</th><th>Mata Pelajaran</th><th>Guru</th><th>KKM</th><th>Jml TP</th><th>Nilai Terisi</th><th>Status</th>${ME.role == 'guru' ? '<th></th>' : ''}</tr>
    ${items.map(i => `<tr><td>${esc(i.kelas)}</td><td>${esc(i.nama)}</td><td>${esc(i.guru)}</td><td>${i.kkm}</td><td>${i.ntp}</td><td>${i.isi}/${i.total}</td><td><span class="chip ${i.status}">${LB[i.status]}</span></td>${ME.role == 'guru' ? `<td><a class="btn sm" href="nilai.html?m=${i.id}">Isi</a></td>` : ''}</tr>`).join('') || '<tr><td colspan="8" class="muted">Belum ada mata pelajaran. Admin perlu menambahkannya di menu Mata Pelajaran.</td></tr>'}</table></div>
    <h3 class="sec">STATUS ${ME.role == 'admin' ? 'SEKOLAH' : 'SAYA'}</h3>
    <div class="rings">${ring(st.selesai, n, '#22c55e', 'Selesai')}${ring(st.proses, n, '#f59e0b', 'Berjalan')}${ring(st.belum, n, '#0ea5e9', 'Belum Diisi')}</div>`;
    const pct = n ? Math.round(st.selesai * 100 / n) : 0;
    $('#pct').style.setProperty('--p', pct); $('#pct b').textContent = pct + '%';
    const fw = w => new Date(w).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    $('#act').innerHTML = L.map(l => `<div class="ev"><i></i><b>${esc(l.teks)}</b><small>${fw(l.waktu)}</small></div>`).join('') || '<p class="muted">Belum ada aktivitas</p>';
  } catch (e) { fail(e); }
})();
