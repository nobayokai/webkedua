// Admin: mata pelajaran per kelas + urutan
let G = [], M = [], K = [], MK = '';
(async () => { if (await init()) load(); })();
async function load() {
  try {
    G = chk(await sb.from('profiles').select('id,nama,kelas').eq('role', 'guru').order('nama'));
    M = chk(await sb.from('mapel').select('*,profiles(nama)').order('kelas').order('urutan').order('id'));
  } catch (e) { return fail(e); }
  K = [...new Set([...G.flatMap(g => g.kelas.split(',').map(x => x.trim())), ...M.map(m => m.kelas)].filter(Boolean))].sort();
  if (!K.includes(MK)) MK = K[0] || '';
  draw();
}
function draw() {
  const L = M.filter(m => m.kelas == MK);
  let gs = G.filter(g => g.kelas.split(',').map(x => x.trim()).includes(MK)); if (!gs.length) gs = G;
  $('#content').innerHTML = `<div class="card"><h4>Kelas</h4><select id="mk" onchange="MK=this.value;draw()">${K.map(k => `<option ${k == MK ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select>
  ${K.length ? '' : '<p class="muted">Isi dulu kolom "kelas" pada akun guru.</p>'}</div>
  <div class="card"><h4>Tambah Mata Pelajaran untuk Kelas ${esc(MK)}</h4><div class="grid">
  <select id="mg">${gs.map(g => `<option value="${g.id}">${esc(g.nama)}</option>`).join('')}</select><input id="mn" placeholder="Nama mata pelajaran (mis. Matematika)"></div>
  <button class="btn" onclick="addMapel()">Tambah</button></div>
  <div class="card"><h4>Urutan di Rapor (atur dengan tombol ▲ ▼)</h4>
  ${L.map((m, i) => `<div class="mrow"><b>${i + 1}.</b><span>${esc(m.nama)} <small class="muted">— ${esc(m.profiles?.nama)}</small></span><button class="btn sm ghost" onclick="moveM(${i},-1)">▲</button><button class="btn sm ghost" onclick="moveM(${i},1)">▼</button><button class="btn sm del" onclick="delMapel(${m.id})">Hapus</button></div>`).join('') || '<p class="muted">Belum ada mata pelajaran.</p>'}</div>`;
}
async function addMapel() {
  const nama = mn.value.trim(); if (!nama || !MK) return toast('Nama mapel dan kelas wajib diisi', 1);
  try { const urut = Math.max(0, ...M.filter(m => m.kelas == MK).map(m => m.urutan)) + 1;
    chk(await sb.from('mapel').insert({ kelas: MK, guru_id: mg.value, nama, urutan: urut })); load(); } catch (e) { fail(e); }
}
async function delMapel(id) { if (!confirm('Hapus mata pelajaran ini beserta nilai & TP-nya?')) return; try { chk(await sb.from('mapel').delete().eq('id', id)); load(); } catch (e) { fail(e); } }
async function moveM(i, d) {
  const L = M.filter(m => m.kelas == MK), j = i + d; if (j < 0 || j >= L.length) return;
  [L[i], L[j]] = [L[j], L[i]];
  try { for (let k = 0; k < L.length; k++) chk(await sb.from('mapel').update({ urutan: k + 1 }).eq('id', L[k].id)); load(); } catch (e) { fail(e); }
}
