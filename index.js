const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');

// Config dosyasını oku
let config;
try {
    config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
} catch (error) {
    console.error('[-] config.json dosyası bulunamadı veya biçimi hatalı!');
    process.exit(1);
}

// tokens.txt ve chat.txt dosyalarını oku ve dizilere aktar
const tokens = fs.readFileSync('./tokens.txt', 'utf8')
    .split('\n')
    .map(t => t.trim())
    .filter(t => t.length > 0);

const chatPool = fs.readFileSync('./chat.txt', 'utf8')
    .split('\n')
    .map(c => c.trim())
    .filter(c => c.length > 0);

// Kontroller
if (tokens.length === 0) {
    console.error('[-] tokens.txt dosyası boş! Lütfen token ekleyin.');
    process.exit(1);
}

if (chatPool.length === 0) {
    console.error('[-] chat.txt dosyası boş! Lütfen atılacak mesajları ekleyin.');
    process.exit(1);
}

const activeClients = [];

// Minimum ve Maksimum arasında rastgele gecikme süresi hesaplar
function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Diziden rastgele eleman seçer
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Tüm hesapları giriş yaptır
console.log(`[*] Toplam ${tokens.length} token bağlanıyor...`);

tokens.forEach((token, index) => {
    const client = new Client({ checkUpdate: false });

    client.on('ready', () => {
        console.log(`[+] Hesap ${index + 1} aktif: ${client.user.tag}`);
        activeClients.push(client);

        // İlk aktif hesap bağlandığında döngüyü başlat
        if (activeClients.length === 1) {
            console.log('[+] Mesaj gönderme döngüsü başlatılıyor...\n');
            sendRandomMessageLoop();
        }
    });

    client.login(token).catch(err => {
        console.log(`[-] Hesap ${index + 1} giriş yapamadı:`, err.message);
    });
});

// Sürekli çalışan mesaj gönderme fonksiyonu
async function sendRandomMessageLoop() {
    if (activeClients.length === 0) {
        console.log('[-] Aktif hesap kalmadı, 5 saniye sonra tekrar deneniyor...');
        setTimeout(sendRandomMessageLoop, 5000);
        return;
    }

    // Aktif hesaplar arasından rastgele birini seç
    const randomClient = getRandomItem(activeClients);
    // Mesaj havuzundan rastgele bir mesaj seç
    const randomMessage = getRandomItem(chatPool);

    try {
        const channel = await randomClient.channels.fetch(config.channelId);
        if (channel) {
            await channel.send(randomMessage);
            console.log(`[+] [${randomClient.user.tag}] -> Mesaj gönderildi: "${randomMessage}"`);
        } else {
            console.error(`[-] Kanal bulunamadı veya erişim yok! Channel ID: ${config.channelId}`);
        }
    } catch (error) {
        console.error(`[-] Mesaj gönderilirken hata (${randomClient.user.tag}):`, error.message);
    }

    // Belirlenen aralıkta rastgele gecikme seç
    const delay = getRandomDelay(config.minDelayMs, config.maxDelayMs);
    console.log(`[*] Bir sonraki mesaj ${(delay / 1000).toFixed(1)} saniye sonra atılacak.\n`);

    // Gecikme süresi kadar bekle ve döngüyü tekrar çalıştır
    setTimeout(sendRandomMessageLoop, delay);
}