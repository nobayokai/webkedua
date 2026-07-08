const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw72VAmuae0gBueTndaZpL8NrUJkl2K1M-lVpMJSUsMKBjo1o6Bafc5mdrzJXOH7toQBg/exec';

// ============================================
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
        labelNis.textContent  = 'NIP';
        labelPass.textContent = 'Password';
        inputNis.placeholder  = 'Masukkan NIP kamu';
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

    if (!nis || !pass) {
        showLoginPopup('error', '⚠️ Harap isi NIS dan Password!');
        return;
    }

    // Tampilkan popup loading
    const modal = showLoginPopup('loading', '⏳ Sedang verifikasi...');

    try {
        const params = new URLSearchParams({
            action : 'login',
            role   : currentRole,
            nis    : nis,
            pass   : pass
        });

        const res  = await fetch(`${SCRIPT_URL}?${params}`);
        const data = await res.json();

        // Hapus popup loading
        modal.remove();

        if (data.status === 'success') {  
            localStorage.setItem('user_login', JSON.stringify({  
                nama  : data.nama,  
                role  : currentRole,  
                id    : data.id,  
                token : data.token  
            }));  

            updateMenuLogin();  

            // Tampilkan popup sukses dengan nama  
            const successModal = showLoginPopup('success', `Selamat datang, ${data.nama}`);  
            
            // PERBAIKAN DI SINI: Menggunakan currentRole, bukan role
            if (currentRole === 'guru') {
                const tabAgenda = document.getElementById('tab-agenda');
                if(tabAgenda) tabAgenda.style.display = 'inline-block'; 
            }
            
            setTimeout(() => {  
                successModal.remove();  
                const tabBeranda = document.querySelector('.tab');  
                loadPage('beranda-konten.html', tabBeranda);  
            }, 1500);  

        } else {  
            // Pesan error baru  
            showLoginPopup('error', 'Sepertinya data yang kamu masukan salah');  
        }  

    } catch (err) {
        modal.remove();
        console.error(err); // Tambahan untuk melihat detail error di inspect element
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
// UPDATE MENU LOGIN/LOGOUT
// =============================================
function updateMenuLogin() {
    const userLogin = localStorage.getItem('user_login');
    const tabLogin  = document.getElementById('tab-login');
    const tabLogout = document.getElementById('tab-logout');

    if (!tabLogin || !tabLogout) {
        console.warn('tab-login atau tab-logout tidak ditemukan!');
        return;
    }

    if (userLogin) {
        tabLogin.style.display  = 'none';
        tabLogout.style.display = '';
        const user = JSON.parse(userLogin);
        tabLogout.innerHTML = `<span style="color:#ff3b30;">Logout</span>`;
    } else {
        tabLogin.style.display  = '';
        tabLogout.style.display = 'none';
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
// LOAD PAGE
// =============================================
async function loadPage(namaFile, elemenTab) {
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    if (elemenTab) elemenTab.classList.add('active');

    const areaKonten = document.getElementById('area-konten');

    try {
        areaKonten.innerHTML = '<p id="status-loading">Memuat halaman...</p>';

        const response = await fetch(namaFile);
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
// VARIABEL GLOBAL GOOGLE MAPS
// =============================================
let googleMap;
let googleMarker;

// =============================================
// FUNGSI INISIALISASI GOOGLE MAPS
// =============================================
function initMapSiswaBaru() {
    const mapContainer = document.getElementById('map');
    
    // Cegah error jika wadah map tidak ada atau Google Maps gagal dimuat
    if (!mapContainer || typeof google === 'undefined') return;

    // Titik awal default (Area Bekasi)
    const defaultLokasi = { lat: -6.208763, lng: 106.845599 };

    // Buat Peta
    googleMap = new google.maps.Map(mapContainer, {
        zoom: 15,
        center: defaultLokasi,
        mapTypeControl: false,
        streetViewControl: false // Sembunyikan ikon orang kuning agar lebih rapi
    });

    // Buat Marker (Pin Merah)
    googleMarker = new google.maps.Marker({
        position: defaultLokasi,
        map: googleMap,
        draggable: true // Pin bisa digeser-geser manual
    });

    // 1. Fungsi saat PETA diklik sembarang
    googleMap.addListener("click", (mapsMouseEvent) => {
        const posisi = mapsMouseEvent.latLng;
        googleMarker.setPosition(posisi);
        document.getElementById('latitude').value = posisi.lat();
        document.getElementById('longitude').value = posisi.lng();
    });

    // 2. Fungsi saat PIN MERAH selesai DIGESER
    googleMarker.addListener("dragend", () => {
        const posisi = googleMarker.getPosition();
        document.getElementById('latitude').value = posisi.lat();
        document.getElementById('longitude').value = posisi.lng();
    });

    // 3. Deteksi Lokasi Otomatis (Jika diizinkan user)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const posUser = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                googleMap.setCenter(posUser);
                googleMarker.setPosition(posUser);
                document.getElementById('latitude').value = posUser.lat;
                document.getElementById('longitude').value = posUser.lng;
            }
        );
    }
}

// ==========================================
// FUNGSI TOMBOL DETEKSI LOKASI SAAT INI
// ==========================================
function deteksiLokasiSaya() {
    // Pastikan Google Maps sudah siap
    if (!googleMap || !googleMarker) {
        alert("Peta belum siap, silakan tunggu sebentar.");
        return;
    }

    if (navigator.geolocation) {
        // Tampilkan teks sementara agar user tahu sistem sedang bekerja
        document.getElementById('latitude').value = "Mendeteksi...";
        document.getElementById('longitude').value = "Mendeteksi...";

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const posUser = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                
                // Pindahkan kamera peta dan pin merah ke lokasi user
                googleMap.setCenter(posUser);
                googleMap.setZoom(18); // Zoom lebih dekat agar akurat
                googleMarker.setPosition(posUser);

                // Isi otomatis kolom lintang dan bujur
                document.getElementById('latitude').value = posUser.lat;
                document.getElementById('longitude').value = posUser.lng;
            },
            (error) => {
                alert("❌ Gagal mendapatkan lokasi. Pastikan GPS aktif dan Anda mengizinkan akses lokasi di browser.");
                document.getElementById('latitude').value = "";
                document.getElementById('longitude').value = "";
            },
            { enableHighAccuracy: true } // Minta akurasi GPS tertinggi
        );
    } else {
        alert("Browser Anda tidak mendukung fitur deteksi lokasi.");
    }
}

