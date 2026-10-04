import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import mime from "mime-types";
import mammoth from "mammoth";
import puppeteer from "puppeteer-core";
import pkg from "whatsapp-web.js";

const { MessageMedia } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, "..", "temp");
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const BROWSER_PATH =
  process.env.BROWSER_PATH ||
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";

// Logika konversi dipisah di satu fungsi.
// DOCX -> HTML (mammoth) -> PDF (browser yang sama dengan bot).
// Jika nanti pindah ke LibreOffice, cukup ubah fungsi ini saja.
async function convertDocxToPdf(inputPath, outputPath) {
  const { value: body } = await mammoth.convertToHtml({ path: inputPath });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; }
    table { border-collapse: collapse; }
    td, th { border: 1px solid #999; padding: 4px 8px; }
    img { max-width: 100%; }
  </style></head><body>${body}</body></html>`;

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.pdf({
      path: outputPath,
      format: "A4",
      margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
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
  name: "topdf",
  aliases: ["pdf"],
  description: "Ubah file Word (.docx) menjadi PDF",

  async execute(client, message) {
    let inputPath;
    let outputPath;

    try {
      const target = await getMediaMessage(message);
      if (!target) {
        return message.reply(
          `📄 Kirim file *.docx* dengan caption *${client.prefix}topdf*, atau reply file .docx dengan perintah itu.`,
        );
      }

      const media = await target.downloadMedia();
      const originalName = media?.filename || "dokumen.docx";
      const isDocx =
        media?.mimetype === DOCX_MIME ||
        originalName.toLowerCase().endsWith(".docx");

      if (!media || !isDocx) {
        return message.reply(
          "⚠️ File harus berformat *.docx* (Word). Format .doc lama belum didukung.",
        );
      }

      await message.reply("⏳ Sedang mengonversi ke PDF...");

      await fs.ensureDir(TEMP_DIR);
      const id = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      inputPath = path.join(TEMP_DIR, `${id}.docx`);
      outputPath = path.join(TEMP_DIR, `${id}.pdf`);

      await fs.writeFile(inputPath, Buffer.from(media.data, "base64"));
      await convertDocxToPdf(inputPath, outputPath);

      const pdfBuffer = await fs.readFile(outputPath);
      const pdfName = originalName.replace(/\.docx$/i, "") + ".pdf";
      const pdfMedia = new MessageMedia(
        mime.lookup("pdf") || "application/pdf",
        pdfBuffer.toString("base64"),
        pdfName,
      );

      await client.sendMessage(message.from, pdfMedia, {
        sendMediaAsDocument: true,
        caption: "✅ Berhasil dikonversi ke PDF",
      });
    } catch (err) {
      console.error("[topdf] Error:", err);
      await message.reply(
        "❌ Gagal mengonversi dokumen. Pastikan file tidak rusak, lalu coba lagi.",
      );
    } finally {
      // Wajib hapus file sampah di ./temp/ apa pun hasilnya
      for (const file of [inputPath, outputPath]) {
        if (!file) continue;
        try {
          await fs.unlink(file);
        } catch (err) {
          if (err.code !== "ENOENT")
            console.error("[topdf] Gagal hapus temp:", err.message);
        }
      }
    }
  },
};
