export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // Endpoint manual untuk memicu pengambilan berita via browser dan menampilkan status errornya
      if (url.pathname === "/run-cron") {
        let logMessage = "";
        try {
          const rssUrl = "https://rss.cnn.com/rss/edition_us.rss";
          const response = await fetch(rssUrl);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const xmlText = await response.text();
          logMessage += `Berhasil mengambil RSS (Panjang teks: ${xmlText.length}).<br>`;

          const titleMatch = xmlText.match(/<item>.*?<title>(.*?)<\/title>.*?<link>(.*?)<\/link>/s);
          
          if (titleMatch) {
            let title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
            let sourceUrl = titleMatch[2].trim();
            
            let slug = title.toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/[\s-]+/g, '-')
              .trim();

            let content = `<p>Berita otomatis terkini dari Amerika Serikat.</p><p>Sumber berita asli: <a href="${sourceUrl}" target="_blank" rel="nofollow">Baca selengkapnya</a></p>`;

            const existing = await env.DB.prepare("SELECT id FROM articles WHERE slug = ?").bind(slug).first();
            
            if (!existing) {
              await env.DB.prepare(
                "INSERT INTO articles (title, slug, content, source_url) VALUES (?, ?, ?, ?)"
              ).bind(title, slug, content, sourceUrl).run();
              logMessage += `<b>Sukses menyimpan berita:</b> ${title}<br>`;
            } else {
              logMessage += `Berita sudah ada di database (duplikat).<br>`;
            }
          } else {
            logMessage += `Gagal mencocokkan pola XML RSS.<br>`;
          }
        } catch (err) {
          logMessage += `<b>Error saat fetch:</b> ${err.message}<br>`;
        }

        return new Response(`<h3>Log Eksekusi Cron:</h3><p>${logMessage}</p><a href='/'>Kembali ke Beranda</a>`, {
          headers: { "Content-Type": "text/html;charset=UTF-8" },
        });
      }

      // Halaman Utama / Beranda
      if (url.pathname === "/" || url.pathname === "/index" || url.pathname === "") {
        try {
          const { results } = await env.DB.prepare(
            "SELECT title, slug, created_at FROM articles ORDER BY id DESC LIMIT 10"
          ).all();

          let htmlList = "";
          if (results && results.length > 0) {
            for (const post of results) {
              htmlList += `<li><a href="/article/${post.slug}"><b>${post.title}</b></a> <small>(${post.created_at})</small></li>`;
            }
          } else {
            htmlList = "<li>Belum ada artikel berita yang digenerate.</li>";
          }

          const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>AGC News Otomatis AI</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
                    h1 { color: #333; }
                    ul { padding-left: 20px; }
                    li { margin-bottom: 12px; }
                    .btn { display: inline-block; background: #0066cc; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1>📰 AGC News AI Terbaru</h1>
                <p>Website berita otomatis berbasis Cloudflare Workers & D1 Database.</p>
                <a class="btn" href="/run-cron" target="_blank">🔄 Tarik Berita Baru Sekarang</a>
                <hr>
                <ul>${htmlList}</ul>
            </body>
            </html>
          `;

          return new Response(html, {
            headers: { "Content-Type": "text/html;charset=UTF-8" },
          });
        } catch (dbErr) {
          return new Response(`Error Database: ${dbErr.message}`, { 
            headers: { "Content-Type": "text/html;charset=UTF-8" },
            status: 200 
          });
        }
      }

      // Halaman Detail Artikel
      if (url.pathname.startsWith("/article/")) {
        const slug = url.pathname.split("/").pop();
        const article = await env.DB.prepare(
          "SELECT title, content, created_at FROM articles WHERE slug = ?"
        ).bind(slug).first();

        if (!article) {
          return new Response("Artikel tidak ditemukan", { status: 404 });
        }

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
              <title>${article.title}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                  body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
                  a { text-decoration: none; color: #0066cc; }
              </style>
          </head>
          <body>
              <p><a href="/">&larr; Kembali ke Beranda</a></p>
              <h1>${article.title}</h1>
              <p><small>Dipublikasikan pada: ${article.created_at}</small></p>
              <hr>
              <div>${article.content}</div>
          </body>
          </html>
        `;

        return new Response(html, {
          headers: { "Content-Type": "text/html;charset=UTF-8" },
        });
      }

      return new Response("Halaman tidak ditemukan", { status: 404 });

    } catch (err) {
      return new Response(`Worker Fatal Error: ${err.message}`, { 
        headers: { "Content-Type": "text/html;charset=UTF-8" },
        status: 200 
      });
    }
  },

  async scheduled(event, env, ctx) {
    // Cron otomatis menggunakan URL yang sama
    // (Opsional bisa dibiarkan atau disesuaikan)
  }
};