// ==========================================
// FUNGSI SUBMIT FORMULIR SISWA BARU
// =========================================
async function submitFormSiswaBaru(e) {
    e.preventDefault(); // Mencegah halaman berkedip/refresh saat disubmit

    const form = document.getElementById('formSiswaBaru');
    
    // 1. Cek Validasi Bawaan HTML
    // Jika ada input bertanda 'required' yang kosong, paksa browser menampilkannya
    if (!form.checkValidity()) {
        form.reportValidity(); 
        return; // Hentikan proses jika masih ada yang kosong
    }

    // 2. Cek Khusus Koordinat Peta
    const lat = document.getElementById('latitude').value;
    const lng = document.getElementById('longitude').value;
    
    if (!lat || !lng) {
        // Gunakan popup estetik Bapak jika peta belum diisi
        showLoginPopup('error', '⚠️ Harap tandai LOKASI TEMPAT TINGGAL menggunakan peta atau tombol lokasi.');
        return; 
    }

    // 3. Munculkan popup loading
    const modal = showLoginPopup('loading', '⏳ Sedang menyimpan data pendaftaran...');

    // 4. Ambil semua data dari kolom isian form
    const dataSiswa = {
        action: "daftar_siswa_baru", // Penanda untuk Google Apps Script
        nama_lengkap: document.getElementById('nama_lengkap').value,
        jenis_kelamin: document.getElementById('jenis_kelamin').value,
        nisn: document.getElementById('nisn').value,
        nik: document.getElementById('nik').value,
        no_kk: document.getElementById('no_kk').value,
        no_reg_akta: document.getElementById('no_reg_akta').value,
        tempat_lahir: document.getElementById('tempat_lahir').value,
        tanggal_lahir: document.getElementById('tanggal_lahir').value,
        agama: document.getElementById('agama').value,
        kewarganegaraan: document.getElementById('kewarganegaraan').value,
        kebutuhan_khusus: document.getElementById('kebutuhan_khusus').value,
        alamat: document.getElementById('alamat').value,
        rt: document.getElementById('rt').value,
        rw: document.getElementById('rw').value,
        nama_dusun: document.getElementById('nama_dusun').value,
        kelurahan: document.getElementById('kelurahan').value,
        kecamatan: document.getElementById('kecamatan').value,
        kode_pos: document.getElementById('kode_pos').value,
        latitude: lat,
        longitude: lng,
        tempat_tinggal: document.getElementById('tempat_tinggal').value,
        moda_transportasi: document.getElementById('moda_transportasi').value,
        nama_ayah: document.getElementById('nama_ayah').value,
        nik_ayah: document.getElementById('nik_ayah').value,
        tahun_lahir_ayah: document.getElementById('tahun_lahir_ayah').value,
        pendidikan_ayah: document.getElementById('pendidikan_ayah').value,
        nama_ibu: document.getElementById('nama_ibu').value,
        nik_ibu: document.getElementById('nik_ibu').value,
        tahun_lahir_ibu: document.getElementById('tahun_lahir_ibu').value,
        pendidikan_ibu: document.getElementById('pendidikan_ibu').value,
        no_hp: document.getElementById('no_hp').value,
        email: document.getElementById('email').value,
        tinggi_badan: document.getElementById('tinggi_badan').value,
        berat_badan: document.getElementById('berat_badan').value
    };

    try {
        // 5. Kirim data ke Google Apps Script
        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataSiswa)
        });

        // 6. Hilangkan loading, ganti dengan popup pesan sukses
        modal.remove();
        const successModal = showLoginPopup('success', '✅ Data pendaftaran berhasil disimpan!');

        // Kosongkan isian form setelah sukses tersimpan
        document.getElementById('formSiswaBaru').reset();

        // Kembalikan pin peta ke posisi awal (jika ada)
        if (typeof googleMap !== 'undefined' && googleMap) {
            googleMap.setCenter({ lat: -6.208763, lng: 106.845599 });
            googleMap.setZoom(15);
        }

        // Sembunyikan popup sukses secara otomatis
        setTimeout(() => {
            if (successModal) successModal.remove();
        }, 2500);

    } catch (error) {
        // 7. Jika gagal (misal tidak ada internet), munculkan popup error
        modal.remove();
        showLoginPopup('error', '❌ Gagal mengirim data. Silakan periksa koneksi internet.');
    }
}

