const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzjoXZ0FEOIwkaBRsRjMq4y8WMkDtT8mfHHVkJ9yW2FY60kqeBkm8o8i7G4lMrNcvGq/exec';

// =============================================
// TOGGLE PASSWORD
// =============================================
function togglePass(inputId, iconEl) {
    // inputId yang dikirim dari login.html adalah 'password'
    const input = document.getElementById(inputId);
    if (!input) return; // aman kalau null
    
    if (input.type === 'password') {
        input.type = 'text';
        iconEl.textContent = '🙈';
    } else {
        input.type = 'password';
        iconEl.textContent = '👁️';
    }
}


// =============================================
// SWITCH ROLE (Siswa/Guru)
// =============================================
function switchRole(role, elBtn) {
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    elBtn.classList.add('active');

    const labelNis  = document.getElementById('label-nis');
    const labelPass = document.getElementById('label-pass');

    if (role === 'siswa') {
        labelNis.textContent  = 'NIS';
        labelPass.textContent = 'Password';
    } else {
        labelNis.textContent  = 'NIP';
        labelPass.textContent = 'Password';
    }

    document.getElementById('input-nis').value  = '';
    document.getElementById('input-pass').value = '';
    document.getElementById('pesan-login').textContent = '';
}

// =============================================
// HANDLE LOGIN
// =============================================
async function handleLogin(e) {
    e.preventDefault();

    const activeBtn   = document.querySelector('.role-btn.active');
    const currentRole = activeBtn ? activeBtn.dataset.role : 'siswa';

    const nis   = document.getElementById('nis').value.trim();
    const pass  = document.getElementById('password').value.trim();
    const pesan = document.getElementById('pesan-login');

    if (!nis || !pass) {
        pesan.style.color = 'red';
        pesan.textContent = '⚠️ Isi semua kolom!';
        return;
    }

    pesan.style.color = 'blue';
    pesan.textContent = '⏳ Sedang login...';

    try {
        const params = new URLSearchParams({
            action : 'login',
            role   : currentRole,
            nis    : nis,
            pass   : pass
        });

        const res  = await fetch(`${SCRIPT_URL}?${params}`);
        const data = await res.json();

        console.log('Response login:', data);

        if (data.status === 'success') {
            localStorage.setItem('user_login', JSON.stringify({
                nama  : data.nama,
                role  : currentRole,
                id    : data.id,
                token : data.token
            }));

            updateMenuLogin();

            pesan.style.color = 'green';
            pesan.textContent = `✅ Selamat datang, ${data.nama}!`;

            setTimeout(() => {
                const tabBeranda = document.querySelector('.tab');
                loadPage('beranda-konten.html', tabBeranda);
            }, 1000);

        } else {
            pesan.style.color = 'red';
            pesan.textContent = `❌ ${data.message || 'Login gagal!'}`;
        }

    } catch (err) {
        console.error('Error login:', err);
        pesan.style.color = 'red';
        pesan.textContent = '❌ Gagal terhubung ke server!';
    }
}


// =============================================
// UPDATE MENU LOGIN/LOGOUT
// =============================================
function updateMenuLogin() {
    const userLogin  = localStorage.getItem('user_login');
    const tabLogin   = document.getElementById('tab-login');
    const tabLogout  = document.getElementById('tab-logout');

    console.log('updateMenuLogin dipanggil, userLogin:', userLogin);

    if (!tabLogin || !tabLogout) {
        console.warn('tab-login atau tab-logout tidak ditemukan!');
        return;
    }

    if (userLogin) {
        tabLogin.style.display  = 'none';
        tabLogout.style.display = '';
        const user = JSON.parse(userLogin);
        tabLogout.innerHTML = `👤 ${user.nama} &nbsp;|&nbsp; <span style="color:#ff3b30;">Logout</span>`;
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

        // Eksekusi ulang script yang ada di dalam halaman
        Array.from(areaKonten.querySelectorAll('script')).forEach(oldScript => {
            const newScript = document.createElement('script');
            if (oldScript.src) {
                newScript.src   = oldScript.src;
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
// FETCH DATA GOOGLE SHEETS
// =============================================
async function fetchGoogleSheetsData() {
    // isi sesuai kebutuhan kamu
}

// =============================================
// INIT
// =============================================
window.onload = () => {
    updateMenuLogin();
    const tabPertama = document.querySelector('.tab');
    loadPage('beranda-konten.html', tabPertama);
};
