const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw72VAmuae0gBueTndaZpL8NrUJkl2K1M-lVpMJSUsMKBjo1o6Bafc5mdrzJXOH7toQBg/exec';

// ===========================================
// GLOBAL VARIABLE
// ============================================
let currentRole = 'siswa';

// =============================================
// TOGGLE PASSWORD
// =============================================
function togglePass(inputId, iconEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') { input.type = 'text'; iconEl.textContent = '🙈'; } 
    else { input.type = 'password'; iconEl.textContent = '👁️'; }
}

// =============================================
// SWITCH ROLE
// =============================================
function switchRole(role, elBtn) {
    currentRole = role;
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    if (elBtn) elBtn.classList.add('active');

    const labelNis  = document.getElementById('label-nis');
    const labelPass = document.getElementById('label-pass');
    const btnLogin  = document.getElementById('btn-login');
    const inputNis  = document.getElementById('input-nis');

    if (role === 'siswa') {
        labelNis.textContent  = 'NIS'; labelPass.textContent = 'Password'; inputNis.placeholder  = 'Masukkan NIS kamu';
        if (btnLogin) btnLogin.className = 'btn-login siswa';
    } else {
        labelNis.textContent  = 'Email Guru'; labelPass.textContent = 'Password'; inputNis.placeholder  = 'Masukkan Email kamu';
        if (btnLogin) btnLogin.className = 'btn-login guru';
    }
    document.getElementById('input-nis').value  = '';
    document.getElementById('input-pass').value = '';
    document.getElementById('pesan-login').textContent = '';
}

// =============================================
// HANDLE LOGIN DENGAN POPUP
// =============================================
async function handleLogin(e) {
    e.preventDefault();
    const nis   = document.getElementById('input-nis').value.trim();
    const pass  = document.getElementById('input-pass').value.trim();
    if (!nis || !pass) { showLoginPopup('error', '⚠️ Harap isi NIS/Email dan Password!'); return; }

    const modal = showLoginPopup('loading', '⏳ Sedang verifikasi...');
    try {
        const params = new URLSearchParams({ action : 'login', role : currentRole, nis : nis, pass : pass });
        const res  = await fetch(`${SCRIPT_URL}?${params}`);
        const data = await res.json();
        modal.remove();

        if (data.status === 'success') {  
            localStorage.setItem('user_login', JSON.stringify({ nama: data.nama, role: currentRole, jabatan: data.jabatan, id: data.id, token: data.token }));  
            updateMenuLogin();  
            const successModal = showLoginPopup('success', `Selamat datang, ${data.nama}`);  
            setTimeout(() => { successModal.remove(); const tabBeranda = document.querySelector('.tab'); loadPage('beranda-konten.html', tabBeranda); }, 1500);  
        } else { showLoginPopup('error', 'Sepertinya data yang kamu masukan salah'); }  
    } catch (err) {
        modal.remove(); console.error(err); showLoginPopup('error', '❌ Gagal terhubung ke server!');
    }
}

// =============================================
// FUNGSI POPUP LOGIN (Aesthetic Version)
// =============================================
function showLoginPopup(type, message) {
    const oldModal = document.querySelector('.modal');
    if (oldModal) oldModal.remove();
    const modal = document.createElement('div'); modal.className = 'modal';
    let contentHTML = '';

    if (type === 'loading') { contentHTML = `<div class="modal-content"><div class="spinner"></div><p>${message}</p></div>`; } 
    else if (type === 'success') { contentHTML = `<div class="modal-content success"><div class="modal-icon">✅</div><p>${message}</p></div>`; } 
    else if (type === 'error') { contentHTML = `<div class="modal-content error"><div class="modal-icon">❌</div><p>${message}</p></div>`; }

    modal.innerHTML = contentHTML; document.body.appendChild(modal);
    if (type !== 'loading') { modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); }); }
    return modal;
}

// =============================================
// UPDATE MENU LOGIN/LOGOUT
// =============================================
function updateMenuLogin() {
    const userLogin = localStorage.getItem('user_login');
    const tabLogin  = document.getElementById('tab-login');
    const tabLogout = document.getElementById('tab-logout');
    const tabAbsensi = document.getElementById('tab-absensi'); 
    const tabSupervisi = document.getElementById('tab-supervisi'); 

    if (userLogin) {
        if(tabLogin) tabLogin.style.display  = 'none';
        if(tabLogout) tabLogout.style.display = '';
        const user = JSON.parse(userLogin);
        if(tabLogout) tabLogout.innerHTML = `<span style="color:#ff3b30;">Logout</span>`;
        if (tabAbsensi) tabAbsensi.style.display = (user.role === 'guru' || user.role === 'kepsek') ? 'inline-block' : 'none';
        if (tabSupervisi) tabSupervisi.style.display = (user.role === 'guru' || user.role === 'kepsek') ? 'inline-block' : 'none';
    } else {
        if(tabLogin) tabLogin.style.display  = '';
        if(tabLogout) tabLogout.style.display = 'none';
        if(tabAbsensi) tabAbsensi.style.display = 'none'; 
        if(tabSupervisi) tabSupervisi.style.display = 'none'; 
    }
}