// =============================================
// FITUR ABSENSI GURU (LMS)
// =============================================
let globalSiswa = [];

// Fungsi untuk menyiapkan tampilan saat menu Absensi diklik
function initAbsensi() {
    const tglAbsen = document.getElementById('tgl-absen');
    if (tglAbsen) tglAbsen.valueAsDate = new Date(); // Set tanggal hari ini

    // Verifikasi Akses (Pastikan hanya Guru yang bisa melihat form)
    // Catatan: Key yang benar di sistem login Bapak adalah 'user_login'
    const userLogStr = localStorage.getItem("user_login"); 
    const panelAbsen = document.getElementById("panel-absen");
    
    if (panelAbsen) {
        if (!userLogStr) {
            panelAbsen.style.display = "block";
            panelAbsen.innerHTML = `<div style="text-align:center; padding: 50px;"><h2 style="color:#ef4444;">⛔ Akses Ditolak</h2><p>Harap login sebagai Guru untuk mengakses menu absensi ini.</p></div>`;
            return;
        }

        const userLog = JSON.parse(userLogStr);
        if (userLog.role !== 'guru') {
            panelAbsen.style.display = "block";
            panelAbsen.innerHTML = `<div style="text-align:center; padding: 50px;"><h2 style="color:#ef4444;">⛔ Akses Ditolak</h2><p>Hanya Guru yang dapat mengakses menu absensi ini.</p></div>`;
        } else {
            panelAbsen.style.display = "block";
        }
    }
}

