import sharp from 'sharp';
import pkg from 'whatsapp-web.js';

const { MessageMedia } = pkg;

async function getMediaMessage(message) {
  if (message.hasMedia) return message;
  if (message.hasQuotedMsg) {
    const quoted = await message.getQuotedMessage();
    if (quoted.hasMedia) return quoted;
  }
  return null;
}

// Ubah gambar menjadi WebP 512x512, latar transparan
async function toStickerWebp(buffer) {
  return sharp(buffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 70 })
    .toBuffer();
}

export default {
  name: 'stiker',
  description: 'Ubah gambar menjadi stiker',

  async execute(client, message) {
    try {
      const target = await getMediaMessage(message);
      if (!target) {
        return message.reply(
          `🖼️ Kirim gambar dengan caption *${client.prefix}stiker*, atau reply gambar dengan perintah itu.`
        );
      }

      const media = await target.downloadMedia();
      if (!media || !media.mimetype?.startsWith('image/')) {
        return message.reply('⚠️ Media harus berupa *gambar* (JPG/PNG/WebP).');
      }

      await message.reply('⏳ Sedang membuat stiker...');

      const webpBuffer = await toStickerWebp(Buffer.from(media.data, 'base64'));
      const stickerMedia = new MessageMedia('image/webp', webpBuffer.toString('base64'));

      await client.sendMessage(message.from, stickerMedia, {
        sendMediaAsSticker: true,
        stickerName: 'WhatsApp AI Bot',
        stickerAuthor: 'Bot',
      });
    } catch (err) {
      console.error('[stiker] Error:', err);
      await message.reply('❌ Gagal membuat stiker. Pastikan gambarnya valid, lalu coba lagi.');
    }
  },
};