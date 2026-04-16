/**
 * Üretir:  -posts/*.html — her ürün görseli için   paylaşım taslağı + PNG indirme.
 * Çalıştır: node build- -posts.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, ' -posts-data.json'), 'utf8'));
const outDir = path.join(__dirname, ' -posts');
fs.mkdirSync(outDir, { recursive: true });

function slugify(filename) {
  const base = path.basename(filename, path.extname(filename))
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .toLowerCase();
  return base || 'post';
}

/** Üst klasördeki görsel dosyasına güvenli relatif URL (boşluk, Türkçe karakter vb.) */
function imageSrcRelative(imageFile) {
  const name = String(imageFile).replace(/\\/g, '/').split('/').pop();
  return '../' + encodeURIComponent(name);
}

function bulletsHtml(item) {
  const bullets = Array.isArray(item.bullets) ? item.bullets : [];
  if (!bullets.length) return '';
  return (
    '<ul class="li-bullets">' +
    bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('') +
    '</ul>'
  );
}

const template = (item, slug) => `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EPC Enerji —   — ${escapeHtml(item.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=block" rel="stylesheet">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=block');
  /* Century Gothic sistem fontu olarak yüklenir (Windows/Mac), yedek: Nunito benzeri geometrik */
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Century Gothic', 'AppleGothic', 'Gill Sans', Calibri, sans-serif;
    background: #e8ecf1;
    min-height: 100vh;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: center;
    max-width: 1200px;
    width: 100%;
  }
  .toolbar a, .toolbar button {
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    padding: 10px 18px;
    border-radius: 10px;
    border: 1px solid rgba(0,0,0,.1);
    background: #fff;
    color: #1a1d23;
    text-decoration: none;
    cursor: pointer;
    transition: background .2s, transform .15s;
  }
  .toolbar a:hover, .toolbar button:hover { background: #f0f2f5; }
  .toolbar button.primary {
    background: linear-gradient(135deg, #4B2D7F, #5da832);
    color: #fff;
    border: none;
  }
  .toolbar button.primary:hover { filter: brightness(1.05); }
  .toolbar button:disabled { opacity: .55; cursor: wait; }
  .hint { font-size: 12px; color: #6b7280; max-width: 640px; text-align: center; line-height: 1.55; }
  .hint code { font-size: 11px; background: rgba(0,0,0,.06); padding: 2px 6px; border-radius: 4px; }
  /* ───   4:5 (1080×1350) modern layout ─── */
  .li-canvas-wrap {
    border-radius: 16px;
    overflow: hidden;
    line-height: 0;
    box-shadow: 0 32px 80px rgba(0,0,0,.22), 0 4px 12px rgba(0,0,0,.08);
  }
  .li-canvas {
    position: relative;
    width: 1080px;
    height: 1350px;
    overflow: hidden;
    background: #0c0a14;
    font-family: 'Century Gothic', 'AppleGothic', 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .li-canvas * {
    font-family: 'Century Gothic', 'AppleGothic', 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
  }
  /* — fotoğraf — */
  .li-canvas .li-bg {
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center 30%;
  }
  /* — scrim: üst koyu + alt koyu, orta açık (fotoğraf nefes alır) — */
  .li-scrim {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(180deg, rgba(6,4,14,.82) 0%, rgba(6,4,14,.3) 22%, transparent 44%),
      linear-gradient(to top,  rgba(6,4,14,.90) 0%, rgba(6,4,14,.45) 28%, transparent 52%);
  }

  /* ─── ÜST ALAN: logo + seri adı ─── */
  .li-top {
    position: absolute;
    top: 0; left: 0; right: 0;
    padding: 44px 52px 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .li-top .li-logo {
    display: block;
    height: 58px;
    width: auto;
    max-width: 320px;
    object-fit: contain;
    object-position: left center;
    filter:
      drop-shadow(0 1px 0 rgba(255,255,255,.45))
      drop-shadow(0 3px 10px rgba(0,0,0,.95))
      drop-shadow(0 6px 28px rgba(0,0,0,.65));
  }
  /* kategori + seri adı bloğu */
  .li-title-block {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  /* kategori etiketi */
  .li-cat {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: #a8f580;
  }
  .li-cat::before {
    content: '';
    display: block;
    width: 22px;
    height: 3px;
    border-radius: 2px;
    background: linear-gradient(90deg, #7ed957, #4B2D7F);
    flex-shrink: 0;
  }
  /* ─── SERİ ADI: büyük, üstte ─── */
  .li-title {
    font-size: 82px;
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 0.98;
    color: #fff;
    text-shadow:
      0 2px 4px rgba(0,0,0,.9),
      0 4px 32px rgba(0,0,0,.6);
  }

  /* ─── ALT AÇIKLAMA BLOĞU ─── */
  .li-info {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    padding: 44px 52px 50px;
    backdrop-filter: blur(6px) saturate(1.15);
    -webkit-backdrop-filter: blur(6px) saturate(1.15);
    background: transparent;
  }
  /* ince ayraç çizgisi */
  .li-divider {
    width: 60px;
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(90deg, #7ed957, #4B2D7F);
    margin-bottom: 22px;
  }
  /* açıklama */
  .li-sub {
    font-size: 26px;
    font-weight: 500;
    line-height: 1.45;
    color: rgba(255,255,255,.92);
    margin-bottom: 22px;
    letter-spacing: 0.005em;
    text-shadow: 0 1px 8px rgba(0,0,0,.65);
  }
  /* maddeler */
  .li-bullets {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 0;
  }
  .li-bullets li {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    font-size: 21px;
    font-weight: 500;
    line-height: 1.4;
    color: rgba(255,255,255,.9);
    text-shadow: 0 1px 6px rgba(0,0,0,.6);
  }
  .li-bullets li::before {
    content: '';
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    margin-top: 0.5em;
    border-radius: 50%;
    background: #7ed957;
    box-shadow: 0 0 8px rgba(126,217,87,.55);
  }
  /* alt imza */
  .li-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 28px;
    padding-top: 18px;
    border-top: 1px solid rgba(255,255,255,.12);
  }
  .li-footer-brand {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,.35);
  }
  .li-footer-tag {
    font-size: 14px;
    font-weight: 600;
    color: rgba(168,245,128,.75);
    letter-spacing: 0.5px;
  }
  /* önizleme ölçeği */
  @media (max-width: 1260px) {
    .li-canvas-wrap { transform: scale(0.60); transform-origin: top center; margin-bottom: -216px; }
  }
  @media (max-width: 860px) {
    .li-canvas-wrap { transform: scale(0.44); margin-bottom: -358px; }
  }
  @media (max-width: 600px) {
    .li-canvas-wrap { transform: scale(0.32); margin-bottom: -459px; }
  }
</style>
</head>
<body>

  <div class="toolbar">
    <button type="button" class="primary" id="btnPng">Görsele çevir ve PNG indir</button>
    <a href="index.html">Tüm gönderiler</a>
    <a href="../urun-vitrin-acik-tema.html">Ürün vitrinine dön</a>
  </div>
  <p class="hint">Dışa aktarım: <strong>1080×1350 px (4:5)</strong>. PNG için: proje klasöründe <code>node preview-server.mjs</code> → <code>http://localhost:4000/ -posts/</code></p>

  <div class="li-canvas-wrap">
    <div class="li-canvas" id="capture">
      <img class="li-bg" src="${escapeAttr(imageSrcRelative(item.image))}" alt="">
      <div class="li-scrim" aria-hidden="true"></div>

      <!-- ÜST: logo + kategori + seri adı -->
      <div class="li-top">
        <img class="li-logo" src="../assets/epc-logo.png" alt="EPC Energy Power Conversion">
        <div class="li-title-block">
          <div class="li-cat">${escapeHtml(item.category)}</div>
          <h1 class="li-title">${escapeHtml(item.title)}</h1>
        </div>
      </div>

      <!-- ALT: açıklama + maddeler + imza -->
      <div class="li-info">
        <div class="li-divider"></div>
        <p class="li-sub">${escapeHtml(item.subtitle)}</p>
        ${bulletsHtml(item)}
        <div class="li-footer">
          <span class="li-footer-brand">EPC Energy Power Conversion</span>
          <span class="li-footer-tag">epcas.com.tr</span>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" crossorigin="anonymous"></script>
  <script>
    function waitImages(root) {
      const imgs = root.querySelectorAll('img');
      return Promise.all(
        Array.from(imgs).map(function (img) {
          if (img.complete && img.naturalWidth) return Promise.resolve();
          return new Promise(function (resolve, reject) {
            img.onload = function () { resolve(); };
            img.onerror = function () { reject(new Error('Görsel yüklenemedi: ' + (img.src || '').slice(-60))); };
          });
        })
      );
    }
    document.getElementById('btnPng').addEventListener('click', async function () {
      const btn = this;
      const el = document.getElementById('capture');
      if (typeof html2canvas === 'undefined') {
        alert('html2canvas yüklenemedi. İnternet bağlantınızı kontrol edin.');
        return;
      }
      if (location.protocol === 'file:') {
        alert('PNG indirmek için bu sayfayı yerel sunucu ile açın.\\nProje klasöründe terminal: node preview-server.mjs\\nSonra: http://localhost:4000/ -posts/');
        return;
      }
      btn.disabled = true;
      try {
        /* Fontların hazır olmasını bekle */
        if (document.fonts) {
          await document.fonts.ready;
        }
        await waitImages(el);
        await new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
        var opts = {
          scale: 2,
          useCORS: false,
          allowTaint: false,
          backgroundColor: '#0f0d18',
          logging: false,
          imageTimeout: 20000,
          onclone: function (doc) {
            var info = doc.querySelector('.li-info');
            if (info) {
              info.style.backdropFilter = 'none';
              info.style.webkitBackdropFilter = 'none';
            }
          }
        };
        var canvas = await html2canvas(el, opts);
        var a = document.createElement('a');
        a.download = 'epc- -${slug}.png';
        a.href = canvas.toDataURL('image/png', 0.92);
        a.click();
      } catch (e) {
        console.error(e);
        var msg = e && e.message ? e.message : String(e);
        alert('Dışa aktarma başarısız: ' + msg + '\\n\\nProje kökünde: node preview-server.mjs\\nAdres: http://localhost:3847/ -posts/');
      } finally {
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>
`;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

