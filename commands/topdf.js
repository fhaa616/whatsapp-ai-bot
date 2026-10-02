import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import fs from 'fs-extra';
import mime from 'mime-types';
import docxConverter from 'docx-pdf';
import pkg from 'whatsapp-web.js';

const { MessageMedia } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '..', 'temp');
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Logika konversi dipisah di satu fungsi.
// Jika nanti pindah ke LibreOffice, cukup ubah fungsi ini saja.
async function convertDocxToPdf(inputPath, outputPath) {
  const convert = promisify(docxConverter);
  await convert(inputPath, outputPath);
}

async function getMediaMessage(message) {
  if (message.hasMedia) return message;
  if (message.hasQuotedMsg) {
    const quoted = await message.getQuotedMessage();
    if (quoted.hasMedia) return quoted;
  }
  return null;
}

export default {
  name: 'topdf',
  description: 'Ubah file Word (.docx) menjadi PDF',

  async execute(client, message) {
    let inputPath;
    let outputPath;

    try {
      const target = await getMediaMessage(message);
      if (!target) {
        return message.reply(
          `📄 Kirim file *.docx* dengan caption *${client.prefix}topdf*, atau reply file .docx dengan perintah itu.`
        );
      }

      const media = await target.downloadMedia();
      const originalName = media?.filename || 'dokumen.docx';
      const isDocx =
        media?.mimetype === DOCX_MIME || originalName.toLowerCase().endsWith('.docx');

      if (!media || !isDocx) {
        return message.reply('⚠️ File harus berformat *.docx* (Word). Format .doc lama belum didukung.');
      }

      await message.reply('⏳ Sedang mengonversi ke PDF...');

      await fs.ensureDir(TEMP_DIR);
      const id = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      inputPath = path.join(TEMP_DIR, `${id}.docx`);
      outputPath = path.join(TEMP_DIR, `${id}.pdf`);

      await fs.writeFile(inputPath, Buffer.from(media.data, 'base64'));
      await convertDocxToPdf(inputPath, outputPath);

      const pdfBuffer = await fs.readFile(outputPath);
      const pdfName = originalName.replace(/\.docx$/i, '') + '.pdf';
      const pdfMedia = new MessageMedia(
        mime.lookup('pdf') || 'application/pdf',
        pdfBuffer.toString('base64'),
        pdfName
      );

      await client.sendMessage(message.from, pdfMedia, {
        sendMediaAsDocument: true,
        caption: '✅ Berhasil dikonversi ke PDF',
      });
    } catch (err) {
      console.error('[topdf] Error:', err);
      await message.reply(
        '❌ Gagal mengonversi dokumen.\n' +
          'Pastikan *Java* sudah terpasang (cek dengan `java -version`) dan file tidak rusak.'
      );
    } finally {
      // Wajib hapus file sampah di ./temp/ apa pun hasilnya
      for (const file of [inputPath, outputPath]) {
        if (!file) continue;
        try {
          await fs.unlink(file);
        } catch (err) {
          if (err.code !== 'ENOENT') console.error('[topdf] Gagal hapus temp:', err.message);
        }
      }
    }
  },
};