// Mengambil Data Siswa berdasarkan Kelas dari Google Sheets
async function loadDaftarSiswa() {
    const kelas = document.getElementById('pilih-kelas').value;
    const container = document.getElementById('daftar-siswa-container');
    const btnSubmit = document.getElementById('btn-submit-absen');
    
    if(!kelas) {
        container.innerHTML = `<div style="text-align: center; color: #9ca3af; padding: 30px; font-weight: bold; border: 2px dashed #d1d5db; border-radius: 12px;">Silakan pilih kelas terlebih dahulu.</div>`;
        btnSubmit.disabled = true;
        return;
    }

    document.getElementById('loader-siswa').style.display = "block";
    container.innerHTML = "";
    btnSubmit.disabled = true;

    try {
        // Memanfaatkan SCRIPT_URL yang sudah ada di baris paling atas script.js
        const res = await fetch(SCRIPT_URL + "?action=get_siswa");
        const json = await res.json();
        
        if(json.status === 'success') {
            globalSiswa = json.data;
            const siswaKelasIni = globalSiswa.filter(s => s.kelas === kelas);
            
            if(siswaKelasIni.length === 0) {
                container.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 30px; font-weight: bold; border: 2px dashed #fca5a5; border-radius: 12px;">Belum ada data siswa di ${kelas}.<br><br>Klik tombol "Tambah Siswa" di atas.</div>`;
            } else {
                renderTableSiswa(siswaKelasIni);
                btnSubmit.disabled = false;
            }
        }
    } catch(e) {
        container.innerHTML = `<h3 style="color:red; text-align:center;">Gagal memuat data. Periksa koneksi internet.</h3>`;
    } finally {
        document.getElementById('loader-siswa').style.display = "none";
    }
}

// Menampilkan Data Siswa beserta Tombol Radio Absensi
function renderTableSiswa(dataSiswa) {
    const container = document.getElementById('daftar-siswa-container');
    container.innerHTML = "";
    
    // Urutkan berdasarkan nama abjad (A-Z)
    dataSiswa.sort((a,b) => a.nama.localeCompare(b.nama));

    dataSiswa.forEach((s, index) => {
        container.innerHTML += `
            <div class="siswa-card" id="card-${s.nis}">
                <div class="siswa-info">
                    <div class="siswa-nama">${index + 1}. ${s.nama}</div>
                    <div class="siswa-nis">NIS: ${s.nis}</div>
                </div>
                <div style="display:flex; align-items:center; gap: 15px;">
                    <div class="radio-group">
                        <input type="radio" id="h-${s.nis}" name="absen_${s.nis}" value="Hadir" checked>
                        <label for="h-${s.nis}">H</label>
                        
                        <input type="radio" id="i-${s.nis}" name="absen_${s.nis}" value="Izin">
                        <label for="i-${s.nis}">I</label>
                        
                        <input type="radio" id="s-${s.nis}" name="absen_${s.nis}" value="Sakit">
                        <label for="s-${s.nis}">S</label>
                        
                        <input type="radio" id="a-${s.nis}" name="absen_${s.nis}" value="Alpa">
                        <label for="a-${s.nis}">A</label>
                    </div>
                    <button type="button" class="btn-hapus-siswa" title="Hapus Siswa" onclick="hapusSiswa('${s.nis}', '${s.nama}')">🗑️</button>
                </div>
            </div>
        `;
    });
}

