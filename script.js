// --- GANTI URL DI BAWAH INI DENGAN URL APPS SCRIPT MILIKMU ---
const SCRIPT_URL = 'URL_APPS_SCRIPT_KAMU_DI_SINI';

// Fungsi untuk menarik HTML file lain dan memasukkannya ke index.html
async function loadPage(namaFile, elemenTab) {
    // 1. Pindahkan status 'active' ke tab yang sedang diklik
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    if (elemenTab) elemenTab.classList.add('active');

    const areaKonten = document.getElementById('area-konten');

    try {
        areaKonten.innerHTML = '<p id="status-loading">Memuat halaman...</p>';

        // 2. Ambil isi dari file HTML tujuan (misal: edukasi.html)
        const response = await fetch(namaFile);
        if (!response.ok) throw new Error('Halaman tidak ditemukan');
        
        // 3. Ubah menjadi teks HTML
        const htmlContent = await response.text();

        // 4. Suntikkan HTML tersebut ke dalam buku
        areaKonten.innerHTML = htmlContent;

        // 5. Setelah HTML berhasil masuk, panggil data Google Sheets
        fetchGoogleSheetsData();

    } catch (error) {
        areaKonten.innerHTML = `<p style="color:red;">Gagal memuat halaman: ${error.message}</p>`;
    }
}

// Fungsi untuk mengambil data dari Google Sheets (Sama seperti sebelumnya)
async function fetchGoogleSheetsData() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        data.forEach(item => {
            const menuId = item.menu.toLowerCase().trim();
            const titleElement = document.getElementById(`judul-${menuId}`);
            const contentElement = document.getElementById(`konten-${menuId}`);
            
            // Karena konten dinamis, kita cek apakah elemennya sedang tampil di layar
            if (titleElement && contentElement) {
                titleElement.innerText = item.judul;
                contentElement.innerText = item.konten;
            }
        });
    } catch (error) {
        console.error('Error fetching Sheets:', error);
    }
}

// Otomatis memuat halaman Beranda saat website pertama kali dibuka
window.onload = () => {
    const tabPertama = document.querySelector('.tab');
    loadPage('beranda-konten.html', tabPertama);
};
