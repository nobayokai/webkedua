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

    if (input.type === 'password') {
        input.type = 'text';
        iconEl.textContent = '🙈';
    } else {
        input.type = 'password';
        iconEl.textContent = '👁️';
    }
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
        labelNis.textContent  = 'NIS';
        labelPass.textContent = 'Password';
        inputNis.placeholder  = 'Masukkan NIS kamu';
        if (btnLogin) btnLogin.className = 'btn-login siswa';
    } else {
        // PERBAIKAN: Ubah tulisan NIP menjadi Email agar selaras dengan Database
        labelNis.textContent  = 'Email Guru';
        labelPass.textContent = 'Password';
        inputNis.placeholder  = 'Masukkan Email kamu';
        if (btnLogin) btnLogin.className = 'btn-login guru';
    }

    document.getElementById('input-nis').value  = '';
    document.getElementById('input-pass').value = '';
    document.getElementById('pesan-login').textContent = '';
}


// =============================================
// HANDLE LOGIN DENGAN POPUP
// =============================================
// =============================================
// HANDLE LOGIN DENGAN POPUP
// =============================================
async function handleLogin(e) {
    e.preventDefault();

    const nis   = document.getElementById('input-nis').value.trim();
    const pass  = document.getElementById('input-pass').value.trim();

    if (!nis || !pass) {
        showLoginPopup('error', '⚠️ Harap isi NIS dan Password!');
        return;
    }

    const modal = showLoginPopup('loading', '⏳ Sedang verifikasi...');

    try {
        const params = new URLSearchParams({ action : 'login', role : currentRole, nis : nis, pass : pass });
        const res  = await fetch(`${SCRIPT_URL}?${params}`);
        const data = await res.json();

        modal.remove();

        if (data.status === 'success') {  
            localStorage.setItem('user_login', JSON.stringify({  
                nama    : data.nama,  
                role    : currentRole,
                jabatan : data.jabatan, // Menyimpan jabatan (kepsek/guru_kelas/dll)
                id      : data.id,  
                token   : data.token  
            }));  

            updateMenuLogin();  

            const successModal = showLoginPopup('success', `Selamat datang, ${data.nama}`);  
            
            setTimeout(() => {  
                successModal.remove();  
                const tabBeranda = document.querySelector('.tab');  
                loadPage('beranda-konten.html', tabBeranda);  
            }, 1500);  

        } else {  
            showLoginPopup('error', 'Sepertinya data yang kamu masukan salah');  
        }  

    } catch (err) {
        modal.remove();
        console.error(err); 
        showLoginPopup('error', '❌ Gagal terhubung ke server!');
    }
}


