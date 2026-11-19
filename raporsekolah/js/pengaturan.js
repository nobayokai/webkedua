// Admin: tahun ajaran, semester, data sekolah, logo sekolah
const SF = [['tahun_ajaran', 'Tahun Ajaran', 'text', '2025/2026'], ['semester', 'Semester Aktif', 'sel'],
  ['tgl_ganjil', 'Tanggal Pengambilan Rapor (Ganjil)', 'date'], ['tempat_ganjil', 'Tempat Pengambilan Rapor (Ganjil)', 'text'],
  ['tgl_genap', 'Tanggal Pengambilan Rapor (Genap)', 'date'], ['tempat_genap', 'Tempat Pengambilan Rapor (Genap)', 'text'],
  ['tahun_hijriyah', 'Tahun Hijriyah (opsional, rapor tahfidz)', 'text', '1447 H'], ['sekolah_nama', 'Nama Sekolah', 'text'], ['npsn', 'NPSN', 'text'], ['alamat', 'Alamat Sekolah', 'text'], ['kepsek', 'Nama Kepala Sekolah', 'text']];
let LOGO; // undefined = tidak berubah, '' = dihapus, teks data:image = logo baru
(async () => {
  if (!await init()) return;
  let cur = '';
  try { cur = chk(await sb.from('setting').select('v').eq('k', 'logo').maybeSingle())?.v || ''; } catch (e) { return fail(e); }
  $('#content').innerHTML = `<div class="card"><h4>Tahun Ajaran, Semester & Data Sekolah</h4><div class="grid">
  ${SF.map(([k, l, t, ph]) => `<div><label class="muted">${l}</label>${t == 'sel' ? `<select id="s_${k}"><option value="1">1 - Ganjil</option><option value="2">2 - Genap</option></select>` : `<input id="s_${k}" type="${t}" placeholder="${ph || ''}">`}</div>`).join('')}</div>
  <h4 style="margin-top:10px">Logo Sekolah</h4>
  <div class="logo-row"><div class="logo-prev" id="logoPrev"></div><div>
    <input type="file" id="logoFile" accept="image/*" onchange="pilihLogo(this)">
    <button class="btn sm del" onclick="hapusLogo()">Hapus Logo</button>
    <p class="muted" style="margin:8px 0 0">Logo dipakai sebagai latar tipis (watermark) di rapor. Disarankan gambar persegi, PNG berlatar transparan atau putih. Ukuran otomatis dikecilkan.</p>
  </div></div>
  <button class="btn" style="margin-top:12px" onclick="saveSet()">Simpan Pengaturan</button></div>`;
  SF.forEach(([k]) => $('#s_' + k).value = CFG[k] || '');
  showLogo(cur);
})();

function showLogo(src) { $('#logoPrev').innerHTML = src ? `<img src="${src}" alt="Logo">` : '<span class="muted">Belum ada logo</span>'; }
function pilihLogo(inp) {
  const f = inp.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    const img = new Image();
    img.onload = () => {
      let max = 480, url = '';
      for (let i = 0; i < 3; i++) { // kecilkan bertahap bila terlalu besar
        const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        url = c.toDataURL('image/png'); if (url.length < 450000) break; max = Math.round(max * 0.65);
      }
      LOGO = url; showLogo(url); toast('Logo dipilih. Klik Simpan Pengaturan.');
    };
    img.onerror = () => toast('File bukan gambar yang valid', 1);
    img.src = rd.result;
  };
  rd.readAsDataURL(f);
}
function hapusLogo() { LOGO = ''; $('#logoFile').value = ''; showLogo(''); toast('Logo akan dihapus setelah Simpan Pengaturan'); }

async function saveSet() {
  try {
    const rows = SF.map(([k]) => ({ k, v: $('#s_' + k).value.trim() }));
    if (LOGO !== undefined) rows.push({ k: 'logo', v: LOGO });
    chk(await sb.from('setting').upsert(rows, { onConflict: 'k' }));
    SF.forEach(([k]) => CFG[k] = $('#s_' + k).value.trim()); LOGO = undefined;
    headInfo(); logit('Pengaturan sekolah & tahun ajaran diperbarui'); toast('Pengaturan disimpan');
  } catch (e) { fail(e); }
}
