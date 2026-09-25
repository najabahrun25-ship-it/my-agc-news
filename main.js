export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // Halaman Utama / Beranda
      if (url.pathname === "/" || url.pathname === "/index") {
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
                </style>
            </head>
            <body>
                <h1>📰 AGC News AI Terbaru</h1>
                <p>Website berita otomatis berbasis Cloudflare Workers & D1 Database.</p>
                <hr>
                <ul>${htmlList}</ul>
            </body>
            </html>
          `;

          return new Response(html, {
            headers: { "Content-Type": "text/html;charset=UTF-8" },
          });
        } catch (dbErr) {
          return new Response(`Error Database: ${dbErr.message}`, { status: 200 });
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
      return new Response(`Worker Error: ${err.message}`, { status: 500 });
    }
  },

  async scheduled(event, env, ctx) {
    console.log("Cron trigger otomatis berjalan untuk mengambil berita baru...");
    // Di sini nanti kita pasang logika fetch RSS / AI auto-writing berita
  }
};
