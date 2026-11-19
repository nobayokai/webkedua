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
// Skala otomatis: tiap rapor (.sheet) diperkecil secukupnya agar pas satu halaman F4 potret (margin 10 mm)
function fitSheets(pageW = 195, pageH = 306) {
  const MM = 96 / 25.4, W = pageW * MM, H = pageH * MM, box = $('#print');
  box.classList.add('measure');                       // ditampilkan di luar layar hanya untuk mengukur
  box.querySelectorAll('.sheet').forEach(sh => {
    const el = sh.firstElementChild; el.style.transformOrigin = 'top left'; let s = 1;
    for (; s > 0.4; s = Math.round((s - 0.02) * 100) / 100) {
      el.style.width = (W / s) + 'px'; el.style.transform = `scale(${s})`;
      if (el.offsetHeight * s <= H - 24) break;   // sisakan ruang agar garis bawah tidak terpotong
    }
    sh.style.height = Math.min(H, Math.ceil(el.offsetHeight * s) + 18) + 'px';   // +18px cadangan jika hasil cetak sedikit lebih tinggi
  });
  box.classList.remove('measure');
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

// ---------- Menu & sidebar: lihat js/sidebar.js ----------
function headInfo() {
  $('#who').textContent = ME.nama + ' • ' + ME.jabatan;
  $('#ta').textContent = `TA ${CFG.tahun_ajaran} • Semester ${CFG.semester == 1 ? 'Ganjil' : 'Genap'}`;
  $('#sn').textContent = CFG.sekolah_nama || 'Rapor Digital';
  simpanUI(); // simpan cache sidebar (js/sidebar.js)
}
async function logout() { sessionStorage.removeItem('rapor_ui'); sessionStorage.removeItem('rapor_ind'); await sb.auth.signOut(); location.replace('index.html'); }

// Dipanggil di awal setiap halaman. Mengembalikan profil, atau null jika dialihkan.
async function init(opt = {}) {
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { sessionStorage.removeItem('rapor_ui'); location.replace('index.html'); return null; }
    ME = chk(await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle());
    if (!ME) { toast('Profil akun belum dibuat. Jalankan sql/02_admin.sql atau hubungi admin.', 1); await sb.auth.signOut(); setTimeout(() => location.replace('index.html'), 2500); return null; }
    CFG = Object.fromEntries(chk(await sb.from('setting').select('*').neq('k', 'logo')).map(x => [x.k, x.v]));
    ME.wali = /wali/i.test(ME.jabatan || '') ? ((ME.kelas || '').split(',')[0].trim() || null) : null;
    ME.tahfidz = /tahfidz/i.test(ME.jabatan || '');
    const m = MENU.find(x => x[0] == FILE);
    if (m && !boleh(m[3])) { location.replace('dashboard.html'); return null; }
    renderMenu();
    headInfo();
    return ME;
  } catch (e) { fail(e); return null; }
}
