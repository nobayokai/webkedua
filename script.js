const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx3FrVGfLdH64N_uiBKprAWg7W0nYqabg9bBcmGh94AIfoV-2hQruJk6EO2GybHNdm9xA/exec';

// =============================================
// GLOBAL VARIABLE
// =============================================
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
// VARIABEL GLOBAL UNTUK MAP
// =============================================
let map;
let marker;

// =============================================
// FUNGSI INISIALISASI MAP (DIPANGGIL SETELAH HTML MUNCUL)
// =============================================
function initMapSiswaBaru() {
    // Pastikan elemen map ada di HTML
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Cegah error "Map already initialized" jika tab diklik berkali-kali
    if (map !== undefined && map !== null) {
        map.remove();
    }

    // 1. Inisialisasi Peta
    map = L.map('map').setView([-6.208763, 106.845599], 13); // Default area Bekasi/Jakarta

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 2. Fungsi untuk mendeteksi lokasi saat ini
    map.locate({setView: true, maxZoom: 16});

    map.on('locationfound', function(e) {
        updateMarker(e.latlng);
    });

    // 3. Fungsi saat peta diklik
    map.on('click', function(e) {
        updateMarker(e.latlng);
    });
    
    // Perbaikan render map jika ada di dalam tab/hidden div
    setTimeout(() => {
        if(map) {
            map.invalidateSize();
        }
    }, 800);
}

// =============================================
// FUNGSI UPDATE MARKER & INPUT
// =============================================
function updateMarker(latlng) {
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker(latlng).addTo(map);
    
    // Pastikan ID ini sama persis dengan yang ada di HTML Bapak
    document.getElementById('latitude').value = latlng.lat;
    document.getElementById('longitude').value = latlng.lng;
}


// Fungsi Submit
function submitFormSiswaBaru(e) {
  e.preventDefault();

  const data = {
    nama_lengkap: document.getElementById('nama_lengkap').value,
    
    // PERBAIKAN: Gunakan 'latitude' dan 'longitude' sesuai ID di HTML
    lintang: document.getElementById('latitude').value,
    bujur: document.getElementById('longitude').value,
    
    moda_transportasi: document.getElementById('moda_transportasi').value,
    // ... data lainnya
  };

  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(() => {
    document.getElementById('pesan-form').innerHTML = "✅ Data berhasil disimpan!";
    document.getElementById('formSiswaBaru').reset();
    if (marker && map) map.removeLayer(marker);
  });
}

// Panggil saat tab formulir siswa baru dibuka
function loadFormSiswaBaru() {
    const mainContent = document.getElementById('main-content');
    const formTemplate = document.getElementById('form-siswa-baru-container');

    if (!formTemplate) {
        console.error('Template form tidak ditemukan');
        return;
    }

    // Masukkan form ke halaman
    mainContent.innerHTML = formTemplate.innerHTML;

    // Inisialisasi map setelah form benar-benar muncul
    setTimeout(() => {
        initMapSiswaBaru();

        // Pasang event submit form
        const form = document.getElementById('formSiswaBaru');
        if (form) {
            form.addEventListener('submit', submitFormSiswaBaru);
        }
    }, 400); // Tambah delay sedikit agar lebih aman
}


