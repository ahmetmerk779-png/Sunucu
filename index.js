const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let activeBots = [];
let serverLogs = [];

function logMessage(msg) {
  const time = new Date().toLocaleTimeString();
  const fullMsg = `[${time}] ${msg}`;
  console.log(fullMsg);
  serverLogs.unshift(fullMsg);
  if (serverLogs.length > 50) serverLogs.pop();
}

// --- WEB KONTROL PANELİ ARAYÜZÜ ---
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MC Bot Kontrol Paneli</title>
      <style>
        body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: #1e293b; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        h2 { color: #38bdf8; text-align: center; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; color: #94a3b8; }
        input { width: 100%; padding: 10px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 6px; box-sizing: border-box; }
        button { background: #0284c7; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 5px; }
        button:hover { background: #0369a1; }
        .danger { background: #dc2626; }
        .danger:hover { background: #b91c1c; }
        .logs { background: #0f172a; padding: 15px; border-radius: 6px; height: 250px; overflow-y: auto; font-family: monospace; font-size: 13px; color: #34d399; border: 1px solid #334155; margin-top: 20px; }
        .status { text-align: center; font-weight: bold; margin-bottom: 15px; color: #fbbf24; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Minecraft Bot Kontrol Paneli</h2>
        <div class="status">Aktif Bot Sayısı: <span id="botCount">${activeBots.length}</span></div>
        
        <form action="/start" method="POST">
          <div class="form-group">
            <label>Sunucu IP (Host):</label>
            <input type="text" name="host" placeholder="ornek.aternos.me" required>
          </div>
          <div class="form-group">
            <label>Sunucu Portu:</label>
            <input type="number" name="port" value="25565" required>
          </div>
          <div class="form-group">
            <label>Minecraft Sürümü (Örn: 1.20.4, 1.21 vb.):</label>
            <input type="text" name="version" value="1.20.4" required>
          </div>
          <div class="form-group">
            <label>Bot Sayısı:</label>
            <input type="number" name="count" value="3" min="1" max="20" required>
          </div>
          <button type="submit">Botları Başlat</button>
        </form>

        <form action="/stop" method="POST" style="margin-top: 10px;">
          <button type="submit" class="danger">Tüm Botları Durdur</button>
        </form>

        <form action="/command" method="POST" style="margin-top: 20px;">
          <div class="form-group">
            <label>Tüm Botlara Komut / Mesaj Gönder:</label>
            <input type="text" name="cmd" placeholder="Örn: /help veya Selamlar!" required>
          </div>
          <button type="submit" style="background: #10b981;">Komutu Gönder</button>
        </form>

        <h3>Canlı Konsol Logları</h3>
        <div class="logs" id="logsBox">
          ${serverLogs.join('<br>')}
        </div>
      </div>
      <script>
        // Logların canlı akması için sayfayı her 3 saniyede bir yeniler
        setTimeout(() => { location.reload(); }, 3000);
      </script>
    </body>
    </html>
  `);
});

// --- BOTLARI BAŞLATMA ---
app.post('/start', (req, res) => {
  const { host, port, version, count } = req.body;
  
  // Eski botlar varsa oyundan çıkar
  activeBots.forEach(b => { try { b.quit(); } catch(e){} });
  activeBots = [];

  logMessage(`[Sistem] ${count} adet bot "${host}:${port}" adresine (${version}) gönderiliyor...`);

  for (let i = 0; i < parseInt(count); i++) {
    setTimeout(() => {
      const botName = 'Bot_' + Math.floor(Math.random() * 9000 + 1000);
      
      const bot = mineflayer.createBot({
        host: host,
        port: parseInt(port),
        version: version, // Sürüm hatasını önlemek için panelden gelen değer verilir
        username: botName,
        auth: 'offline'
      });

      bot.on('spawn', () => {
        logMessage(`[Girdi] ${botName} oyuna katıldı.`);
      });

      bot.on('end', (reason) => {
        logMessage(`[Koptu] ${botName} ayrıldı: ${reason}`);
      });

      bot.on('error', (err) => {
        logMessage(`[Hata] ${botName}: ${err.message}`);
      });

      activeBots.push(bot);
    }, i * 3000); // 3 saniye arayla girerler (Anti-cheat korumasına takılmamak için)
  }

  res.redirect('/');
});

// --- BOTLARI DURDURMA ---
app.post('/stop', (req, res) => {
  logMessage('[Sistem] Tüm botlar durduruluyor...');
  activeBots.forEach(b => {
    try { b.quit(); } catch(e){}
  });
  activeBots = [];
  res.redirect('/');
});

// --- TOPLU KOMUT GÖNDERME ---
app.post('/command', (req, res) => {
  const { cmd } = req.body;
  if (!cmd) return res.redirect('/');

  logMessage(`[Komut] Tüm botlar yazıyor: "${cmd}"`);
  activeBots.forEach(bot => {
    try {
      bot.chat(cmd);
    } catch(e) {}
  });

  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Kontrol paneli ${PORT} portunda aktif.`);
});
