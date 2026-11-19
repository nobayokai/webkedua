// ============ SIDEBAR & KERANGKA HALAMAN ============
// Dibuat langsung saat halaman dimuat (sebelum data diambil), memakai cache sesi,
// supaya sidebar tidak "berkedip" saat pindah menu.
const MENU = [
  ['dashboard.html', 'Dashboard', '', '*'],
  ['guru.html', 'Data Guru', '', 'a'],
  ['siswa-dapodik.html', 'Import Siswa Dapodik', '', 'a'],
  ['pengaturan.html', 'Tahun Ajaran & Sekolah', '', 'a'],
  ['mapel.html', 'Mata Pelajaran', '', 'a'],
  ['kkm-tp.html', 'KKM & Tujuan Pembelajaran', '', 'g'],
  ['nilai.html', 'Input Nilai', '', 'g'],
  ['siswa.html', 'Data Siswa', '', 'w'],
  ['absen.html', 'Ketidakhadiran', '', 'w'],
  ['rapor.html', 'Cetak Rapor', '', 'r'],
  ['tahfidz.html', 'Input Tahfidz', '', 't'],
  ['rapor-tahfidz.html', 'Rapor Tahfidz', '', 'u'],
  ['backup.html', 'Backup & Restore', '', 'a'],
];
// akses: * semua | a admin | g guru | w wali kelas | r admin atau wali kelas | t guru tahfidz | u admin atau guru tahfidz
const bolehU = (u, a) => a == '*' || (a == 'a' && u.role == 'admin') || (a == 'g' && u.role == 'guru') ||
  (a == 'w' && u.role == 'guru' && u.wali) || (a == 'r' && (u.role == 'admin' || u.wali)) ||
  (a == 't' && u.role == 'guru' && u.tahfidz) || (a == 'u' && (u.role == 'admin' || u.tahfidz));
const boleh = a => bolehU(ME, a);
const FILE = location.pathname.split('/').pop() || 'index.html';
let UI = {}; try { UI = JSON.parse(sessionStorage.getItem('rapor_ui')) || {}; } catch (e) {}

function simpanUI() {
  UI = { role: ME.role, wali: ME.wali, tahfidz: ME.tahfidz, nama: ME.nama, jabatan: ME.jabatan, sn: CFG.sekolah_nama, ta: $('#ta').textContent };
  sessionStorage.setItem('rapor_ui', JSON.stringify(UI));
}
function menuHTML(u) {
  if (!u || !u.role) return '<i class="sk"></i>'.repeat(6);
  return MENU.filter(x => bolehU(u, x[3])).map(x => `<a href="${x[0]}" class="${x[0] == FILE ? 'on' : ''}"><span class="ic">${x[2]}</span><b>${x[1]}</b></a>`).join('');
}
// Indikator menu aktif yang meluncur ke menu tujuan
function placeInd(animate) {
  const on = $('#menu a.on'), ind = $('#menu .ind'); if (!on || !ind) return;
  const to = on.offsetTop, prev = sessionStorage.getItem('rapor_ind');
  ind.style.transition = 'none';
  ind.style.transform = `translateY(${animate && prev !== null ? +prev : to}px)`;
  ind.style.height = on.offsetHeight + 'px';
  ind.offsetHeight; ind.style.transition = '';
  ind.style.transform = `translateY(${to}px)`; ind.style.opacity = 1;
  sessionStorage.setItem('rapor_ind', to);
}
// Dipanggil init() setelah data akun siap: perbarui menu hanya jika berubah
function renderMenu() {
  const h = menuHTML(ME), m = $('#menu'); if (m.dataset.h === h) return;
  m.querySelectorAll('a,.sk').forEach(x => x.remove()); m.insertAdjacentHTML('beforeend', h); m.dataset.h = h; placeInd(false);
}

(function buildShell() {
  const m = MENU.find(x => x[0] == FILE), aside = FILE == 'dashboard.html', app = $('#app');
  const h = UI.role ? menuHTML(UI) : '';
  app.className = aside ? '' : 'noaside';
  app.innerHTML = `
    <nav><div class="brand"><span id="sn">${esc(UI.sn || 'Rapor Digital')}</span><small id="who">${UI.nama ? esc(UI.nama + ' • ' + UI.jabatan) : ''}</small></div>
      <div id="menu" data-h="${h ? '1' : ''}"><i class="ind"></i>${h || menuHTML(null)}</div>
      <div class="out" onclick="logout()">⎋ &nbsp;Keluar</div></nav>
    <main><div class="top"><h2>${m ? m[1] : ''}</h2><span class="pill" id="ta">${esc(UI.ta || '')}</span></div>
      <div id="content" class="enter"><p class="muted">Memuat…</p></div></main>
    ${aside ? `<aside><h3>Aktivitas Terbaru</h3><div id="pct"><b>0%</b></div>
      <p style="text-align:center;color:var(--pink);font-weight:700;margin:4px 0 22px">SELESAI</p><div id="act"></div></aside>` : ''}`;
  // data-h disamakan dengan hasil menuHTML saat cache ada
  if (h) $('#menu').dataset.h = h;
  placeInd(true);
  addEventListener('load', () => placeInd(false));
  // animasi masuk konten hanya pada render pertama
  const c = $('#content'), mo = new MutationObserver(() => { mo.disconnect(); setTimeout(() => c.classList.remove('enter'), 900); });
  mo.observe(c, { childList: true });
  // efek pindah menu: indikator meluncur, konten memudar, lalu pindah halaman
  document.addEventListener('click', e => {
    const a = e.target.closest('#menu a'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault(); const href = a.getAttribute('href'); if (href == FILE) return;
    document.querySelectorAll('#menu a').forEach(x => x.classList.toggle('on', x === a));
    const ind = $('#menu .ind'); ind.style.height = a.offsetHeight + 'px'; ind.style.transform = `translateY(${a.offsetTop}px)`;
    sessionStorage.setItem('rapor_ind', a.offsetTop);
    $('#content').classList.add('leave');
    setTimeout(() => location.href = href, 200);
  });
})();
