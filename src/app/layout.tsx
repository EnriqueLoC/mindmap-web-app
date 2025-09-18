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
              --bg-100: #f8fafc;
              --bg-200: #eef2f7;
              --card: #ffffff;
              --muted: #64748b;
              --text: #0f1724;
              --accent: #2563eb;
              --glass: rgba(255,255,255,0.6);
              --radius: 10px;
              --shadow-sm: 0 6px 18px rgba(11,22,40,0.06);
              --container-w: 1100px;
            }
            html,body,#root{height:100%}
            body{
              margin:0;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
              background: linear-gradient(180deg, var(--bg-100), var(--bg-200));
              color: var(--text);
              -webkit-font-smoothing:antialiased;
              -moz-osx-font-smoothing:grayscale;
              line-height:1.45;
            }
            .container{
              width:100%;
              max-width:var(--container-w);
              margin:0 auto;
              padding: 0 20px;
            }
            /* Buttons */
            button{
              font-family:inherit;
              font-weight:600;
              background:var(--card);
              color:var(--text);
              border:1px solid rgba(15,23,36,0.06);
              padding:8px 12px;
              border-radius:8px;
              cursor:pointer;
              transition:all .14s ease;
              box-shadow:var(--shadow-sm);
            }
            button:hover{ transform:translateY(-1px); box-shadow: 0 10px 30px rgba(11,22,40,0.09) }
            button.ghost{
              background:transparent;border:1px solid rgba(15,23,36,0.06);
            }
            .brand{
              font-weight:700;
              letter-spacing:-0.02em;
              display:inline-flex;
              align-items:center;
              gap:10px;
            }
            .brand .logo{
              width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,var(--accent),#7c3aed);display:inline-block;
              box-shadow:0 6px 18px rgba(37,99,235,0.12);
            }

            /* utility */
            .card{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow-sm);padding:16px}
            .muted{color:var(--muted)}
            .hero{
              padding:56px 0;
            }
            .hero h1{font-size:34px;margin:0 0 8px}
            .hero p{margin:0;color:var(--muted)}

            /* Small adjustments for the MindmapClient classes to blend with the modern theme */
            .mm-root{height:100%;display:flex;flex-direction:column;background:transparent}
            .mm-toolbar{
              background:linear-gradient(90deg, rgba(255,255,255,0.9), rgba(250,250,252,0.9));
              border-bottom:1px solid rgba(15,23,36,0.04);
              padding:10px 14px;
              display:flex;align-items:center;gap:8px;
            }
            .mm-toolbar button{background:transparent;border:1px solid rgba(15,23,36,0.06);padding:8px 10px;border-radius:8px}
            .mm-toolbar button.active{background:var(--accent);color:#fff;border-color:transparent; box-shadow: 0 8px 20px rgba(37,99,235,0.14)}
            .mm-main{display:flex;flex:1;min-height:0}
            .mm-sidebar{width:300px;padding:16px;border-left:1px solid rgba(15,23,36,0.03);background:linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.4))}
            .mm-sidebar input, .mm-sidebar textarea{border:1px solid rgba(15,23,36,0.06);padding:10px;border-radius:8px;width:100%;font-family:inherit}
            .mm-nodes-list{background:transparent;border:none;padding:0}
            .mm-nodes-list li{padding:8px;border-radius:8px;margin-bottom:6px;border:1px solid rgba(15,23,36,0.03)}
            .mm-nodes-list li.selected{background:linear-gradient(90deg, rgba(37,99,235,0.06), rgba(124,58,237,0.03));border-color:rgba(37,99,235,0.12)}

            /* responsive tweaks */
            @media (max-width:900px){
              .container{padding:0 14px}
              .mm-sidebar{display:none}
              .hero{padding:28px 0}
            }
          `
        }} />
      </body>
    </html>
  )
}
