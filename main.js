export default {
  async fetch(request, env, ctx) {
    // Kode untuk menampilkan website (sudah berjalan normal)
    // ...
  },

  async scheduled(event, env, ctx) {
    console.log("Cron trigger berjalan: Mengambil berita terbaru dari US...");
    
    try {
      // 1. Contoh mengambil RSS Feed berita US (misal: RSS dari sumber publik)
      const rssUrl = "https://rss.cnn.com/rss/edition_us.rss"; // atau sumber RSS lain
      const response = await fetch(rssUrl);
      const xmlText = await response.text();

      // 2. Parser sederhana untuk mengambil judul, link, dan deskripsi dari RSS XML
      // (Kita bisa ekstrak item pertama dari RSS)
      const titleMatch = xmlText.match(/<item>.*?<title>(.*?)<\/title>.*?<link>(.*?)<\/link>/s);
      
      if (titleMatch) {
        let title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
        let sourceUrl = titleMatch[2].trim();
        let slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').trim();
        let content = `<p>Berita otomatis terbaru dari Amerika Serikat mengenai perkembangan terkini.</p><p>Sumber asli: <a href="${sourceUrl}" target="_blank">Baca selengkapnya</a></p>`;

        // 3. Simpan ke Database D1 secara otomatis (Cek duplikasi slug dulu)
        const existing = await env.DB.prepare("SELECT id FROM articles WHERE slug = ?").bind(slug).first();
        
        if (!existing) {
          await env.DB.prepare(
            "INSERT INTO articles (title, slug, content, source_url) VALUES (?, ?, ?, ?)"
          ).bind(title, slug, content, sourceUrl).run();
          
          console.log(`Berhasil menyimpan berita baru: ${title}`);
        } else {
          console.log("Berita sudah ada di database, melewati...");
        }
      }
    } catch (err) {
      console.error("Gagal mengambil berita otomatis:", err.message);
    }
  }
};
