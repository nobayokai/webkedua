// =============================================
// KONFIGURASI - Ganti dengan URL Apps Script kamu
// =============================================
const LOGIN_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx3FrVGfLdH64N_uiBKprAWg7W0nYqabg9bBcmGh94AIfoV-2hQruJk6EO2GybHNdm9xA/exec';

// =============================================
// STATE
// =============================================
let currentRole  = 'siswa';
let passVisible  = false;

// =============================================
// SWITCH ROLE SISWA / GURU
// =============================================
function switchRole(role) {
    currentRole  = role;
    const isSiswa = role === 'siswa';

    // Animasi card
    const card = document.getElementById('login-card');
    card.style.animation = 'none';
    card.offsetHeight; // reflow
    card.style.animation = 'fadeCard 0.35s ease';

    // Toggle button aktif
    document.getElementById('btn-siswa').classList.toggle('active',  isSiswa);
    document.getElementById('btn-guru').classList.toggle('active',  !isSiswa);

    // Avatar
    const avatar = document.getElementById('avatar-icon');
    avatar.className   = 'avatar-icon ' + role;
    avatar.textContent = isSiswa ? '🎒' : '👨‍🏫';

    // Title & subtitle
    document.getElementById('login-title').textContent    = isSiswa ? 'Halo, Siswa!'  : 'Halo, Guru!';
    document.getElementById('login-subtitle').textContent = isSiswa
        ? 'Masuk untuk melanjutkan belajar'
        : 'Masuk untuk mengelola kelas';

    // Label & placeholder input username
    const inputUser = document.getElementById('input-user');
    document.getElementById('label-user').textContent = isSiswa ? 'NIS / Username' : 'Email / NIP';
    inputUser.placeholder = isSiswa ? 'Masukkan NIS kamu' : 'Masukkan email guru';
    inputUser.type        = isSiswa ? 'text'              : 'email';

    // Warna fokus input
    document.querySelectorAll('.input-field').forEach(f => {
        f.classList.toggle('guru-focus', !isSiswa);
    });

    // Tombol login
    document.getElementById('btn-login').className = 'btn-login ' + role;

    // Info badge
    document.getElementById('info-badge').className  = 'info-badge ' + (isSiswa ? '' : 'guru');
    document.getElementById('info-text').textContent = isSiswa
        ? 'Gunakan NIS dan password yang diberikan oleh gurumu'
        : 'Gunakan email dan password akun guru kamu';

    // Reset form & notif
    document.getElementById('login-form').reset();
    hideNotif();
}

// =============================================
// TOGGLE SHOW / HIDE PASSWORD
// =============================================
function togglePass() {
    passVisible = !passVisible;
    document.getElementById('input-pass').type   = passVisible ? 'text'     : 'password';
    document.getElementById('eye-icon').textContent = passVisible ? '🙈' : '👁️';
}

// =============================================
// LUPA PASSWORD
// =============================================
function hubungiGuru() {
    showNotif('Hubungi gurumu untuk reset password 📩', 'success');
}

// =============================================
// HANDLE LOGIN → KIRIM KE GOOGLE APPS SCRIPT
// =============================================
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('input-user').value.trim();
    const password = document.getElementById('input-pass').value;

    if (!username || !password) {
        showNotif('Mohon isi semua kolom ya 😊', 'error');
        return;
    }

    // Tampilkan loading
    const btn = document.getElementById('btn-login');
    btn.disabled     = true;
    btn.innerHTML    = '<span class="spinner"></span>';
    hideNotif();

    const params = new URLSearchParams({
        action   : 'login',
        role     : currentRole,
        username : username,
        password : password
    });

    try {
        const res  = await fetch(`${LOGIN_SCRIPT_URL}?${params}`);
        const data = await res.json();

        btn.disabled  = false;
        btn.innerHTML = 'Masuk';

        if (data.status === 'success') {
            // Simpan sesi ke localStorage
            localStorage.setItem('user_login', JSON.stringify({
                nama  : data.nama,
                role  : currentRole,
                id    : data.id,
                token : data.token
            }));

            showNotif('✅ Berhasil masuk! Halo, ' + data.nama, 'success');

            // Redirect sesuai role setelah 1.2 detik
            setTimeout(() => {
                if (currentRole === 'guru') {
                    loadPage('dashboard-guru.html', null);
                } else {
                    loadPage('beranda-konten.html', null);
                }
            }, 1200);

        } else {
            showNotif(data.message || '❌ Username atau password salah', 'error');
        }

    } catch (err) {
        btn.disabled  = false;
        btn.innerHTML = 'Masuk';
        showNotif('❌ Gagal terhubung ke server. Coba lagi.', 'error');
    }
}

// =============================================
// HELPER NOTIFIKASI
// =============================================
function showNotif(msg, type) {
    const box       = document.getElementById('notif-box');
    box.textContent = msg;
    box.className   = 'notif ' + type;
    box.style.display = 'block';
}

function hideNotif() {
    document.getElementById('notif-box').style.display = 'none';
}