function handleLogout() {
    localStorage.removeItem('user_login');
    const logoutModal = showLoginPopup('success', 'Kamu telah berhasil keluar');
    setTimeout(() => { if (logoutModal) logoutModal.remove(); location.reload(); }, 1600);
}

// =============================================
// LOAD PAGE (DENGAN ANTI-CACHE)
// =============================================
async function loadPage(namaFile, elemenTab) {
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    if (elemenTab) elemenTab.classList.add('active');
    const areaKonten = document.getElementById('area-konten');
    try {
        areaKonten.innerHTML = '<p id="status-loading">Memuat halaman...</p>';
        const urlBebasCache = namaFile + '?v=' + new Date().getTime();
        const response = await fetch(urlBebasCache);
        if (!response.ok) throw new Error('Halaman tidak ditemukan');
        const htmlContent = await response.text();
        areaKonten.innerHTML = '';
        const temp = document.createElement('div'); temp.innerHTML = htmlContent;
        Array.from(temp.childNodes).forEach(node => { areaKonten.appendChild(node.cloneNode(true)); });
        Array.from(areaKonten.querySelectorAll('script')).forEach(oldScript => {
            const newScript = document.createElement('script');
            if (oldScript.src) { newScript.src = oldScript.src; newScript.async = false; } 
            else { newScript.textContent = oldScript.textContent; }
            document.head.appendChild(newScript); oldScript.remove();
        });
    } catch (error) { areaKonten.innerHTML = `<p style="color:red;">Gagal memuat halaman: ${error.message}</p>`; }
}

window.onload = () => { updateMenuLogin(); const tabPertama = document.querySelector('.tab'); loadPage('beranda-konten.html', tabPertama); };


// =============================================
// FITUR ABSENSI GURU (KALENDER INTERAKTIF, REKAPITULASI, TTD)
// =============================================
var globalSiswaAbsen = [];
var kalenderAbsenDate = new Date();
var tglPilihanAbsen = "";
var globalDataAgenda = []; 

window.initAbsensi = async function() {
    var userLogStr = localStorage.getItem("user_login");
    var panelAbsen = document.getElementById("panel-absen");
    if (!panelAbsen) return;
    if (!userLogStr) {
        panelAbsen.innerHTML = `<div style="text-align:center; padding: 50px;"><h2>⛔ Akses Ditolak</h2></div>`;
        return;
    }
    document.getElementById('main-absen-ui').style.display = 'block';
    await window.loadDataAbsensiUtama();
};

window.loadDataAbsensiUtama = async function() {
    var iosLoad = document.getElementById('ios-loading');
    var iosText = document.querySelector('#ios-loading .ios-loading-text');
    if(iosLoad && iosText) { iosText.textContent = "Menyinkronkan Data..."; iosLoad.classList.add('active'); }

    try {
        var [resSiswa, resAbsen, resAgenda] = await Promise.all([
            fetch(SCRIPT_URL + "?action=get_siswa"),
            fetch(SCRIPT_URL + "?action=get_rekap_absensi"),
            fetch(SCRIPT_URL + "?action=get_agenda")
        ]);
        
        var jsonSiswa = await resSiswa.json();
        var jsonAbsen = await resAbsen.json();
        var jsonAgenda = await resAgenda.json();
        
        if(jsonSiswa.status === 'success') {
            globalSiswaAbsen = jsonSiswa.data;
            window.globalDataAbsensi = jsonAbsen.data || []; 
            window.globalDataAgenda = jsonAgenda.data || []; 
            
            var kelasSet = new Set();
            globalSiswaAbsen.forEach(function(s) {
                if(s.kelas && s.nis !== "DUMMY_KELAS") kelasSet.add(s.kelas);
            });

            var sel = document.getElementById('pilih-kelas-absen');
            var curr = sel ? sel.value : "";
            if(sel) {
                sel.innerHTML = '<option value="">-- Pilih Kelas --</option>';
                Array.from(kelasSet).sort().forEach(function(k) { sel.innerHTML += `<option value="${k}">${k}</option>`; });
                if(curr && kelasSet.has(curr)) sel.value = curr;
            }
        }
    } catch(e) { console.log("Gagal load data", e); }
    
    if(iosLoad) iosLoad.classList.remove('active');
    window.renderKalenderAbsensi();
};

