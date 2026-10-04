# WhatsApp AI Bot

Bot WhatsApp berbasis Node.js yang memakai [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) dan Google Gemini. Dibuat untuk membantu kegiatan kuliah, dengan struktur command yang modular sehingga fitur baru cukup ditambah satu file.

## Fitur

| Perintah | Alias | Fungsi |
|---|---|---|
| `!help` | | Menampilkan daftar perintah |
| `!ai <pertanyaan>` | `!tanya` | Tanya jawab dengan Gemini |
| `!stiker` | `!sticker`, `!s` | Ubah gambar menjadi stiker |
| `!topdf` | `!pdf` | Ubah file Word (`.docx`) menjadi PDF |

Cara pakai:

- `!ai apa itu API?`
- `!stiker`: kirim gambar dengan caption `!stiker`, atau reply gambar dengan perintah itu.
- `!topdf`: kirim file `.docx` dengan caption `!topdf`, atau reply file `.docx` dengan perintah itu.

## Persyaratan

- Node.js 20 atau lebih baru (dikembangkan dengan Node 24)
- Browser berbasis Chromium: Brave atau Google Chrome
- API key Gemini dari [Google AI Studio](https://aistudio.google.com/)
- Akun WhatsApp untuk ditautkan (disarankan nomor khusus bot)

## Instalasi

```bash
npm install
```

Kalau Puppeteer mencoba mengunduh browser dan gagal, lewati unduhannya karena bot memakai browser yang sudah terpasang. Di PowerShell:

```powershell
$env:PUPPETEER_SKIP_DOWNLOAD = "true"
npm install
```

Agar permanen, buat file `.puppeteerrc.cjs` di root project:

```js
module.exports = {
  skipDownload: true,
};
```

Paket yang dipakai: `whatsapp-web.js`, `@google/generative-ai`, `dotenv`, `fs-extra`, `qrcode`, `qrcode-terminal`, `sharp`, `mammoth`, `puppeteer-core`, `mime-types`.

## Konfigurasi

Buat file `.env` di root project (contoh ada di `.env.example`):

```env
PREFIX=!
GEMINI_API_KEY=isi_api_key_kamu
GEMINI_MODEL=gemini-3.8-flash
BROWSER_PATH=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
```

| Variabel | Keterangan |
|---|---|
| `PREFIX` | Awalan perintah (bawaan `!`) |
| `GEMINI_API_KEY` | API key Gemini (wajib untuk `!ai`) |
| `GEMINI_MODEL` | Nama model Gemini. Cek daftar model terbaru di dokumentasi Google karena model lama bisa dihentikan |
| `BROWSER_PATH` | Lokasi `brave.exe` atau `chrome.exe`. Lihat lokasinya di `brave://version` pada baris *Executable Path* |

Jangan pernah meng-commit `.env` ke Git.

## Menjalankan

```bash
npm start
```

Saat pertama kali:

1. QR code muncul di terminal dan disimpan sebagai `temp/qr.png`.
2. Di HP buka **WhatsApp → Pengaturan → Perangkat tertaut → Tautkan perangkat**, lalu scan QR.
3. Tunggu sampai muncul `🚀 Bot siap digunakan!`.

Sesi login tersimpan di folder `session/`, jadi **QR cukup discan sekali**. Jangan hapus folder ini kecuali memang ingin login ulang.

Untuk mencoba, kirim perintah di chat **"Kamu"** (Message yourself). Bot membaca pesan dari nomor sendiri, jadi tidak perlu nomor kedua.

## Struktur Project

```
whatsapp-ai-bot/
├── commands/
│   ├── ai.js        # Tanya jawab Gemini
│   ├── help.js      # Daftar perintah
│   ├── sticker.js   # Gambar -> stiker
│   └── topdf.js     # DOCX -> PDF
├── session/         # Sesi login WhatsApp (jangan di-commit)
├── temp/            # File sementara dan qr.png
├── .env             # Konfigurasi rahasia (jangan di-commit)
├── .puppeteerrc.cjs
├── index.js         # Entry point dan command loader
└── package.json
```

## Menambah Perintah Baru

Buat file baru di `commands/`. Bot memuatnya otomatis saat dinyalakan.

```js
export default {
  name: 'halo',
  aliases: ['hai'],
  description: 'Menyapa pengguna',

  async execute(client, message, args) {
    await message.reply('Halo! 👋');
  },
};
```

Setiap command menerima `client` (instance bot), `message` (pesan yang masuk), dan `args` (kata-kata setelah nama perintah).

## Pemecahan Masalah

| Gejala | Penyebab dan solusi |
|---|---|
| `Could not find Chrome` | Path browser salah. Atur `BROWSER_PATH` di `.env` ke `brave.exe` atau `chrome.exe` yang benar |
| QR terlalu besar atau tidak bisa discan | Buka `temp/qr.png` dan scan dari gambar, atau perkecil zoom terminal (Ctrl + scroll ke bawah) |
| QR muncul lagi setiap start | Folder `session/` terhapus atau sesi diputus dari HP. Scan ulang, lalu jangan hapus `session/` |
| `!ai` membalas "Model AI tidak ditemukan" | Nilai `GEMINI_MODEL` sudah usang. Ganti dengan model yang tersedia lalu restart bot |
| `!ai` membalas "Server AI sedang sibuk" | Error 503 dari Google, sifatnya sementara. Bot sudah mencoba ulang otomatis, coba lagi beberapa saat kemudian |
| Error `getChatById` / `r: r` | Versi `whatsapp-web.js` tidak cocok dengan WhatsApp Web terbaru. Coba `npm install github:pedroslopez/whatsapp-web.js#main` |
| `!topdf` gagal | Pastikan file `.docx` (bukan `.doc`) dan `BROWSER_PATH` benar. Hasil memakai konversi sederhana, jadi tata letak rumit bisa berbeda dari Word |
| Perubahan `.env` tidak terbaca | `.env` hanya dibaca saat bot dinyalakan. Restart dengan Ctrl + C lalu `npm start` |

## Menjalankan Terus-menerus

Bot hanya aktif selama proses `node index.js` berjalan. Pilihan untuk membuatnya menyala terus:

- **PM2 di komputer sendiri:** menjalankan bot di latar belakang dan menyalakannya ulang saat crash. Komputer harus tetap hidup dan online.
- **VPS Linux:** menyala 24 jam. Butuh RAM sekitar 1-2 GB karena bot memakai browser, dan `BROWSER_PATH` diarahkan ke Chromium. Pastikan folder `session/` disimpan di disk yang tetap ada.

## Catatan Keamanan

- Masukkan `.env`, `session/`, `.wwebjs_auth`, `.wwebjs_cache`, dan `temp/` ke `.gitignore`. Folder `session/` berisi data login WhatsApp dan `.env` berisi API key.
- `whatsapp-web.js` adalah library tidak resmi. WhatsApp dapat membatasi atau memblokir akun yang dipakai untuk otomasi, terutama bila bot sering mengirim pesan sendiri. Untuk penggunaan jangka panjang, gunakan nomor khusus bot.
- Bot memproses perintah berawalan `!` dari chat mana pun di akun yang tertaut. Batasi penggunaannya bila akun itu juga dipakai untuk keperluan pribadi.

## Rencana Pengembangan

- [ ] `!jadwal`: jadwal kuliah dengan pengingat otomatis
- [ ] `!bingung <tugas>`: memecah tugas besar menjadi langkah kecil
- [ ] `!bosan` dan `!semangat`: bantuan saat kehilangan motivasi
- [ ] Penyimpanan data (JSON atau SQLite) dan penjadwal (`node-cron`)
- [ ] Menjalankan bot terus-menerus (PM2 atau VPS)