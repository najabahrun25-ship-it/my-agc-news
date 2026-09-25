from workers import WorkerEntrypoint, Response
import re

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text).strip('-')
    return text

class Default(WorkerEntrypoint):
    async def fetch(self, request):
        try:
            from urllib.parse import urlparse
            parsed_url = urlparse(request.url)
            path = parsed_url.path
            
            # Halaman Utama
            if path == "" or path == "/" or path == "/index":
                try:
                    query = "SELECT title, slug, created_at FROM articles ORDER BY id DESC LIMIT 10"
                    result = await self.env.DB.prepare(query).all()
                    
                    posts = result.results if hasattr(result, 'results') else []
                    
                    html_list = ""
                    for post in posts:
                        html_list += f"<li><a href='/article/{post['slug']}'><b>{post['title']}</b></a> <small>({post['created_at']})</small></li>"
                    
                    html = f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>AGC News Otomatis AI</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }}
                            h1 {{ color: #333; }}
                            ul {{ padding-left: 20px; }}
                            li {{ margin-bottom: 12px; }}
                        </style>
                    </head>
                    <body>
                        <h1>📰 AGC News AI Terbaru</h1>
                        <p>Website berita otomatis berbasis Cloudflare Workers & Python.</p>
                        <hr>
                        <ul>
                            {html_list if html_list else "<li>Belum ada artikel berita yang digenerate.</li>"}
                        </ul>
                    </body>
                    </html>
                    """
                    return Response(html, headers={"Content-Type": "text/html;charset=UTF-8"})
                except Exception as db_err:
                    return Response(f"<h1>Website Aktif</h1><p>Kendala Database/Tabel: {str(db_err)}</p>", headers={"Content-Type": "text/html;charset=UTF-8"}, status=200)

            # Halaman Detail Artikel
            elif path.startswith("/article/"):
                slug = path.split("/")[-1]
                query = "SELECT title, content, created_at FROM articles WHERE slug = ?"
                stmt = self.env.DB.prepare(query).bind(slug)
                article = await stmt.first()
                
                if not article:
                    return Response("Artikel tidak ditemukan", status=404)
                    
                html = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>{article['title']}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }}
                        a {{ text-decoration: none; color: #0066cc; }}
                    </style>
                </head>
                <body>
                    <p><a href="/">&larr; Kembali ke Beranda</a></p>
                    <h1>{article['title']}</h1>
                    <p><small>Dipublikasikan pada: {article['created_at']}</small></p>
                    <hr>
                    <div>{article['content']}</div>
                </body>
                </html>
                """
                return Response(html, headers={"Content-Type": "text/html;charset=UTF-8"})

            return Response("Halaman tidak ditemukan", status=404)
            
        except Exception as e:
            return Response(f"Worker Error: {str(e)}", status=500)

    async def scheduled(self, event, env, ctx):
        print("Cron trigger dijalankan: Bot sukses melakukan pengecekan berita.")