// Modal Tambah Siswa Baru
function bukaModalTambah() {
    const kelas = document.getElementById('pilih-kelas').value;
    if(!kelas) return alert("Pilih kelas terlebih dahulu sebelum menambah siswa!");
    document.getElementById('add-kelas').value = kelas;
    document.getElementById('add-nis').value = "";
    document.getElementById('add-nama').value = "";
    document.getElementById('modal-tambah').classList.add('active');
}

function tutupModalTambah() { 
    document.getElementById('modal-tambah').classList.remove('active'); 
}

// Kirim Data Siswa Baru ke Database
async function simpanSiswaBaru() {
    const kelas = document.getElementById('add-kelas').value;
    const nis = document.getElementById('add-nis').value;
    const nama = document.getElementById('add-nama').value;
    if(!nis || !nama) return alert("NIS dan Nama wajib diisi!");

    const btn = document.querySelector('#modal-tambah .btn-green');
    btn.innerHTML = "Menyimpan..."; btn.disabled = true;

    const payload = { action: "add_siswa_kelas", kelas: kelas, nis: nis, nama: nama };
    
    try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
        const result = await res.json();
        if(result.status === "success") {
            alert("Berhasil! Siswa ditambahkan.");
            tutupModalTambah();
            loadDaftarSiswa(); // Refresh otomatis
        }
    } catch(e) { 
        alert("Gagal menyimpan data!"); 
    } finally { 
        btn.innerHTML = "Simpan"; btn.disabled = false; 
    }
}

// Menghapus Siswa
async function hapusSiswa(nis, nama) {
    if(!confirm(`Apakah Anda yakin ingin MENGHAPUS data siswa bernama: ${nama} (NIS: ${nis}) dari database?`)) return;

    document.getElementById(`card-${nis}`).style.opacity = "0.5";

    try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "delete_siswa", nis: nis }) });
        const result = await res.json();
        if(result.status === "success") {
            alert("Siswa berhasil dihapus.");
            loadDaftarSiswa(); // Refresh otomatis
        } else { 
            alert("Gagal: " + result.message); 
        }
    } catch(e) { 
        alert("Gagal terhubung ke server."); 
        document.getElementById(`card-${nis}`).style.opacity = "1"; 
    }
}

// Menyimpan Rekap Absensi
async function submitAbsensi(e) {
    e.preventDefault();
    const tanggal = document.getElementById('tgl-absen').value;
    const kelas = document.getElementById('pilih-kelas').value;
    const btn = document.getElementById('btn-submit-absen');
    
    const kelasSiswa = globalSiswa.filter(s => s.kelas === kelas);
    let dataAbsen = [];

    // Baca radio button mana saja yang di-klik
    kelasSiswa.forEach(s => {
        const radioTerpilih = document.querySelector(`input[name="absen_${s.nis}"]:checked`);
        if(radioTerpilih) {
            dataAbsen.push({ nis: s.nis, nama: s.nama, status: radioTerpilih.value });
        }
    });

    if(dataAbsen.length === 0) return alert("Tidak ada data siswa untuk diabsen.");
    if(!confirm(`Kirim data absensi ${kelas} untuk tanggal ${tanggal}?`)) return;

    btn.innerHTML = "⏳ Sedang Mengirim Data..."; btn.disabled = true;

    const payload = { action: "submit_absensi", tanggal: tanggal, kelas: kelas, data_absen: dataAbsen };

    try {
        const res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
        const result = await res.json();
        if(result.status === "success") {
            alert("Absensi berhasil disimpan ke Database!");
            // Update widget kalender kiri (Jika function-nya ada)
            if(typeof fetchRekapAbsensi === "function") { fetchRekapAbsensi(); }
        }
    } catch(e) { 
        alert("Terjadi kesalahan sistem saat mengirim data."); 
    } finally { 
        btn.innerHTML = "✅ Simpan Data Absensi"; btn.disabled = false; 
    }
}
