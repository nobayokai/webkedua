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
            // Simpan data login
            localStorage.setItem('user_login', JSON.stringify({
                nama  : data.nama,
                role  : currentRole,
                id    : data.id,
                token : data.token
            }));

            updateMenuLogin();

            // Tampilkan popup sukses
            const successModal = showLoginPopup('success', `✅ Login Berhasil!<br>Selamat datang, ${data.nama}`);

            setTimeout(() => {
                successModal.remove();
                const tabBeranda = document.querySelector('.tab');
                loadPage('beranda-konten.html', tabBeranda);
            }, 1500);

        } else {
            // Tampilkan popup error
            showLoginPopup('error', `❌ ${data.message || 'Login gagal!'}`);
        }

    } catch (err) {
        modal.remove();
        showLoginPopup('error', '❌ Gagal terhubung ke server!');
    }
}


// =============================================
// FUNGSI POPUP LOGIN
// =============================================
function showLoginPopup(type, message) {
    // Hapus modal lama jika ada
    const oldModal = document.querySelector('.modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.className = 'modal';

    let icon = '';
    let extraClass = '';

    if (type === 'loading') {
        icon = '⏳';
    } else if (type === 'success') {
        icon = '✅';
        extraClass = 'success';
    } else if (type === 'error') {
        icon = '❌';
        extraClass = 'error';
    }

    modal.innerHTML = `
        <div class="modal-content ${extraClass}">
            <div class="icon">${icon}</div>
            <p>${message}</p>
        </div>
    `;

    document.body.appendChild(modal);

    // Klik di luar modal untuk menutup (hanya untuk error/success)
    if (type !== 'loading') {
        modal.addEventListener('click', (e) => {
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
    updateMenuLogin();
    const tabBeranda = document.querySelector('.tab');
    loadPage('beranda-konten.html', tabBeranda);
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
