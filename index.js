import "dotenv/config";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";
import QRCode from "qrcode";

const { Client, LocalAuth } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PREFIX = process.env.PREFIX || "!";

// Pastikan folder yang dibutuhkan tersedia
await fs.ensureDir(path.join(__dirname, "temp"));
await fs.ensureDir(path.join(__dirname, "session"));

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, "session") }),
  puppeteer: {
    executablePath:
      "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.prefix = PREFIX;
client.commands = new Map();

// Dynamic Command Loader: baca semua file .js di folder commands/
async function loadCommands() {
  const commandsDir = path.join(__dirname, "commands");
  const files = (await fs.readdir(commandsDir)).filter((f) =>
    f.endsWith(".js"),
  );

  for (const file of files) {
    try {
      // pathToFileURL dibutuhkan agar import dinamis jalan di Windows
      const module = await import(
        pathToFileURL(path.join(commandsDir, file)).href
      );
      const command = module.default;

      if (!command?.name || typeof command.execute !== "function") {
        console.warn(`⚠️  Lewati ${file}: format command tidak valid`);
        continue;
      }
      client.commands.set(command.name, command);
      console.log(`✅ Command dimuat: ${PREFIX}${command.name}`);
    } catch (err) {
      console.error(`❌ Gagal memuat ${file}:`, err);
    }
  }
}

client.on("qr", async (qr) => {
  const file = path.join(__dirname, "temp", "qr.png");
  await QRCode.toFile(file, qr, { width: 400 });
  console.log(`\n📱 QR disimpan di: ${file}\n`);
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () =>
  console.log("🔐 Autentikasi berhasil, sesi tersimpan."),
);
client.on("auth_failure", (msg) => console.error("❌ Autentikasi gagal:", msg));
client.on("disconnected", (reason) => console.warn("⚠️  Terputus:", reason));
client.on("ready", () => console.log("🚀 Bot siap digunakan!"));

// message_create dipakai agar pesan dari nomor sendiri juga terbaca (berguna saat testing)
client.on("message_create", async (message) => {
  try {
    const body = message.body?.trim() ?? "";
    // Untuk media dengan caption, body berisi caption sehingga tetap terbaca
    if (!body.startsWith(PREFIX)) return;

    const [rawName, ...args] = body.slice(PREFIX.length).split(/\s+/);
    const command = client.commands.get(rawName.toLowerCase());
    if (!command) return;

    console.log(`📩 ${PREFIX}${command.name} dari ${message.from}`);
    await command.execute(client, message, args);
  } catch (err) {
    console.error("❌ Error saat menjalankan command:", err);
    try {
      await message.reply(
        "❌ Terjadi kesalahan tak terduga. Coba lagi nanti ya.",
      );
    } catch {
      // abaikan jika balasan pun gagal
    }
  }
});

client.on("loading_screen", (percent, message) =>
  console.log(`⏳ Memuat WhatsApp Web: ${percent}% ${message}`),
);

process.on("unhandledRejection", (err) =>
  console.error("Unhandled rejection:", err),
);

process.on("uncaughtException", (err) =>
  console.error("Uncaught exception:", err),
);

await loadCommands();
console.log("⏳ Menyalakan bot...");
await client.initialize();
