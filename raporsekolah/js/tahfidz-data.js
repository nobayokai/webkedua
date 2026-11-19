// Data surah & helper untuk fitur Tahfidz (dipakai tahfidz.js dan rapor-tahfidz.js)
const ARAB = `الفاتحة|البقرة|آل عمران|النساء|المائدة|الأنعام|الأعراف|الأنفال|التوبة|يونس|هود|يوسف|الرعد|إبراهيم|الحجر|النحل|الإسراء|الكهف|مريم|طه|الأنبياء|الحج|المؤمنون|النور|الفرقان|الشعراء|النمل|القصص|العنكبوت|الروم|لقمان|السجدة|الأحزاب|سبأ|فاطر|يس|الصافات|ص|الزمر|غافر|فصلت|الشورى|الزخرف|الدخان|الجاثية|الأحقاف|محمد|الفتح|الحجرات|ق|الذاريات|الطور|النجم|القمر|الرحمن|الواقعة|الحديد|المجادلة|الحشر|الممتحنة|الصف|الجمعة|المنافقون|التغابن|الطلاق|التحريم|الملك|القلم|الحاقة|المعارج|نوح|الجن|المزمل|المدثر|القيامة|الإنسان|المرسلات|النبأ|النازعات|عبس|التكوير|الانفطار|المطففين|الانشقاق|البروج|الطارق|الأعلى|الغاشية|الفجر|البلد|الشمس|الليل|الضحى|الشرح|التين|العلق|القدر|البينة|الزلزلة|العاديات|القارعة|التكاثر|العصر|الهمزة|الفيل|قريش|الماعون|الكوثر|الكافرون|النصر|اللهب|الإخلاص|الفلق|الناس`.split('|');
const LATIN = `Al-Fatihah|Al-Baqarah|Ali 'Imran|An-Nisa'|Al-Ma'idah|Al-An'am|Al-A'raf|Al-Anfal|At-Taubah|Yunus|Hud|Yusuf|Ar-Ra'd|Ibrahim|Al-Hijr|An-Nahl|Al-Isra'|Al-Kahf|Maryam|Thaha|Al-Anbiya'|Al-Hajj|Al-Mu'minun|An-Nur|Al-Furqan|Asy-Syu'ara'|An-Naml|Al-Qashash|Al-'Ankabut|Ar-Rum|Luqman|As-Sajdah|Al-Ahzab|Saba'|Fathir|Yasin|Ash-Shaffat|Shad|Az-Zumar|Ghafir|Fushshilat|Asy-Syura|Az-Zukhruf|Ad-Dukhan|Al-Jatsiyah|Al-Ahqaf|Muhammad|Al-Fath|Al-Hujurat|Qaf|Adz-Dzariyat|Ath-Thur|An-Najm|Al-Qamar|Ar-Rahman|Al-Waqi'ah|Al-Hadid|Al-Mujadilah|Al-Hasyr|Al-Mumtahanah|Ash-Shaff|Al-Jumu'ah|Al-Munafiqun|At-Taghabun|Ath-Thalaq|At-Tahrim|Al-Mulk|Al-Qalam|Al-Haqqah|Al-Ma'arij|Nuh|Al-Jinn|Al-Muzzammil|Al-Muddatstsir|Al-Qiyamah|Al-Insan|Al-Mursalat|An-Naba'|An-Nazi'at|'Abasa|At-Takwir|Al-Infithar|Al-Muthaffifin|Al-Insyiqaq|Al-Buruj|Ath-Thariq|Al-A'la|Al-Ghasyiyah|Al-Fajr|Al-Balad|Asy-Syams|Al-Lail|Adh-Dhuha|Asy-Syarh|At-Tin|Al-'Alaq|Al-Qadr|Al-Bayyinah|Az-Zalzalah|Al-'Adiyat|Al-Qari'ah|At-Takatsur|Al-'Ashr|Al-Humazah|Al-Fil|Quraisy|Al-Ma'un|Al-Kautsar|Al-Kafirun|An-Nashr|Al-Lahab|Al-Ikhlash|Al-Falaq|An-Nas`.split('|');

// Urutan hafalan: Al-Fatihah, lalu An-Nas, Al-Falaq, ... mundur sampai Al-Baqarah
const URUTAN = [1]; for (let i = 114; i >= 2; i--) URUTAN.push(i);
// Daftar nomor surah untuk target "dari posisi X sampai posisi Y" (posisi 1..114 pada URUTAN)
const rentang = (dari, sampai) => URUTAN.slice(dari - 1, sampai);

// Predikat nilai
const PRED = [[80, 'Sangat Baik', 'ممتاز', '80 - 100'], [70, 'Baik', 'جيد', '70 - 79'], [60, 'Cukup', 'مقبول', '60 - 69'], [-1, 'Kurang', 'ضعيف جدا', '< 60']];
const predAr = n => PRED.find(p => (n || 0) >= p[0])[2];
// "Sangat Baik / ممتاز"
const predTeks = n => { const p = PRED.find(x => (n || 0) >= x[0]); return `${p[1]} / <span class="ar">${p[2]}</span>`; };
// Daftar standar rapor: posisi 1..38 (Al-Fatihah sampai An-Naba')
const BASE_POS = Array.from({ length: 38 }, (_, i) => i + 1);

// "5" -> "5 (Lima)", "3A" -> "3 (Tiga) A"
const ANGKA = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas', 'Dua Belas'];
function kelasTeks(k) {
  const m = String(k || '').trim().match(/^(\d+)\s*(.*)$/); if (!m) return k || '';
  const n = +m[1]; return `${n} (${ANGKA[n] || n})${m[2] ? ' ' + m[2] : ''}`;
}
