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

// Inisialisasi Peta (Leaflet)
let mapSiswaBaru = null;
let markerSiswaBaru = null;

function initMapSiswaBaru() {
    const mapContainer = document.getElementById('map');
    
    if (!mapContainer) {
        console.error('Map container tidak ditemukan');
        return;
    }

    // Hapus map lama jika sudah ada
    if (mapSiswaBaru) {
        mapSiswaBaru.remove();
        mapSiswaBaru = null;
    }

    // Inisialisasi map baru
    mapSiswaBaru = L.map('map', {
        center: [-6.2, 106.8],
        zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapSiswaBaru);

    // Event klik pada peta
    mapSiswaBaru.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Hapus marker lama
        if (markerSiswaBaru) {
            mapSiswaBaru.removeLayer(markerSiswaBaru);
        }

        // Buat marker baru
        markerSiswaBaru = L.marker([lat, lng]).addTo(mapSiswaBaru);

        // Isi input
        document.getElementById('lintang').value = lat.toFixed(6);
        document.getElementById('bujur').value = lng.toFixed(6);
    });

    // Paksa Leaflet menghitung ulang ukuran (penting di SPA)
    setTimeout(() => {
        mapSiswaBaru.invalidateSize();
    }, 300);
}


// Fungsi Submit
function submitFormSiswaBaru(e) {
  e.preventDefault();

  const data = {
    // ... (semua field seperti respons sebelumnya)
    nama_lengkap: document.getElementById('nama_lengkap').value,
    // ... tambahkan semua field lainnya
    lintang: document.getElementById('lintang').value,
    bujur: document.getElementById('bujur').value,
    moda_transportasi: document.getElementById('moda_transportasi').value,
    // dst...
  };

  fetch("https://script.google.com/macros/s/AKfycbx3FrVGfLdH64N_uiBKprAWg7W0nYqabg9bBcmGh94AIfoV-2hQruJk6EO2GybHNdm9xA/exec", {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(() => {
    document.getElementById('pesan-form').innerHTML = "✅ Data berhasil disimpan!";
    document.getElementById('formSiswaBaru').reset();
    if (marker) map.removeLayer(marker);
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


