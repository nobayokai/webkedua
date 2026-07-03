const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx3FrVGfLdH64N_uiBKprAWg7W0nYqabg9bBcmGh94AIfoV-2hQruJk6EO2GybHNdm9xA/exec';

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

    // 1. Munculkan popup loading
    const modal = showLoginPopup('loading', '⏳ Sedang menyimpan data pendaftaran...');

    // 2. Ambil semua data dari kolom isian form
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
        latitude: document.getElementById('latitude').value,
        longitude: document.getElementById('longitude').value,
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
        // 3. Kirim data ke Google Apps Script (menggunakan SCRIPT_URL yang ada di paling atas)
        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataSiswa)
        });

        // 4. Hilangkan loading, ganti dengan popup pesan sukses
        modal.remove();
        const successModal = showLoginPopup('success', '✅ Data pendaftaran berhasil disimpan!');

        // Kosongkan isian form setelah sukses tersimpan
        document.getElementById('formSiswaBaru').reset();

        // Sembunyikan popup sukses secara otomatis setelah 2.5 detik
        setTimeout(() => {
            if (successModal) successModal.remove();
        }, 2500);

    } catch (error) {
        // 5. Jika gagal (misal tidak ada internet), munculkan popup error
        modal.remove();
        showLoginPopup('error', '❌ Gagal mengirim data. Silakan periksa koneksi internet.');
    }
}