// =============================================
// FUNGSI POPUP LOGIN (Aesthetic Version)
// =============================================
function showLoginPopup(type, message) {
    const oldModal = document.querySelector('.modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.className = 'modal';

    let contentHTML = '';

    if (type === 'loading') {
        contentHTML = `
            <div class="modal-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    } else if (type === 'success') {
        contentHTML = `
            <div class="modal-content success">
                <div class="modal-icon">✅</div>
                <p>${message}</p>
            </div>
        `;
    } else if (type === 'error') {
        contentHTML = `
            <div class="modal-content error">
                <div class="modal-icon">❌</div>
                <p>${message}</p>
            </div>
        `;
    }

    modal.innerHTML = contentHTML;
    document.body.appendChild(modal);

    if (type !== 'loading') {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.remove();
        });
    }

    return modal;
}





// =============================================
// UPDATE MENU LOGIN/LOGOUT (Memunculkan Absensi & Supervisi)
// =============================================
function updateMenuLogin() {
    const userLogin = localStorage.getItem('user_login');
    const tabLogin  = document.getElementById('tab-login');
    const tabLogout = document.getElementById('tab-logout');
    
    // Target Menu
    const tabAbsensi = document.getElementById('tab-absensi'); 
    const tabSupervisi = document.getElementById('tab-supervisi'); 

    if (userLogin) {
        if(tabLogin) tabLogin.style.display  = 'none';
        if(tabLogout) tabLogout.style.display = '';
        
        const user = JSON.parse(userLogin);
        if(tabLogout) tabLogout.innerHTML = `<span style="color:#ff3b30;">Logout</span>`;
        
        // Munculkan menu HANYA sesuai role (Guru / Kepsek)
        if (tabAbsensi) tabAbsensi.style.display = (user.role === 'guru' || user.role === 'kepsek') ? 'inline-block' : 'none';
        if (tabSupervisi) tabSupervisi.style.display = (user.role === 'guru' || user.role === 'kepsek') ? 'inline-block' : 'none';
        
    } else {
        if(tabLogin) tabLogin.style.display  = '';
        if(tabLogout) tabLogout.style.display = 'none';
        if(tabAbsensi) tabAbsensi.style.display = 'none'; 
        if(tabSupervisi) tabSupervisi.style.display = 'none'; 
    }
}


// =============================================
// HANDLE LOGOUT
// =============================================
function handleLogout() {
    localStorage.removeItem('user_login');

    const logoutModal = showLoginPopup('success', 'Kamu telah berhasil keluar');

    setTimeout(() => {
        if (logoutModal) logoutModal.remove();
        location.reload();
    }, 1600);
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

        // PERBAIKAN: Tambahkan parameter waktu agar browser selalu memuat file HTML terbaru!
        const urlBebasCache = namaFile + '?v=' + new Date().getTime();
        const response = await fetch(urlBebasCache);
        
        if (!response.ok) throw new Error('Halaman tidak ditemukan');

        const htmlContent = await response.text();
        areaKonten.innerHTML = '';


        const temp = document.createElement('div');
        temp.innerHTML = htmlContent;

        Array.from(temp.childNodes).forEach(node => {
            areaKonten.appendChild(node.cloneNode(true));
        });

        // Eksekusi script di dalam halaman
        Array.from(areaKonten.querySelectorAll('script')).forEach(oldScript => {
            const newScript = document.createElement('script');
            if (oldScript.src) {
                newScript.src = oldScript.src;
                newScript.async = false;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            document.head.appendChild(newScript);
            oldScript.remove();
        });

    } catch (error) {
        areaKonten.innerHTML = `<p style="color:red;">Gagal memuat halaman: ${error.message}</p>`;
    }
}


// =============================================
// INIT
// =============================================
window.onload = () => {
    updateMenuLogin();
    const tabPertama = document.querySelector('.tab');
    loadPage('beranda-konten.html', tabPertama);
};



// =============================================
// FITUR ABSENSI GURU (KALENDER INTERAKTIF & IPHONE LOADING)
// =============================================
var globalSiswaAbsen = [];
var kalenderAbsenDate = new Date();
var tglPilihanAbsen = "";

window.initAbsensi = async function() {
    var userLogStr = localStorage.getItem("user_login");
    var panelAbsen = document.getElementById("panel-absen");
    if (!panelAbsen) return;

    if (!userLogStr) {
        panelAbsen.innerHTML = `<div style="text-align:center; padding: 50px;"><h2>⛔ Akses Ditolak</h2><p>Harap login untuk mengakses menu ini.</p></div>`;
        return;
    }
    var userLog = JSON.parse(userLogStr);
    if (userLog.role !== 'guru') {
        panelAbsen.innerHTML = `<div style="text-align:center; padding: 50px;"><h2>⛔ Akses Ditolak</h2><p>Hanya Guru yang dapat mengakses menu absensi.</p></div>`;
        return;
    }

    document.getElementById('main-absen-ui').style.display = 'block';
    
    // Eksekusi penarikan data langsung dengan Loading iPhone
    await window.loadDataAbsensiUtama();
};

window.loadDataAbsensiUtama = async function() {
    // 1. Munculkan Animasi Loading iPhone dengan Teks "Memuat Data..."
    var iosLoad = document.getElementById('ios-loading');
    var iosText = document.querySelector('#ios-loading .ios-loading-text');
    if(iosLoad && iosText) { 
        iosText.textContent = "Menyinkronkan Data..."; 
        iosLoad.classList.add('active'); 
    }

    try {
        var [resSiswa, resAbsen] = await Promise.all([
            fetch(SCRIPT_URL + "?action=get_siswa"),
            fetch(SCRIPT_URL + "?action=get_rekap_absensi")
        ]);
        
        var jsonSiswa = await resSiswa.json();
        var jsonAbsen = await resAbsen.json();
        
        if(jsonSiswa.status === 'success') {
            globalSiswaAbsen = jsonSiswa.data;
            window.globalDataAbsensi = jsonAbsen.data || []; 
            
            var kelasSet = new Set();
            globalSiswaAbsen.forEach(function(s) {
                if(s.kelas && s.nis !== "DUMMY_KELAS") kelasSet.add(s.kelas);
            });

            var sel = document.getElementById('pilih-kelas-absen');
            var curr = sel ? sel.value : "";
            if(sel) {
                sel.innerHTML = '<option value="">-- Pilih Kelas --</option>';
                Array.from(kelasSet).sort().forEach(function(k) {
                    sel.innerHTML += `<option value="${k}">${k}</option>`;
                });
                if(curr && kelasSet.has(curr)) sel.value = curr;
            }
        }
    } catch(e) { console.log("Gagal load data", e); }
    
    // 2. Matikan Animasi Loading setelah selesai
    if(iosLoad) iosLoad.classList.remove('active');
    document.getElementById('absen-loading-teks').style.display = 'none'; // Sembunyikan teks loading usang
    window.renderKalenderAbsensi();
};

window.gantiKelasAbsen = function() { window.renderKalenderAbsensi(); };
window.navAbsenBulan = function(dir) { kalenderAbsenDate.setMonth(kalenderAbsenDate.getMonth() + dir); window.renderKalenderAbsensi(); };

window.renderKalenderAbsensi = function() {
    var grid = document.getElementById('absen-cal-grid');
    var label = document.getElementById('absen-bulan-label');
    if(!grid) return;

    var y = kalenderAbsenDate.getFullYear(); var m = kalenderAbsenDate.getMonth();
    label.textContent = new Intl.DateTimeFormat('id-ID', { month:'long', year:'numeric' }).format(kalenderAbsenDate);
    grid.innerHTML = '';

    var first = new Date(y, m, 1); var last = new Date(y, m+1, 0); var today = new Date();
    var startIndex = (first.getDay() + 6) % 7;

    for(var i=0; i<startIndex; i++) { grid.innerHTML += `<div class="absen-day muted"></div>`; }

    var kelasTerpilih = document.getElementById('pilih-kelas-absen').value;

    for(var day=1; day<=last.getDate(); day++) {
        var isToday = (day === today.getDate() && m === today.getMonth() && y === today.getFullYear()) ? 'today' : '';
        var tglStr = y + '-' + String(m+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');

        var onClick = kelasTerpilih ? `onclick="window.bukaModalAbsenTgl('${tglStr}')"` : `onclick="alert('Pilih kelas di atas terlebih dahulu!')"`;

        grid.innerHTML += `<div class="absen-day ${isToday}" ${onClick}>${day}</div>`;
    }
};

window.bukaModalAbsenTgl = function(tgl) {
    var kelas = document.getElementById('pilih-kelas-absen').value;
    tglPilihanAbsen = tgl;
    document.getElementById('judul-absen-tgl').textContent = `Absensi ${kelas} (${tgl})`;

    var container = document.getElementById('list-siswa-absen');
    container.innerHTML = "";

    var siswaKelas = globalSiswaAbsen.filter(function(s) { return s.kelas === kelas && s.nis !== "DUMMY_KELAS"; });
    siswaKelas.sort(function(a,b){ return a.nama.localeCompare(b.nama); });

    // CARI RIWAYAT ABSEN (Dengan Pembersihan Tanda Petik & Zone Waktu Ekstra Ketat)
    var riwayatAbsen = window.globalDataAbsensi ? window.globalDataAbsensi.filter(function(a) {
        var tglBersih = "";
        var strTgl = String(a.tanggal).trim();
        if (strTgl.includes("T")) {
             var d = new Date(strTgl);
             tglBersih = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        } else {
             tglBersih = strTgl.replace(/['"]/g, '').substring(0, 10);
        }
        var kelasBersih = a.kelas ? String(a.kelas).trim() : "";
        return tglBersih === tgl && kelasBersih === kelas;
    }) : [];

    if(siswaKelas.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#6b7280; font-weight:bold; padding:20px;'>Belum ada siswa di kelas ini.</p>";
    } else {
        siswaKelas.forEach(function(s, index) {
            var statusSiswa = "Hadir"; 
            
            // Pencocokan NIS dan Nama yang kebal dari tanda petik (') Google Sheet
            var absenSiswaIni = riwayatAbsen.find(function(a) { 
                var dbNis = String(a.nis).replace(/['"]/g, '').trim();
                var localNis = String(s.nis).replace(/['"]/g, '').trim();
                var dbNama = String(a.nama).trim().toLowerCase();
                var localNama = String(s.nama).trim().toLowerCase();
                return dbNis === localNis || dbNama === localNama; 
            });
            
            if(absenSiswaIni) {
                var statDb = (absenSiswaIni.status || "").toUpperCase().trim();
                if(statDb === 'SAKIT') statusSiswa = "Sakit";
                else if(statDb === 'IZIN') statusSiswa = "Izin";
                else if(statDb === 'ALPA' || statDb === 'ALFA') statusSiswa = "Alpa";
            }

            var chkH = statusSiswa === "Hadir" ? "checked" : "";
            var chkS = statusSiswa === "Sakit" ? "checked" : "";
            var chkI = statusSiswa === "Izin" ? "checked" : "";
            var chkA = statusSiswa === "Alpa"  ? "checked" : "";

            container.innerHTML += `
                <div class="siswa-card-absen">
                    <div><b style="color:#1f2937;">${index+1}. ${s.nama}</b><br><small style="color:#6b7280;">NIS: ${s.nis}</small></div>
                    <div class="radio-group-absen">
                        <input type="radio" id="h-${s.nis}" name="absen_${s.nis}" value="Hadir" ${chkH}><label for="h-${s.nis}">H</label>
                        <input type="radio" id="s-${s.nis}" name="absen_${s.nis}" value="Sakit" ${chkS}><label for="s-${s.nis}">S</label>
                        <input type="radio" id="i-${s.nis}" name="absen_${s.nis}" value="Izin" ${chkI}><label for="i-${s.nis}">I</label>
                        <input type="radio" id="a-${s.nis}" name="absen_${s.nis}" value="Alpa" ${chkA}><label for="a-${s.nis}">A</label>
                    </div>
                </div>
            `;
        });
    }
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
    
    // Teks Loading Menjadi "Menyimpan"
    var iosLoad = document.getElementById('ios-loading');
    var iosText = document.querySelector('#ios-loading .ios-loading-text');
    if(iosLoad && iosText) { iosText.textContent = "Menyimpan..."; iosLoad.classList.add('active'); }

    var payload = { action: "submit_absensi", tanggal: tglPilihanAbsen, kelas: kelas, data_absen: dataAbsen };

    try {
        await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
        await window.loadDataAbsensiUtama(); // REFRESH AGAR BISA LANGSUNG DIEDIT
        if(typeof fetchRekapAbsensi === "function") { fetchRekapAbsensi(); } 
    } catch(e) {
        alert("Gagal menyimpan data!");
    } finally {
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

window.tutupModalAbsen = function(id) { document.getElementById(id).classList.remove('active'); };
