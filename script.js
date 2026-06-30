// =============================================
// KONFIGURASI
// =============================================

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx3FrVGfLdH64N_uiBKprAWg7W0nYqabg9bBcmGh94AIfoV-2hQruJk6EO2GybHNdm9xA/exec' ;
// =============================================
// CEK STATUS LOGIN & UPDATE MENU
// =============================================
function updateMenuLogin() {
    const userLogin  = localStorage.getItem('user_login');
    const tabLogin   = document.getElementById('tab-login');
    const tabLogout  = document.getElementById('tab-logout');

    if (userLogin) {
        // Sudah login → sembunyikan login, tampilkan logout
        tabLogin.style.display  = 'none';
        tabLogout.style.display = '';

        // Tampilkan nama user di tab logout (opsional)
        const user = JSON.parse(userLogin);
        tabLogout.innerHTML = `👤 ${user.nama} &nbsp;|&nbsp; <span style="color:#ff3b30;">Logout</span>`;
    } else {
        // Belum login → tampilkan login, sembunyikan logout
        tabLogin.style.display  = '';
        tabLogout.style.display = 'none';
    }
}

// =============================================
// FUNGSI LOGOUT
// =============================================
function handleLogout() {
    // Hapus popup lama kalau ada
    const oldPopup = document.getElementById('logout-popup-overlay');
    if (oldPopup) oldPopup.remove();

    // Inject animasi (sekali saja)
    if (!document.getElementById('logout-keyframes')) {
        const style = document.createElement('style');
        style.id = 'logout-keyframes';
        style.textContent = `
            @keyframes logoutFadeIn {
                from { opacity: 0; }
                to   { opacity: 1; }
            }
            @keyframes logoutFadeOut {
                from { opacity: 1; }
                to   { opacity: 0; }
            }
            @keyframes logoutSlideUp {
                from { opacity: 0; transform: translateY(40px) scale(0.9); }
                to   { opacity: 1; transform: translateY(0)    scale(1);   }
            }
            @keyframes logoutSlideDown {
                from { opacity: 1; transform: translateY(0)    scale(1);   }
                to   { opacity: 0; transform: translateY(40px) scale(0.9); }
            }
        `;
        document.head.appendChild(style);
    }

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'logout-popup-overlay';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: logoutFadeIn 0.25s ease;
    `;

    // Card
    const card = document.createElement('div');
    card.style.cssText = `
        background: rgba(255,255,255,0.92);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 28px;
        padding: 40px 35px;
        max-width: 300px;
        width: 85%;
        text-align: center;
        box-shadow: 0 25px 60px rgba(0,0,0,0.2);
        border: 1px solid rgba(255,255,255,0.7);
        animation: logoutSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
    `;

    // Ambil nama user
    const user = JSON.parse(localStorage.getItem('user_login') || '{}');

    // Icon
    const iconWrap = document.createElement('div');
    iconWrap.style.cssText = `
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 38px;
        margin-bottom: 18px;
        background: linear-gradient(135deg, #ff3b30, #ff6b6b);
        box-shadow: 0 10px 30px rgba(255,59,48,0.35);
    `;
    iconWrap.textContent = '👋';

    // Judul
    const title = document.createElement('div');
    title.style.cssText = `
        font-size: 20px;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 8px;
        letter-spacing: -0.3px;
    `;
    title.textContent = 'Yakin mau keluar?';

    // Pesan
    const msg = document.createElement('div');
    msg.style.cssText = `
        font-size: 14px;
        color: #888;
        line-height: 1.5;
        margin-bottom: 25px;
    `;
    msg.textContent = `Kamu akan keluar dari akun ${user.nama || 'kamu'} 😢`;

    // Wrapper tombol
    const btnWrap = document.createElement('div');
    btnWrap.style.cssText = `
        display: flex;
        gap: 10px;
    `;

    // Tombol Batal
    const btnBatal = document.createElement('button');
    btnBatal.style.cssText = `
        flex: 1;
        padding: 14px;
        border: 1.5px solid rgba(0,0,0,0.1);
        border-radius: 14px;
        font-size: 15px;
        font-weight: 600;
        color: #555;
        background: rgba(0,0,0,0.04);
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
    `;
    btnBatal.textContent = 'Batal';
    btnBatal.onmouseover = () => btnBatal.style.background = 'rgba(0,0,0,0.08)';
    btnBatal.onmouseout  = () => btnBatal.style.background = 'rgba(0,0,0,0.04)';

    // Tombol Logout
    const btnLogout = document.createElement('button');
    btnLogout.style.cssText = `
        flex: 1;
        padding: 14px;
        border: none;
        border-radius: 14px;
        font-size: 15px;
        font-weight: 700;
        color: white;
        background: linear-gradient(135deg, #ff3b30, #ff6b6b);
        box-shadow: 0 6px 20px rgba(255,59,48,0.35);
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
    `;
    btnLogout.textContent = 'Keluar';
    btnLogout.onmouseover = () => btnLogout.style.transform = 'translateY(-2px) scale(1.02)';
    btnLogout.onmouseout  = () => btnLogout.style.transform = 'none';
    btnLogout.onmousedown = () => btnLogout.style.transform = 'scale(0.97)';

    // Fungsi tutup popup
    function closePopup(callback) {
        card.style.animation    = 'logoutSlideDown 0.25s ease forwards';
        overlay.style.animation = 'logoutFadeOut 0.3s ease forwards';
        setTimeout(() => {
            overlay.remove();
            if (callback) callback();
        }, 300);
    }

    // Event tombol batal
    btnBatal.onclick = () => closePopup();

    // Event tombol logout
    btnLogout.onclick = () => {
        closePopup(() => {
            // Hapus sesi
            localStorage.removeItem('user_login');

            // Update tampilan menu
            updateMenuLogin();

            // Kembali ke halaman beranda
            const tabPertama = document.querySelector('.tab');
            loadPage('beranda-konten.html', tabPertama);
        });
    };

    // Klik luar untuk batal
    overlay.onclick = (e) => {
        if (e.target === overlay) closePopup();
    };

    // Susun elemen
    btnWrap.appendChild(btnBatal);
    btnWrap.appendChild(btnLogout);
    card.appendChild(iconWrap);
    card.appendChild(title);
    card.appendChild(msg);
    card.appendChild(btnWrap);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
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

        // ✅ Pakai ini bukan innerHTML langsung
        areaKonten.innerHTML = '';

        const temp = document.createElement('div');
        temp.innerHTML = htmlContent;

        // Pindahkan semua elemen ke areaKonten
        Array.from(temp.childNodes).forEach(node => {
            areaKonten.appendChild(node.cloneNode(true));
        });

        // ✅ Eksekusi ulang semua tag <script> yang ada di halaman
        Array.from(areaKonten.querySelectorAll('script')).forEach(oldScript => {
            const newScript = document.createElement('script');

            if (oldScript.src) {
                // Script eksternal (src="...")
                newScript.src = oldScript.src;
                newScript.async = false;
            } else {
                // Script inline
                newScript.textContent = oldScript.textContent;
            }

            document.head.appendChild(newScript);
            oldScript.remove();
        });

        fetchGoogleSheetsData();

    } catch (error) {
        areaKonten.innerHTML = `<p style="color:red;">Gagal memuat halaman: ${error.message}</p>`;
    }
}


// =============================================
// FETCH GOOGLE SHEETS
// =============================================
async function fetchGoogleSheetsData() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data     = await response.json();

        data.forEach(item => {
            const menuId         = item.menu.toLowerCase().trim();
            const titleElement   = document.getElementById(`judul-${menuId}`);
            const contentElement = document.getElementById(`konten-${menuId}`);

            if (titleElement && contentElement) {
                titleElement.innerText   = item.judul;
                contentElement.innerText = item.konten;
            }
        });
    } catch (error) {
        console.error('Error fetching Sheets:', error);
    }
}

// =============================================
// INIT
// =============================================
window.onload = () => {
    // Cek status login saat pertama buka
    updateMenuLogin();

    // Load halaman pertama
    const tabPertama = document.querySelector('.tab');
    loadPage('beranda-konten.html', tabPertama);
};
