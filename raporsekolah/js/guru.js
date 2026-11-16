// Admin: kelola akun guru
let G = [];
// client terpisah agar sesi admin tidak tergantikan saat membuat akun guru
const tmp = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
(async () => { if (await init()) render(); })();

async function render() {
  try { G = chk(await sb.from('profiles').select('*').eq('role', 'guru').order('nama')); } catch (e) { return fail(e); }
  $('#content').innerHTML = `<div class="card"><h4>Tambah / Ubah Akun Guru</h4><input type="hidden" id="gid">
  <div class="grid"><input id="gn" placeholder="Nama lengkap"><input id="gu" placeholder="Username (huruf kecil/angka)"><input id="gp" placeholder="Password (min. 6; kosongkan jika tidak diubah)">
  <input id="gj" list="jab" placeholder="Jabatan"><datalist id="jab"><option>Wali Kelas<option>Guru Mapel</datalist><input id="gk" placeholder="Kelas diajar, pisah koma: 1A,1B"></div>
  <p class="muted" style="margin-top:0">Untuk jabatan Wali Kelas, kelas pertama dalam daftar adalah kelas perwaliannya.</p>
  <button class="btn" onclick="saveGuru()">Simpan</button><button class="btn alt" onclick="importGuru()">Import XLSX</button>
  <button class="btn ghost" onclick="tpl('template_guru',['nama','username','password','jabatan','kelas'],[['Budi Santoso','budi','rahasia123','Wali Kelas','1A,1B']])">Unduh Template</button></div>
  <div class="card"><table class="tb"><tr><th>Nama</th><th>Username</th><th>Jabatan</th><th>Kelas</th><th></th></tr>
  ${G.map((g, i) => `<tr><td>${esc(g.nama)}</td><td>${esc(g.username)}</td><td>${esc(g.jabatan)}</td><td>${esc(g.kelas)}</td><td><button class="btn sm ghost" onclick="editGuru(${i})">Ubah</button><button class="btn sm del" onclick="delGuru('${g.id}')">Hapus</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Belum ada akun guru.</td></tr>'}</table></div>`;
}
function editGuru(i) { const g = G[i]; gid.value = g.id; gn.value = g.nama; gu.value = g.username; gj.value = g.jabatan; gk.value = g.kelas; gp.value = ''; scrollTo(0, 0); }

async function buatAkun(p, pw) {
  const { data, error } = await tmp.auth.signUp({ email: p.username + EMAIL_DOMAIN, password: pw });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Akun gagal dibuat');
  chk(await sb.from('profiles').insert({ id: data.user.id, ...p, role: 'guru' }));
}
async function saveGuru() {
  const p = { nama: gn.value.trim(), username: gu.value.trim().toLowerCase(), jabatan: gj.value.trim() || 'Guru Mapel', kelas: gk.value.trim() };
  if (!p.nama || !/^[a-z0-9._-]+$/.test(p.username)) return toast('Nama wajib diisi; username hanya huruf kecil, angka, titik, strip', 1);
  try {
    if (gid.value) {
      chk(await sb.from('profiles').update(p).eq('id', gid.value));
      if (gp.value) chk(await sb.rpc('admin_set_password', { uid: gid.value, pw: gp.value }));
    } else {
      if (gp.value.length < 6) return toast('Password minimal 6 karakter', 1);
      await buatAkun(p, gp.value);
    }
    logit('Akun guru ' + p.nama + ' disimpan'); toast('Akun guru disimpan'); render();
  } catch (e) { fail(e); }
}
async function delGuru(id) {
  if (!confirm('Hapus akun guru ini beserta mata pelajaran & nilainya?')) return;
  try { chk(await sb.rpc('admin_delete_user', { uid: id })); render(); } catch (e) { fail(e); }
}
function importGuru() {
  pickX(async rows => {
    let n = 0; const ex = Object.fromEntries(G.map(g => [g.username, g]));
    for (const r of rows) {
      const un = (r.username || '').toLowerCase(); if (!r.nama || !un) continue;
      const p = { nama: r.nama, username: un, jabatan: r.jabatan || 'Guru Mapel', kelas: r.kelas || '' };
      try {
        if (ex[un]) { chk(await sb.from('profiles').update(p).eq('id', ex[un].id)); if (r.password) chk(await sb.rpc('admin_set_password', { uid: ex[un].id, pw: r.password })); }
        else { const pw = r.password || un; if (pw.length < 6) { toast(`${un}: password minimal 6 karakter, dilewati`, 1); continue; } await buatAkun(p, pw); }
        n++;
      } catch (e) { toast(`${un}: ${e.message}`, 1); }
    }
    logit(`Impor ${n} akun guru`); toast(n + ' akun guru diproses'); render();
  });
}
