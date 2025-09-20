import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Use Inter from Google Fonts for a modern UI */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <body className="app-root">
        {children}

        {/* Global modern styles injected here to avoid creating new files */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root{
              --bg-100: #0f1724;
              --bg-200: #071033;
              --card: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
              --muted: #9aa6b2;
              --text: #e6eef8;
              --accent: #7c3aed;
              --accent-2: #06b6d4;
              --accent-3: #ff6b6b;
              --glass: rgba(255,255,255,0.04);
              --radius: 14px;
              --shadow-sm: 0 10px 30px rgba(2,6,23,0.6);
              --container-w: 1200px;
            }

            html,body,#root{height:100%}
            body{
              margin:0;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
              background: radial-gradient(1200px 600px at 10% 10%, rgba(124,58,237,0.08), transparent 10%),
                          radial-gradient(900px 400px at 90% 90%, rgba(6,182,212,0.06), transparent 10%),
                          linear-gradient(180deg, var(--bg-100), var(--bg-200));
              color: var(--text);
              -webkit-font-smoothing:antialiased;
              -moz-osx-font-smoothing:grayscale;
              line-height:1.45;
              -webkit-font-variant-ligatures: discretionary-ligatures;
            }

            .container{
              width:100%;
              max-width:var(--container-w);
              margin:0 auto;
              padding: 0 24px;
            }

            /* Buttons */
            button{
              font-family:inherit;
              font-weight:700;
              background: linear-gradient(90deg,var(--accent),var(--accent-2));
              color:#fff;
              border: none;
              padding:10px 14px;
              border-radius:10px;
              cursor:pointer;
              transition:all .16s cubic-bezier(.2,.9,.2,1);
              box-shadow: 0 8px 30px rgba(12,18,40,0.5);
            }
            button:hover{ transform:translateY(-3px) scale(1.01); box-shadow: 0 14px 40px rgba(12,18,40,0.6) }
            button.ghost{
              background:transparent;color:var(--text);border:1px solid rgba(255,255,255,0.06);box-shadow:none;padding:10px 12px;
            }
            .brand{
              font-weight:800;
              letter-spacing:-0.02em;
              display:inline-flex;
              align-items:center;
              gap:12px;
            }
            .brand .logo{
              width:44px;height:44px;border-radius:10px;
              background:linear-gradient(135deg,var(--accent),#f472b6);
              display:inline-block;
              box-shadow:0 12px 30px rgba(124,58,237,0.16);
            }

            /* utility */
            .card{
              background: var(--card);
              border-radius:var(--radius);
              box-shadow:var(--shadow-sm);
              padding:18px;
              border:1px solid rgba(255,255,255,0.03);
              backdrop-filter: blur(6px);
            }
            .muted{color:var(--muted)}
            .hero{
              padding:56px 0;
            }
            .hero h1{font-size:36px;margin:0 0 8px;color:var(--text)}
            .hero p{margin:0;color:var(--muted)}

            /* Mindmap client adjustments */
            .mm-root{height:100%;display:flex;flex-direction:column;background:transparent}
            .mm-toolbar{
              background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
              border-bottom:1px solid rgba(255,255,255,0.02);
              padding:12px 16px;
              display:flex;align-items:center;gap:8px;
            }
            .mm-toolbar button{
              background:transparent;border:1px solid rgba(255,255,255,0.04);padding:8px 10px;border-radius:10px;color:var(--text)
            }
            .mm-toolbar button.active{background:linear-gradient(90deg,var(--accent),var(--accent-2));color:#fff;border-color:transparent;box-shadow:0 10px 30px rgba(124,58,237,0.12)}
            .mm-main{display:flex;flex:1;min-height:0;gap:18px;padding:18px}
            .mm-sidebar{
              width:320px;padding:18px;border-left:1px solid rgba(255,255,255,0.02);
              background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
            }
            .mm-sidebar input, .mm-sidebar textarea{border:1px solid rgba(255,255,255,0.04);padding:12px;border-radius:10px;width:100%;font-family:inherit;background:transparent;color:var(--text)}
            .mm-nodes-list{background:transparent;border:none;padding:0}
            .mm-nodes-list li{padding:10px;border-radius:10px;margin-bottom:8px;border:1px solid rgba(255,255,255,0.02);background:linear-gradient(90deg, rgba(255,255,255,0.01), transparent)}
            .mm-nodes-list li.selected{background:linear-gradient(90deg, rgba(124,58,237,0.12), rgba(6,182,212,0.06));border-color:rgba(124,58,237,0.12)}
            .mm-palette{width:160px;padding:16px;border-radius:12px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.02)}

            /* Login page styles */
            .login-page{min-height:calc(100vh - 72px);display:flex;align-items:center;justify-content:center;padding:40px}
            .login-wrap{display:flex;gap:28px;max-width:980px;width:100%}
            .login-left{
              flex:1;background:linear-gradient(135deg,var(--accent),var(--accent-2));
              border-radius:18px;padding:36px;color:#fff;display:flex;flex-direction:column;justify-content:center;
              box-shadow: 0 20px 60px rgba(6,12,30,0.6);
              position:relative;overflow:hidden;
            }
            .login-left h2{margin:0 0 8px;font-size:28px;letter-spacing:-0.01em}
            .login-left p{margin:0;color:rgba(255,255,255,0.9);opacity:0.95}
            .login-decor{
              position:absolute;right:-60px;top:-40px;width:320px;height:320px;border-radius:50%;
              background:radial-gradient(circle at 30% 30%, rgba(255,255,255,0.06), transparent 30%), rgba(255,255,255,0.02);
              transform:rotate(18deg);filter:blur(18px);
            }

            .login-right{width:420px;display:flex;align-items:center;justify-content:center}
            .login-card{width:100%;padding:28px;border-radius:14px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.03)}
            .login-card h3{margin:0 0 12px;color:var(--text);font-size:20px}
            .login-field{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}
            .login-field input{background:transparent;border:1px solid rgba(255,255,255,0.06);padding:12px;border-radius:10px;color:var(--text);outline:none}
            .login-actions{display:flex;gap:10px;align-items:center;margin-top:6px}
            .social-btn{flex:1;padding:10px;border-radius:10px;background:transparent;border:1px solid rgba(255,255,255,0.04);color:var(--text)}
            .login-footer{margin-top:14px;color:var(--muted);font-size:13px;text-align:center}

            /* responsive tweaks */
            @media (max-width:980px){
              .login-wrap{flex-direction:column;padding:0}
              .login-right{width:100%}
              .mm-sidebar{display:none}
            }

            /* Strong header overrides so homepage header can't stay white */
            /* target common header element names and classes used by pages/themes */
            header,
            .header,
            .site-header,
            .page-header,
            .masthead,
            .topbar,
            nav,
            .mm-toolbar {
              background: transparent !important;
              background-color: transparent !important;
              color: var(--text) !important;
              border: none !important;
              box-shadow: none !important;
            }

            /* ensure any child panels inside header are transparent too */
            header *, .header * {
              background: transparent !important;
              color: inherit !important;
            }

            /* buttons/links in header should use theme colors */
            header button, header a, .header button, .header a, .mm-toolbar button, .mm-toolbar a {
              color: var(--text) !important;
              border-color: rgba(255,255,255,0.04) !important;
              background: transparent !important;
            }

            /* keep subtle divider if needed but dark */
            header[role="banner"], .site-header[role="banner"] {
              border-bottom: 1px solid rgba(255,255,255,0.02) !important;
            }
          `
        }} />
      </body>
    </html>
  )
}
