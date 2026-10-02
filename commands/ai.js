import { GoogleGenerativeAI } from "@google/generative-ai";

let model = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Inisialisasi model sekali saja (lazy), supaya bot tetap jalan walau API key belum diisi
function getModel() {
  if (model) return model;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    systemInstruction:
      "Kamu adalah asisten WhatsApp yang ramah dan ringkas. Jawab dalam bahasa yang sama dengan pengguna.",
  });
  return model;
}

// Coba ulang kalau server AI sedang sibuk (503/500)
async function generateWithRetry(aiModel, prompt, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      return await aiModel.generateContent(prompt);
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      const retryable = status === 503 || status === 500;
      if (!retryable || i === tries - 1) throw err;
      await sleep(2000 * (i + 1)); // tunggu 2 detik, lalu 4 detik
    }
  }
}

export default {
  name: "ai",
  description: "Tanya jawab dengan AI (Gemini)",

  async execute(client, message, args) {
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return message.reply(
        `🧠 Tulis pertanyaanmu setelah perintah.\nContoh: *${client.prefix}ai apa itu API?*`,
      );
    }

    const aiModel = getModel();
    if (!aiModel) {
      return message.reply("⚠️ GEMINI_API_KEY belum diatur di file .env.");
    }

    try {
      // Indikator mengetik bersifat opsional: kalau gagal, lanjutkan saja
      try {
        const chat = await message.getChat();
        await chat.sendStateTyping();
      } catch {
        // abaikan
      }

      const result = await generateWithRetry(aiModel, prompt);
      const answer = result.response.text()?.trim();

      if (!answer) {
        return message.reply(
          "🤔 AI tidak memberikan jawaban. Coba ubah pertanyaanmu.",
        );
      }

      await message.reply(answer);
    } catch (err) {
      console.error("[ai] Error:", err);

      const status = err?.status ?? err?.response?.status;
      const text = String(err?.message || "");

      if (status === 429 || /quota|rate limit|RESOURCE_EXHAUSTED/i.test(text)) {
        return message.reply(
          "⏳ Kuota AI sedang habis atau terlalu sering dipakai. Coba lagi beberapa saat lagi ya.",
        );
      }
      if (status === 503) {
        return message.reply(
          "⏳ Server AI sedang sibuk. Coba lagi sebentar lagi ya.",
        );
      }
      if (status === 400 && /API key/i.test(text)) {
        return message.reply(
          "🔑 API key Gemini tidak valid. Periksa kembali file .env.",
        );
      }
      if (status === 404) {
        return message.reply(
          "⚠️ Model AI tidak ditemukan. Periksa nilai GEMINI_MODEL di file .env.",
        );
      }
      if (/SAFETY|blocked/i.test(text)) {
        return message.reply(
          "🚫 Pertanyaan ini diblokir oleh filter keamanan AI.",
        );
      }

      await message.reply("❌ Gagal menghubungi AI. Coba lagi nanti.");
    } finally {
      try {
        const chat = await message.getChat();
        await chat.clearState();
      } catch {
        // abaikan
      }
    }
  },
};