const indexRows = [];

data.forEach((item, index) => {
  const slug = slugify(item.image);
  const filename = ` -${slug}.html`;
  fs.writeFileSync(path.join(outDir, filename), template(item, slug), 'utf8');
  indexRows.push({ filename, title: item.title, category: item.category });
});

const indexHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EPC Enerji —   gönderi taslakları</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Century Gothic', 'AppleGothic', Calibri, sans-serif; background: #f0f2f5; color: #1a1d23; padding: 40px 24px; max-width: 720px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin-bottom: 8px; }
  p { color: #6b7280; font-size: 14px; margin-bottom: 28px; line-height: 1.5; }
  ul { list-style: none; padding: 0; }
  li { margin-bottom: 10px; }
  a {
    display: block;
    padding: 14px 18px;
    background: #fff;
    border-radius: 12px;
    text-decoration: none;
    color: #1a1d23;
    font-weight: 600;
    border: 1px solid rgba(0,0,0,.06);
    transition: box-shadow .2s, transform .15s;
  }
  a:hover { box-shadow: 0 8px 24px rgba(0,0,0,.08); transform: translateY(-1px); }
  a small { display: block; font-weight: 500; color: #6b7280; font-size: 12px; margin-top: 4px; }
</style>
</head>
<body>
  <h1>  gönderi taslakları</h1>
  <p>Her satır ayrı bir HTML sayfasına gider. Sayfada <strong>Görsele çevir ve PNG indir</strong> ile  ’e yüklenecek görseli oluşturabilirsiniz.</p>
  <ul>
${indexRows
  .map(
    (r) => `    <li><a href="${r.filename}">${escapeHtml(r.title)}<small>${escapeHtml(r.category)}</small></a></li>`
  )
  .join('\n')}
  </ul>
</body>
</html>
`;

fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml, 'utf8');

console.log('Oluşturuldu:', indexRows.length, 'HTML + index.html →', outDir);