window.gantiKelasAbsen = function() { window.renderKalenderAbsensi(); };
window.navAbsenBulan = function(dir) { kalenderAbsenDate.setMonth(kalenderAbsenDate.getMonth() + dir); window.renderKalenderAbsensi(); };

window.renderKalenderAbsensi = function() {
    var grid = document.getElementById('absen-cal-grid');
    var label = document.getElementById('absen-bulan-label');
    var infoEfektif = document.getElementById('info-efektif'); 
    if(!grid) return;

    var y = kalenderAbsenDate.getFullYear(); 
    var m = kalenderAbsenDate.getMonth();
    label.textContent = new Intl.DateTimeFormat('id-ID', { month:'long', year:'numeric' }).format(kalenderAbsenDate);
    grid.innerHTML = '';

    var first = new Date(y, m, 1); 
    var last = new Date(y, m+1, 0); 
    var today = new Date();
    var startIndex = (first.getDay() + 6) % 7;

    var liburNasional = window.globalDataAgenda.filter(function(a) {
        var isNasional = String(a.kategori).toLowerCase().includes("libur nasional");
        if (!isNasional) return false;
        var dLibur = new Date(a.tanggal);
        return dLibur.getFullYear() === y && dLibur.getMonth() === m;
    });

    for(var i=0; i<startIndex; i++) { grid.innerHTML += `<div class="absen-day muted"></div>`; }

    var kelasTerpilih = document.getElementById('pilih-kelas-absen').value;
    var jumlahHariEfektif = 0;

    for(var day=1; day<=last.getDate(); day++) {
        var tglStr = y + '-' + String(m+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
        var currDate = new Date(y, m, day);
        var dayOfWeek = currDate.getDay();
        
        var isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        var isToday = (day === today.getDate() && m === today.getMonth() && y === today.getFullYear()) ? 'today' : '';
        
        var isLiburNasional = liburNasional.some(function(l) { return new Date(l.tanggal).getDate() === day; });
        var classLibur = (isWeekend || isLiburNasional) ? 'libur' : '';

        if (!isWeekend && !isLiburNasional) jumlahHariEfektif++;
        var onClick = kelasTerpilih ? `onclick="window.bukaModalAbsenTgl('${tglStr}')"` : `onclick="alert('Pilih kelas di atas terlebih dahulu!')"`;

        grid.innerHTML += `<div class="absen-day ${isToday} ${classLibur}" ${onClick} title="${isLiburNasional ? 'Libur Nasional' : ''}">${day}</div>`;
    }

    if (infoEfektif) { infoEfektif.innerHTML = `📚 Jumlah Hari Efektif Belajar: <b>${jumlahHariEfektif} Hari</b>`; }
};

window.bukaModalAbsenTgl = function(tgl) { 
    var kelas = document.getElementById('pilih-kelas-absen').value;
    tglPilihanAbsen = tgl;
    document.getElementById('judul-absen-tgl').textContent = `Absensi ${kelas} (${tgl})`;
    var container = document.getElementById('list-siswa-absen'); container.innerHTML = "";
    var siswaKelas = globalSiswaAbsen.filter(function(s) { return s.kelas === kelas && s.nis !== "DUMMY_KELAS"; });
    siswaKelas.sort(function(a,b){ return a.nama.localeCompare(b.nama); });

    var riwayatAbsen = window.globalDataAbsensi ? window.globalDataAbsensi.filter(function(a) {
        var tglBersih = String(a.tanggal).includes("T") ? new Date(a.tanggal).toISOString().substring(0,10) : String(a.tanggal).replace(/['"]/g, '').substring(0, 10);
        return tglBersih === tgl && (a.kelas ? String(a.kelas).trim() : "") === kelas;
    }) : [];

    siswaKelas.forEach(function(s, index) {
        var statusSiswa = "Hadir"; 
        var absenSiswaIni = riwayatAbsen.find(function(a) { 
            return String(a.nis).replace(/['"]/g, '').trim() === String(s.nis).replace(/['"]/g, '').trim(); 
        });
        if(absenSiswaIni) {
            var statDb = (absenSiswaIni.status || "").toUpperCase().trim();
            if(statDb === 'SAKIT') statusSiswa = "Sakit"; else if(statDb === 'IZIN') statusSiswa = "Izin"; else if(statDb.includes('ALP') || statDb.includes('ALF')) statusSiswa = "Alpa";
        }
        var chkH = statusSiswa === "Hadir" ? "checked" : ""; var chkS = statusSiswa === "Sakit" ? "checked" : "";
        var chkI = statusSiswa === "Izin" ? "checked" : ""; var chkA = statusSiswa === "Alpa"  ? "checked" : "";

        container.innerHTML += `
            <div class="siswa-card-absen">
                <div><b style="color:#1f2937;">${index+1}. ${s.nama}</b><br><small style="color:#6b7280;">NIS: ${s.nis}</small></div>
                <div class="radio-group-absen">
                    <input type="radio" id="h-${s.nis}" name="absen_${s.nis}" value="Hadir" ${chkH}><label for="h-${s.nis}">H</label>
                    <input type="radio" id="s-${s.nis}" name="absen_${s.nis}" value="Sakit" ${chkS}><label for="s-${s.nis}">S</label>
                    <input type="radio" id="i-${s.nis}" name="absen_${s.nis}" value="Izin" ${chkI}><label for="i-${s.nis}">I</label>
                    <input type="radio" id="a-${s.nis}" name="absen_${s.nis}" value="Alpa" ${chkA}><label for="a-${s.nis}">A</label>
                </div>
            </div>`;
    });
    document.getElementById('modal-absen-harian').classList.add('active');
};

window.simpanAbsenHarian = async function() {
    var kelas = document.getElementById('pilih-kelas-absen').value;
    var siswaKelas = globalSiswaAbsen.filter(function(s) { return s.kelas === kelas && s.nis !== "DUMMY_KELAS"; });
    var dataAbsen = [];

    siswaKelas.forEach(function(s) {
        var r = document.querySelector(`input[name="absen_${s.nis}"]:checked`);
        if(r) dataAbsen.push({ nis: s.nis, nama: s.nama, status: r.value });
    });

    if(dataAbsen.length === 0) return alert("Tidak ada data siswa untuk diabsen.");
    document.getElementById('modal-absen-harian').classList.remove('active');
    
    var iosLoad = document.getElementById('ios-loading');
    var iosText = document.querySelector('#ios-loading .ios-loading-text');
    if(iosLoad && iosText) { iosText.textContent = "Menyimpan..."; iosLoad.classList.add('active'); }

    var payload = { action: "submit_absensi", tanggal: tglPilihanAbsen, kelas: kelas, data_absen: dataAbsen };

    try {
        await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
        await window.loadDataAbsensiUtama(); 
    } catch(e) { alert("Gagal menyimpan data!"); } 
    finally {
        if(iosLoad) iosLoad.classList.remove('active'); 
        alert("✅ Absensi berhasil disimpan/diperbarui!");
    }
};

window.bukaModalTambahKelas = function() { document.getElementById('modal-tambah-kelas').classList.add('active'); };
window.simpanKelasBaru = async function() {
    var namaKelas = document.getElementById('input-kelas-baru').value;
    if(!namaKelas) return alert("Nama kelas wajib diisi!");
    document.getElementById('modal-tambah-kelas').classList.remove('active');
    var iosLoad = document.getElementById('ios-loading');
    var iosText = document.querySelector('#ios-loading .ios-loading-text');
    if(iosLoad && iosText) { iosText.textContent = "Menyimpan..."; iosLoad.classList.add('active'); }

    var payload = { action: "add_siswa_kelas", kelas: namaKelas, nis: "DUMMY_KELAS", nama: "DUMMY_KELAS" };
    try {
        await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
        await window.loadDataAbsensiUtama();
    } catch(e) { alert("Gagal!"); }
    finally {
        document.getElementById('input-kelas-baru').value = "";
        if(iosLoad) iosLoad.classList.remove('active');
    }
};

window.bukaModalTambahSiswa = function() {
    var k = document.getElementById('pilih-kelas-absen').value;
    if(!k) return alert("Pilih kelas di kalender terlebih dahulu!");
    document.getElementById('add-kelas').value = k;
    document.getElementById('modal-tambah-siswa').classList.add('active');
};
window.simpanSiswaBaru = async function() {
    var kelas = document.getElementById('add-kelas').value;
    var nis = document.getElementById('add-nis').value;
    var nama = document.getElementById('add-nama').value;
    if(!nis || !nama) return alert("Wajib diisi!");

    document.getElementById('modal-tambah-siswa').classList.remove('active');
    var iosLoad = document.getElementById('ios-loading');
    var iosText = document.querySelector('#ios-loading .ios-loading-text');
    if(iosLoad && iosText) { iosText.textContent = "Menyimpan..."; iosLoad.classList.add('active'); }

    var payload = { action: "add_siswa_kelas", kelas: kelas, nis: nis, nama: nama };
    try {
        await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
        await window.loadDataAbsensiUtama();
    } catch(e) { alert("Gagal!"); }
    finally {
        document.getElementById('add-nis').value = "";
        document.getElementById('add-nama').value = "";
        if(iosLoad) iosLoad.classList.remove('active');
    }
};

// =============================================
// REKAPITULASI WALI KELAS & BIDANG STUDI (NEW TAB & F4 LANDSCAPE)
// =============================================
window.bukaModalRekapWali = function() {
    if(!document.getElementById('pilih-kelas-absen').value) return alert("Pilih Kelas terlebih dahulu di kalender!");
    document.getElementById('modal-rekap-wali').classList.add('active');
};

window.bukaModalRekapStudi = function() {
    if(!document.getElementById('pilih-kelas-absen').value) return alert("Pilih Kelas terlebih dahulu di kalender!");
    var currentMonthIdx = kalenderAbsenDate.getMonth();
    document.getElementById('rs-bln-awal').value = currentMonthIdx;
    document.getElementById('rs-bln-akhir').value = currentMonthIdx;
    document.getElementById('modal-rekap-studi').classList.add('active');
};

// Fungsi Bantuan untuk Kode Warna Absensi
function getWarnaAbsen(status) {
    if(status === 'SAKIT') return '<span style="color:#d97706; font-weight:900; font-size:12px;">s</span>';
    if(status === 'IZIN') return '<span style="color:#ea580c; font-weight:900; font-size:12px;">i</span>';
    if(status.includes('ALP') || status.includes('ALF')) return '<span style="color:#ef4444; font-weight:900; font-size:12px;">a</span>';
    if(status === 'HADIR') return '<span style="color:#16a34a; font-weight:900; font-size:18px; line-height:0.5;">.</span>';
    return '';
}

// =============================================
// FUNGSI UTAMA BUKA TAB BARU UNTUK CETAK (TANDA TANGAN FIX SCALE)
// =============================================
function bukaTabCetak(judul, htmlTabel, kepsek, guru) {
    var fullHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <title>Cetak - ${judul}</title>
        <style>
            /* SETTING KERTAS F4 LANDSCAPE & WAJIB 1 HALAMAN */
            @page { size: 330mm 215mm landscape; margin: 0; }
            * { box-sizing: border-box; }
            body { font-family: 'Times New Roman', serif; color: black; margin: 0; padding: 0; background: #525659; display: flex; flex-direction: column; align-items: center; }
            
            .no-print { width: 100%; background: #f8fafc; padding: 15px; text-align: center; border-bottom: 2px solid #cbd5e1; margin-bottom: 20px; font-family: Arial, sans-serif; position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 6px rgba(0,0,0,0.1);}
            .no-print button { padding: 10px 18px; margin: 0 5px; cursor: pointer; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 13px; transition: 0.2s;}
            .no-print button:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
            .no-print button.ttd { background: #f59e0b; }
            .no-print button.cetak { background: #10b981; }
            .no-print button.tutup { background: #ef4444; }
            
            /* Kontainer Kertas F4 - WAJIB RELATIVE untuk TTD agar ukurannya dikunci */
            .print-wrapper { width: 330mm; height: 215mm; background: white; padding: 10mm; position: relative; box-shadow: 0 5px 15px rgba(0,0,0,0.5); overflow: hidden; display: flex; flex-direction: column; }
            
            .print-header { text-align: center; font-weight: bold; margin-bottom: 10px; font-size: 12px; line-height: 1.3; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 5px; font-size: 10px; }
            th, td { border: 1px solid black; padding: 1px 0; text-align: center; height: 13px;}
            th { background-color: #f3f4f6; }
            td.left-align { text-align: left; padding-left: 5px; white-space: nowrap; width: 160px; overflow: hidden; text-overflow: ellipsis; max-width: 160px;}
            
            /* Agar CSS Background Tabel Tercetak di Browser Chrome/Safari */
            .bg-red { background-color: #fca5a5 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;}
            .bg-gray { background-color: #e5e7eb !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;}
            .bg-libur { background-color: #ef4444 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;}
            
            .teks-libur-vertikal {
                writing-mode: vertical-rl;
                transform: rotate(180deg);
                white-space: nowrap;
                overflow: hidden;
                color: #ffffff !important;
                font-weight: 900;
                font-size: 9px;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                width: 100%;
                margin: 0 auto;
            }

            .ttd-area { display: flex; justify-content: space-between; margin-top: auto; padding: 0 50px; font-size: 12px; position: relative;}
            
            /* TTD Draggable */
            .drag-ttd-item { position: absolute; cursor: grab; z-index: 50; padding: 2px; border: 2px dashed #3b82f6; display: flex; align-items: center; justify-content: center;}
            .drag-ttd-item img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
            .drag-ttd-item:active { cursor: grabbing; border-color: #ef4444; }
            .btn-delete-ttd { position: absolute; top: -10px; right: -10px; background: #ef4444; color: white; border-radius: 50%; width: 22px; height: 22px; text-align: center; line-height: 22px; cursor: pointer; font-size: 11px; font-weight:bold; z-index:52;}
            .btn-resize-ttd { position: absolute; bottom: -8px; right: -8px; width: 18px; height: 18px; background: #3b82f6; border: 2px solid white; border-radius: 50%; cursor: nwse-resize; z-index:52;}

            /* Mode Print Beneran */
            @media print {
                body { background: white; margin: 0; }
                .no-print { display: none !important; }
                .print-wrapper { margin: 0; padding: 10mm; width: 330mm; height: 215mm; box-shadow: none; border: none; page-break-after: avoid; }
                .drag-ttd-item { border: none !important; padding: 0;}
                .btn-delete-ttd, .btn-resize-ttd { display: none !important; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
        </style>
    </head>
    <body>
        <div class="no-print">
            <input type="file" id="file-ttd" accept="image/png" style="display:none;" onchange="tambahTtdLokal(event)">
            <button class="ttd" onclick="document.getElementById('file-ttd').click()">✍️ Tambah TTD Lokal</button>
            <button class="cetak" onclick="window.print()">🖨️ Cetak (Save as PDF)</button>
            <button class="tutup" onclick="window.close()">Tutup Tab</button>
        </div>
        
        <div class="print-wrapper" id="print-area">
            <div>
                ${htmlTabel}
            </div>
            <div class="ttd-area">
                <div>Mengetahui,<br>Kepala Sekolah<br><br><br><br><br><b>${kepsek}</b></div>
                <div><br>${guru.jabatan_title || 'Guru Kelas'}<br><br><br><br><br><b>${guru.nama}</b></div>
            </div>
        </div>

        <script>
            function tambahTtdLokal(e) {
                if(e.target.files.length === 0) return;
                var reader = new FileReader();
                reader.onload = function(ev) {
                    var area = document.getElementById('print-area');
                    var wrapper = document.createElement('div');
                    wrapper.className = 'drag-ttd-item';
                    
                    wrapper.style.width = '12%'; 
                    wrapper.style.height = '15%';
                    wrapper.style.left = '75%'; 
                    wrapper.style.top = '75%';

                    var img = document.createElement('img');
                    img.src = ev.target.result;
                    var delBtn = document.createElement('div');
                    delBtn.className = 'btn-delete-ttd no-print'; delBtn.innerHTML = '✕';
                    delBtn.onclick = function() { wrapper.remove(); };
                    var resizeBtn = document.createElement('div');
                    resizeBtn.className = 'btn-resize-ttd no-print'; resizeBtn.title = 'Tarik untuk ubah ukuran';

                    wrapper.appendChild(img); wrapper.appendChild(delBtn); wrapper.appendChild(resizeBtn); area.appendChild(wrapper);

                    var p1=0, p2=0, p3=0, p4=0;
                    wrapper.onmousedown = function(evt) {
                        if(evt.target === delBtn || evt.target === resizeBtn) return; 
                        evt.preventDefault(); p3 = evt.clientX; p4 = evt.clientY;
                        document.onmouseup = function() { document.onmouseup = null; document.onmousemove = null; };
                        document.onmousemove = function(evt) {
                            evt.preventDefault(); p1 = p3 - evt.clientX; p2 = p4 - evt.clientY; p3 = evt.clientX; p4 = evt.clientY;
                            
                            var nTop = wrapper.offsetTop - p2; 
                            var nLeft = wrapper.offsetLeft - p1;
                            
                            if(nTop < 0) nTop = 0; if(nLeft < 0) nLeft = 0;
                            if(nTop + wrapper.offsetHeight > area.offsetHeight) nTop = area.offsetHeight - wrapper.offsetHeight;
                            if(nLeft + wrapper.offsetWidth > area.offsetWidth) nLeft = area.offsetWidth - wrapper.offsetWidth;
                            
                            wrapper.style.top = (nTop / area.offsetHeight * 100) + "%"; 
                            wrapper.style.left = (nLeft / area.offsetWidth * 100) + "%";
                        };
                    };

                    resizeBtn.onmousedown = function(evt) {
                        evt.preventDefault(); evt.stopPropagation();
                        var startX = evt.clientX, startY = evt.clientY;
                        var startWidth = wrapper.offsetWidth, startHeight = wrapper.offsetHeight;
                        document.onmousemove = function(evt) {
                            evt.preventDefault();
                            var nW = Math.max(30, startWidth + (evt.clientX - startX));
                            var nH = Math.max(30, startHeight + (evt.clientY - startY));
                            
                            if(wrapper.offsetLeft + nW > area.offsetWidth) nW = area.offsetWidth - wrapper.offsetLeft;
                            if(wrapper.offsetTop + nH > area.offsetHeight) nH = area.offsetHeight - wrapper.offsetTop;
                            
                            wrapper.style.width = (nW / area.offsetWidth * 100) + "%"; 
                            wrapper.style.height = (nH / area.offsetHeight * 100) + "%";
                        };
                        document.onmouseup = function() { document.onmouseup = null; document.onmousemove = null; };
                    };
                };
                reader.readAsDataURL(e.target.files[0]);
                e.target.value = ""; 
            }
        </script>
    </body>
    </html>
    `;
    var printWindow = window.open('', '_blank');
    printWindow.document.write(fullHtml);
    printWindow.document.close();
}

window.generateRekapWali = function() {
    var ta = document.getElementById('rw-ta').value || "..................";
    var wali = document.getElementById('rw-wali').value || "..................";
    var kepsek = document.getElementById('rw-kepsek').value || "..................";
    var kelas = document.getElementById('pilih-kelas-absen').value;
    
    var namaBulan = new Intl.DateTimeFormat('id-ID', { month:'long', year:'numeric' }).format(kalenderAbsenDate);
    var y = kalenderAbsenDate.getFullYear();
    var m = kalenderAbsenDate.getMonth();
    var daysInMonth = new Date(y, m+1, 0).getDate();

    var siswaKelas = globalSiswaAbsen.filter(s => s.kelas === kelas && s.nis !== "DUMMY_KELAS").sort((a,b) => a.nama.localeCompare(b.nama));
    var riwayat = window.globalDataAbsensi.filter(a => {
        var t = String(a.tanggal).includes("T") ? new Date(a.tanggal) : new Date(String(a.tanggal).replace(/['"]/g, ''));
        return t.getFullYear() === y && t.getMonth() === m && String(a.kelas).trim() === kelas;
    });

    var mapLibur = {};
    window.globalDataAgenda.forEach(a => {
        if(String(a.kategori).toLowerCase().includes("libur nasional")) {
            let dl = new Date(a.tanggal);
            if(dl.getFullYear() === y && dl.getMonth() === m && dl.getDay() !== 0 && dl.getDay() !== 6) {
                mapLibur[dl.getDate()] = a.kegiatan;
            }
        }
    });

    var htmlTabel = `
        <div class="print-header">
            DAFTAR HADIR SISWA KELAS ${kelas.toUpperCase()}<br>
            TAHUN AJARAN ${ta}<br>
            BULAN: ${namaBulan.toUpperCase()}
        </div>
        <table>
            <thead>
                <tr>
                    <th rowspan="2" style="width:25px;">No</th>
                    <th rowspan="2">Nama Siswa</th>
                    <th colspan="${daysInMonth}">Tanggal</th>
                    <th colspan="3">Jumlah</th>
                </tr>
                <tr>
                    ${Array.from({length: daysInMonth}, (_, i) => `<th>${i+1}</th>`).join('')}
                    <th style="width:20px;">S</th><th style="width:20px;">I</th><th style="width:20px;">A</th>
                </tr>
            </thead>
            <tbody>
    `;

    siswaKelas.forEach((s, idx) => {
        var tr = `<tr><td>${idx+1}</td><td class="left-align">${s.nama}</td>`;
        var totS = 0, totI = 0, totA = 0;
        
        for(let d=1; d<=daysInMonth; d++) {
            if (mapLibur[d]) {
                if (idx === 0) {
                    tr += `<td rowspan="${siswaKelas.length}" class="bg-libur holiday-col"><div class="teks-libur-vertikal">${mapLibur[d]}</div></td>`;
                }
            } else {
                var isWeekend = new Date(y, m, d).getDay() === 0 || new Date(y, m, d).getDay() === 6;
                var tdClass = isWeekend ? ' class="bg-gray"' : '';
                var tglCari = y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
                var absenSiswa = riwayat.find(a => {
                    var dStr = String(a.tanggal).includes("T") ? new Date(a.tanggal).toISOString().substring(0,10) : String(a.tanggal).replace(/['"]/g, '').substring(0,10);
                    return dStr === tglCari && String(a.nis).replace(/['"]/g, '').trim() === String(s.nis).replace(/['"]/g, '').trim();
                });

                var mark = "";
                if(absenSiswa) {
                    var st = (absenSiswa.status||"").toUpperCase();
                    mark = getWarnaAbsen(st);
                    if(st === 'SAKIT') totS++; else if(st === 'IZIN') totI++; else if(st.includes('ALP') || st.includes('ALF')) totA++;
                }
                tr += `<td${tdClass}>${mark}</td>`;
            }
        }
        tr += `<td>${totS||''}</td><td>${totI||''}</td><td>${totA||''}</td></tr>`;
        htmlTabel += tr;
    });

    htmlTabel += `</tbody></table>`;
    window.tutupModalAbsen('modal-rekap-wali');
    bukaTabCetak('Rekap Wali Kelas', htmlTabel, kepsek, {jabatan_title: 'Wali Kelas', nama: wali});
};

window.generateRekapStudi = function() {
    var bAwal = parseInt(document.getElementById('rs-bln-awal').value);
    var bAkhir = parseInt(document.getElementById('rs-bln-akhir').value);
    var targetHari = parseInt(document.getElementById('rs-hari').value); 
    var mapel = document.getElementById('rs-mapel').value || "..................";
    var ta = document.getElementById('rs-ta').value || "..................";
    var guru = document.getElementById('rs-guru').value || "..................";
    var kepsek = document.getElementById('rs-kepsek').value || "..................";
    var kelas = document.getElementById('pilih-kelas-absen').value;
    var y = kalenderAbsenDate.getFullYear();

    if (bAkhir < bAwal) return alert("Bulan akhir tidak boleh lebih kecil dari bulan awal!");
    var namaBulanFull = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    var siswaKelas = globalSiswaAbsen.filter(s => s.kelas === kelas && s.nis !== "DUMMY_KELAS").sort((a,b) => a.nama.localeCompare(b.nama));
    
    var mapLiburStudi = {};
    window.globalDataAgenda.forEach(a => {
        if(String(a.kategori).toLowerCase().includes("libur nasional")) {
            let dl = new Date(a.tanggal);
            if(dl.getFullYear() === y && dl.getMonth() >= bAwal && dl.getMonth() <= bAkhir) {
                mapLiburStudi[dl.getMonth() + "-" + dl.getDate()] = a.kegiatan;
            }
        }
    });

    var arrayRangeBulan = [];
    var monthsColsHtml = "";
    var weeksColsHtml = "";
    var mapKolomStudi = []; 

    for(let b = bAwal; b <= bAkhir; b++) {
        arrayRangeBulan.push(b);
        monthsColsHtml += `<th colspan="5">${namaBulanFull[b].toUpperCase()}</th>`;
        weeksColsHtml += `<th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>`;
        
        var datesInMonthForDay = [];
        var dTemp = new Date(y, b, 1);
        while(dTemp.getMonth() === b) {
            if(dTemp.getDay() === targetHari) datesInMonthForDay.push(dTemp.getDate());
            dTemp.setDate(dTemp.getDate() + 1);
        }
        for(let w = 0; w < 5; w++) {
            if(w < datesInMonthForDay.length) {
                mapKolomStudi.push({ bln: b, tgl: datesInMonthForDay[w], isLibur: mapLiburStudi[b + "-" + datesInMonthForDay[w]], valid: true });
            } else {
                mapKolomStudi.push({ valid: false });
            }
        }
    }

    var htmlTabel = `
        <div class="print-header">
            DAFTAR HADIR SISWA KELAS ${kelas.toUpperCase()}<br>
            MATA PELAJARAN: ${mapel.toUpperCase()}<br>
            TAHUN AJARAN ${ta}
        </div>
        <table>
            <thead>
                <tr>
                    <th rowspan="2" style="width:30px;">NO</th>
                    <th rowspan="2" style="width:250px;">NAMA SISWA</th>
                    ${monthsColsHtml}
                </tr>
                <tr>${weeksColsHtml}</tr>
            </thead>
            <tbody>
    `;

    siswaKelas.forEach((s, idx) => {
        var tr = `<tr><td>${idx+1}</td><td class="left-align">${s.nama}</td>`;
        
        mapKolomStudi.forEach(k => {
            if (k.valid) {
                if (k.isLibur) {
                    if (idx === 0) {
                        tr += `<td rowspan="${siswaKelas.length}" class="bg-libur holiday-col"><div class="teks-libur-vertikal">${k.isLibur}</div></td>`;
                    }
                } else {
                    var mark = "";
                    var tglCari = y + '-' + String(k.bln+1).padStart(2,'0') + '-' + String(k.tgl).padStart(2,'0');
                    var absenSiswa = window.globalDataAbsensi.find(a => {
                        var dStr = String(a.tanggal).includes("T") ? new Date(a.tanggal).toISOString().substring(0,10) : String(a.tanggal).replace(/['"]/g, '').substring(0,10);
                        return dStr === tglCari && String(a.nis).replace(/['"]/g, '').trim() === String(s.nis).replace(/['"]/g, '').trim() && String(a.kelas).trim() === kelas;
                    });

                    if(absenSiswa) {
                        mark = getWarnaAbsen((absenSiswa.status||"").toUpperCase());
                    }
                    tr += `<td>${mark}</td>`;
                }
            } else {
                tr += `<td class="bg-gray"></td>`; 
            }
        });
        
        tr += `</tr>`;
        htmlTabel += tr;
    });

    htmlTabel += `</tbody></table>`;
    window.tutupModalAbsen('modal-rekap-studi');
    bukaTabCetak('Rekap Bidang Studi', htmlTabel, kepsek, {jabatan_title: 'Guru Bidang Studi', nama: guru});
};

window.tutupModalAbsen = function(id) { document.getElementById(id).classList.remove('active'); };
