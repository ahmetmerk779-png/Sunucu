const mineflayer = require('mineflayer');

// Render Environment Variables (Çevre Değişkenleri) üzerinden veya doğrudan buraya yazılır
const bot = mineflayer.createBot({
  host: process.env.MC_HOST || 'sunucu_ip_adresin.aternos.me',
  port: parseInt(process.env.MC_PORT) || 12345,
  username: process.env.MC_USERNAME || 'CloudBot',
  auth: 'offline' // Çevrimdışı (cracked) sunucular için
});

bot.on('spawn', () => {
  console.log('Bot başarıyla oyuna giriş yaptı!');
  bot.chat('Selam! Render bulut sunucusundan bağlandım.');
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  console.log(`[Mesaj] <${username}>: ${message}`);
  
  // Örnek tetikleyici komut
  if (message === '!sa') {
    bot.chat(`Aleykümselam ${username}!`);
  }
});

bot.on('error', (err) => {
  console.log('Bot hata aldı:', err);
});

bot.on('end', () => {
  console.log('Bot bağlantısı kesildi, yeniden bağlanılıyor...');
  setTimeout(() => {
    // Otomatik yeniden bağlanma mekanizması
    process.exit(1); 
  }, 5000);
});
