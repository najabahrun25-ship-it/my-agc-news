from js import Response
import json

async def on_fetch(request, env, ctx):
    try:
        url = str(request.url)
        
        # Halaman Utama
        if url.endswith("/") or "index" in url:
            try:
                # Ambil data dari database D1
                query = "SELECT title, slug, created_at FROM articles ORDER BY id DESC LIMIT 10"
                result = await env.DB.prepare(query).all()
                
                posts = result.results if hasattr(result, 'results') else []
                
                html_list = ""
                for post in posts:
                    # Menangani dictionary atau object attribute
                    title = post.get('title') if isinstance(post, dict) else post.title
                    slug = post.get('slug') if isinstance(post, dict) else post.slug
                    created_at = post.get('created_at') if isinstance(post, dict) else post.created_at
                    
                    html_list += f"<li><a href='/article/{slug}'><b>{title}</b></a> <small>({created_at})</small></li>"
                
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
                        {html_list if html_list else "<li>Belum ada artikel berita.</li>"}
                    </ul>
                </body>
                </html>
                """
                return Response.new(html, headers={"Content-Type": "text/html;charset=UTF-8"})
            
            except Exception as db_error:
                return Response.new(f"Database Query Error: {str(db_error)}", headers={"Content-Type": "text/html;charset=UTF-8"}, status=200)

        return Response.new("Halaman tidak ditemukan", status=404)

    except Exception as e:
        return Response.new(f"Worker Exception: {str(e)}", status=500)

async def on_scheduled(event, env, ctx):
    print("Cron trigger berjalan.")
