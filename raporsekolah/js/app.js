// ============ MODUL BERSAMA (dipakai semua halaman) ============
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const tgl = d => { if (!d) return '..............'; const [y, m, x] = d.split('-'); return `${+x} ${BULAN[m - 1]} ${y}`; };
const has = (a, id) => (a || []).map(Number).includes(Number(id));
let ME, CFG;

function toast(m, err) {
  const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = m;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3500);
}
// Cek hasil query Supabase. Error dicatat di console (F12) dan ditampilkan.
function chk(r) {
  if (r.error) { console.error('[Supabase]', r.error); toast(r.error.message, 1); r.error.shown = 1; throw r.error; }
  return r.data;
}
// Ambil semua baris (Supabase membatasi 1000 baris per request)
async function all(build) {
  let out = [], from = 0;
  for (;;) { const r = chk(await build().range(from, from + 999)); out = out.concat(r); if (r.length < 1000) break; from += 1000; }
  return out;
}
const logit = t => sb.from('log').insert({ teks: t }).then(() => {}, () => {}); // .then() wajib agar query terkirim
const fail = e => { if (!e.shown) toast(e.message || 'Terjadi kesalahan', 1); console.error(e); };

// ---------- Excel ----------
function pickX(cb) {
  const i = document.createElement('input'); i.type = 'file'; i.accept = '.xlsx,.xls,.csv';
  i.onchange = async () => {
    const wb = XLSX.read(await i.files[0].arrayBuffer());
    const rs = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });
    cb(rs.map(r => { const o = {}; for (const k in r) o[String(k).trim().toLowerCase()] = String(r[k]).trim(); return o; }));
  };
  i.click();
}
function tpl(name, cols, rows) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([cols, ...rows]), 'Data');
  XLSX.writeFile(wb, name + '.xlsx');
}

// ---------- Menu & akses ----------
// akses: * semua | a admin | g guru | w wali kelas | r admin atau wali kelas
const MENU = [
  ['dashboard.html', 'Dashboard', '🏠', '*'],
  ['guru.html', 'Data Guru', '👩‍🏫', 'a'],
  ['pengaturan.html', 'Tahun Ajaran & Sekolah', '⚙️', 'a'],
  ['mapel.html', 'Mata Pelajaran', '📚', 'a'],
  ['kkm-tp.html', 'KKM & Tujuan Pembelajaran', '🎯', 'g'],
  ['nilai.html', 'Input Nilai', '✏️', 'g'],
  ['siswa.html', 'Data Siswa', '🎒', 'w'],
  ['absen.html', 'Ketidakhadiran', '📅', 'w'],
  ['rapor.html', 'Cetak Rapor', '🖨️', 'r'],
  ['backup.html', 'Backup & Restore', '💾', 'a'],
];
const boleh = a => a == '*' || (a == 'a' && ME.role == 'admin') || (a == 'g' && ME.role == 'guru') ||
  (a == 'w' && ME.role == 'guru' && ME.wali) || (a == 'r' && (ME.role == 'admin' || ME.wali));

function headInfo() {
  $('#who').textContent = ME.nama + ' • ' + ME.jabatan;
  $('#ta').textContent = `TA ${CFG.tahun_ajaran} • Semester ${CFG.semester == 1 ? 'Ganjil' : 'Genap'}`;
  $('#sn').textContent = CFG.sekolah_nama || 'Rapor Digital';
}
async function logout() { await sb.auth.signOut(); location.replace('index.html'); }

// Dipanggil di awal setiap halaman. Mengembalikan profil, atau null jika dialihkan.
async function init(opt = {}) {
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { location.replace('index.html'); return null; }
    ME = chk(await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle());
    if (!ME) { toast('Profil akun belum dibuat. Jalankan sql/02_admin.sql atau hubungi admin.', 1); await sb.auth.signOut(); setTimeout(() => location.replace('index.html'), 2500); return null; }
    CFG = Object.fromEntries(chk(await sb.from('setting').select('*')).map(x => [x.k, x.v]));
    ME.wali = /wali/i.test(ME.jabatan || '') ? ((ME.kelas || '').split(',')[0].trim() || null) : null;
    const file = location.pathname.split('/').pop() || 'index.html';
    const m = MENU.find(x => x[0] == file);
    if (m && !boleh(m[3])) { location.replace('dashboard.html'); return null; }
    $('#app').className = opt.aside ? '' : 'noaside';
    $('#app').innerHTML = `
      <nav><div class="brand"><span id="sn"></span><small id="who"></small></div>
        <div id="menu">${MENU.filter(x => boleh(x[3])).map(x => `<a href="${x[0]}" class="${x[0] == file ? 'on' : ''}"><span>${x[2]}</span>${x[1]}</a>`).join('')}</div>
        <div class="out" onclick="logout()">⎋ &nbsp;Keluar</div></nav>
      <main><div class="top"><h2>${m ? m[1] : ''}</h2><span class="pill" id="ta"></span></div><div id="content"><p class="muted">Memuat…</p></div></main>
      ${opt.aside ? `<aside><h3>Aktivitas Terbaru</h3><div id="pct"><b>0%</b></div>
        <p style="text-align:center;color:var(--pink);font-weight:700;margin:4px 0 22px">SELESAI</p><div id="act"></div></aside>` : ''}`;
    headInfo();
    return ME;
  } catch (e) { fail(e); return null; }
}
