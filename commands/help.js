export default {
  name: 'help',
  description: 'Menampilkan menu bantuan',

  async execute(client, message) {
    const p = client.prefix;

    const text = [
      '╭─── 🤖 *MENU BOT* ───╮',
      '',
      `🎨 *${p}stiker*`,
      '   Kirim/reply gambar, ubah jadi stiker',
      '',
      `📄 *${p}topdf*`,
      '   Kirim/reply file .docx, ubah jadi PDF',
      '',
      `🧠 *${p}ai* <pertanyaan>`,
      `   Tanya apa saja ke AI. Contoh: ${p}ai apa itu API?`,
      '',
      `❓ *${p}help*`,
      '   Menampilkan menu ini',
      '',
      '╰──────────────────╯',
      `_Perintah aktif: ${client.commands.size}_`,
    ].join('\n');

    await message.reply(text);
  },
};