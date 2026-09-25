from js import Response
import traceback

async def on_fetch(request, env, ctx):
    try:
        # Cek koneksi database dan ambil data
        query = "SELECT title, slug, created_at FROM articles ORDER BY id DESC LIMIT 10"
        result = await env.DB.prepare(query).all()
        
        posts = result.results if hasattr(result, 'results') else []
        
        html_list = ""
        for post in posts:
            title = post.get('title') if isinstance(post, dict) else post.title
            slug = post.get('slug') if isinstance(post, dict) else post.slug
            created_at = post.get('created_at') if isinstance(post, dict) else post.created_at
            html_list += f"<li><b>{title}</b> <small>({created_at})</small></li>"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head><title>Test AGC</title></head>
        <body>
            <h1>Berhasil Terhubung ke Database!</h1>
            <ul>{html_list if html_list else "<li>Belum ada artikel.</li>"}</ul>
        </body>
        </html>
        """
        return Response.new(html, headers={"Content-Type": "text/html;charset=UTF-8"})
        
    except Exception as e:
        # Menampilkan detail error persis di browser untuk debugging
        error_detail = traceback.format_exc()
        html_error = f"""
        <h2>Terjadi Kendala pada Kode Python Worker:</h2>
        <pre>{error_detail}</pre>
        """
        return Response.new(html_error, headers={"Content-Type": "text/html;charset=UTF-8"}, status=200)

async def on_scheduled(event, env, ctx):
    print("Cron berjalan.")
