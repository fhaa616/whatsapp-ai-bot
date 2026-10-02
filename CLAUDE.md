# Project Prompt: Ultimate WhatsApp AI Multi-Functional Bot

Anda adalah seorang Senior Backend Developer dan pakar otomasi WhatsApp menggunakan Node.js. Saya ingin membuat sebuah WhatsApp Bot serbaguna yang kaya fitur (Multi-Functional Bot) dengan arsitektur modular yang rapi. 

Tolong bantu saya menyusun seluruh kodingan berdasarkan spesifikasi teknologi dan peta lokasi folder berikut ini:

---

## 🛠️ Tech Stack, Language & Frameworks

- **Language & Runtime:** JavaScript (ECMAScript 6+ / ES Modules) pada Node.js (LTS).
- **WA Gateway Framework:** `whatsapp-web.js` dengan strategi `LocalAuth` (menyimpan sesi login agar tidak perlu scan QR terus-menerus).
- **Sticker Processing:** `sharp` dan `wa-sticker-formatter` (konversi instan ke WebP aspek rasio 1:1).
- **Document Converter:** `docx-pdf` atau `libreoffice-convert` (Word `.docx` ke `.pdf`).
- **AI & Data Processing:** `@google/generative-ai` atau `openai` (untuk fitur kecerdasan buatan).
- **Utilities:** `qrcode-terminal` (QR Code di konsol), `mime-types` (deteksi format file), dan `fs-extra`.

---

## 📂 Project Folder Location Structure

Seluruh kode harus dipecah secara modular. Jangan menumpuk semua logika di satu file. Ikuti peta struktur lokasi folder di bawah ini:

```text
whatsapp-ai-bot/
├── commands/               # FOLDER: Tempat menyimpan file fitur bot terpisah (Modular)
│   ├── stiker.js           # FILE: Logika perintah !stiker (Ubah gambar ke stiker)
│   ├── topdf.js            # FILE: Logika perintah !topdf (Ubah Word ke PDF)
│   ├── ai.js               # FILE: Logika perintah !ai (Tanya jawab dengan AI)
│   └── help.js             # FILE: Logika perintah !help (Menampilkan menu bantuan)
├── temp/                   # FOLDER: Penyimpanan sementara untuk proses file dokumen (Word/PDF)
├── session/                # FOLDER: Otomatis dibuat oleh sistem untuk menyimpan session login WA
├── package.json            # FILE: Konfigurasi nama proyek, script jalan, dan daftar library dependensi
└── index.js                # FILE utama/core: Mengatur koneksi WA Web dan Dynamic Command Loader
```

---

## 📋 Fitur yang Harus Dibuat & Cara Kerjanya

1. **`index.js` (File Utama):**
   - Menginisialisasi koneksi `whatsapp-web.js` dengan `LocalAuth`.
   - Menampilkan QR code di terminal menggunakan `qrcode-terminal` saat pertama kali dinyalakan.
   - Memiliki fungsi *Dynamic Command Loader* untuk membaca dan menjalankan file perintah yang ada di folder `commands/` secara otomatis saat pengguna mengetik pesan ber-prefix `!`.

2. **`commands/stiker.js`:**
   - Mendownload media gambar dari chat langsung atau dari pesan yang di-reply.
   - Mengubah ukuran menjadi rasio 1:1 menggunakan format WebP stiker lalu mengirimkannya kembali ke pengguna.

3. **`commands/topdf.js`:**
   - Mendownload file `.docx`, menyimpannya sementara di folder `./temp/`.
   - Mengonversinya menjadi `.pdf`, mengirimkannya kembali, lalu wajib langsung menghapus file sampah di folder `./temp/` menggunakan `fs.unlink`.

4. **`commands/ai.js`:**
   - Integrasi teks ke model kecerdasan buatan (Gemini/OpenAI) untuk menjawab pertanyaan setelah command `!ai`.

5. **`commands/help.js`:**
   - Menampilkan menu bantuan dan daftar command secara estetis.

---

## 🚀 Instructions for AI (What to do next)

Berdasarkan struktur folder di atas, tolong buatkan kodenya secara bertahap untuk saya mulai dari:
1. File **`package.json`** dengan dependensi lengkap sesuai tech stack (pastikan menggunakan type: module).
2. File **`index.js`** sebagai core koneksi dan pembaca folder `commands/`.
3. File-file fitur di dalam folder **`commands/`** (stiker.js, topdf.js, ai.js, help.js) dengan penanganan error yang kuat.

Berikan kodenya secara bertahap dan rapi.