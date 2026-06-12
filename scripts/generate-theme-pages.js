const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const siteUrl = 'https://stock-board-ten.vercel.app';
const today = '2026-06-12';
const themes = JSON.parse(fs.readFileSync(path.join(root, 'data', 'themes.json'), 'utf8'));

const staticPages = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/spacex-ipo-korea-stocks.html', changefreq: 'daily', priority: '0.9' },
  { path: '/samsung-electronics.html', changefreq: 'daily', priority: '0.8' },
  { path: '/sk-hynix.html', changefreq: 'daily', priority: '0.8' },
  { path: '/kospi-kosdaq.html', changefreq: 'daily', priority: '0.8' }
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function financeLinks(stock) {
  if (!/^\d{6}$/.test(stock.code)) return '';
  return `
          <a href="https://finance.naver.com/item/main.naver?code=${stock.code}" target="_blank" rel="noopener">네이버 증권</a>
          <a href="https://finance.daum.net/quotes/A${stock.code}" target="_blank" rel="noopener">다음 금융</a>`;
}

function newsLinks(theme) {
  return theme.searchQueries.map((query) => {
    const encoded = encodeURIComponent(query);
    return `
        <a href="https://search.naver.com/search.naver?where=news&query=${encoded}" target="_blank" rel="noopener">네이버 뉴스: ${escapeHtml(query)}</a>
        <a href="https://news.google.com/search?q=${encoded}" target="_blank" rel="noopener">구글 뉴스: ${escapeHtml(query)}</a>`;
  }).join('');
}

function relatedLinks(theme) {
  return theme.related.map((href) => {
    const title = href
      .replace('.html', '')
      .replace(/-/g, ' ')
      .replace('hbm stocks', 'HBM 관련주')
      .replace('defense stocks', '방산 관련주')
      .replace('shipbuilding stocks', '조선 관련주')
      .replace('nuclear stocks', '원전 관련주')
      .replace('robot stocks', '로봇 관련주')
      .replace('kospi kosdaq', '코스피·코스닥')
      .replace('sk hynix', 'SK하이닉스')
      .replace('samsung electronics', '삼성전자')
      .replace('spacex ipo korea stocks', 'SpaceX IPO 국내 관련주');
    return `<a href="/${href}">${escapeHtml(title)}</a>`;
  }).join('\n        ');
}

function renderTheme(theme) {
  const slug = escapeHtml(theme.slug);
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(theme.description)}">
  <meta name="google-site-verification" content="iJYo0s5IVucjVPlcUXP11HltZW35jnzpXC0C4rTFapw">
  <meta name="keywords" content="${escapeHtml(theme.keywords)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${siteUrl}/${slug}.html">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:title" content="${escapeHtml(theme.title)} | 국장 레이더">
  <meta property="og:description" content="${escapeHtml(theme.description)}">
  <meta property="og:url" content="${siteUrl}/${slug}.html">
  <title>${escapeHtml(theme.pageTitle)}</title>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-3EZW95TCSF"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-3EZW95TCSF');
  </script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4587553505034907" crossorigin="anonymous"></script>
  <style>
    *{box-sizing:border-box}body{margin:0;color:#172033;background:linear-gradient(145deg,#f8fafc,#eef2ff 52%,#ecfeff);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.75}main,header,footer{width:min(980px,calc(100% - 32px));margin:auto}header{padding:44px 0 20px}a{color:#2563eb;font-weight:800;text-decoration:none}h1{margin:0 0 10px;font-size:clamp(30px,6vw,48px);letter-spacing:-1.5px}.lead{color:#526071}.card{margin:18px 0;padding:24px;border:1px solid rgba(15,23,42,.1);border-radius:24px;background:rgba(255,255,255,.94);box-shadow:0 16px 44px rgba(15,23,42,.08)}.notice{border-color:#fde68a;color:#713f12;background:#fffbeb}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.stock{padding:18px;border:1px solid #dbe3ef;border-radius:18px;background:#fff}.stock h2{margin:0 0 8px;font-size:20px}.tag{display:inline-block;margin:0 5px 7px 0;padding:4px 8px;border-radius:999px;color:#1e3a8a;background:#dbeafe;font-size:12px;font-weight:900}.links{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}.tools a{display:inline-block;margin:3px 10px 3px 0}footer{padding:10px 0 42px;color:#64748b;text-align:center;font-size:13px}@media(max-width:760px){.grid{grid-template-columns:1fr}.card{padding:20px}}
  </style>
</head>
<body>
  <header>
    <p><a href="/">← 국장 레이더 홈</a></p>
    <h1>${escapeHtml(theme.title)}</h1>
    <p class="lead">${escapeHtml(theme.intro)}</p>
  </header>
  <main>
    <section class="card notice">
      <strong>투자 유의:</strong> 이 페이지는 투자자문이나 특정 종목 추천을 제공하지 않습니다. 모든 정보는 참고용이며, 투자 판단과 책임은 이용자 본인에게 있습니다.
    </section>

    <section class="card">
      <h2>바로 검색하기</h2>
      <p class="links">${newsLinks(theme)}
      </p>
    </section>

    <section class="grid" aria-label="${escapeHtml(theme.title)} 관심 종목">
${theme.stocks.map((stock) => `      <article class="stock">
        <h2>${escapeHtml(stock.name)} <small>${escapeHtml(stock.code)}</small></h2>
        ${stock.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        <p>${escapeHtml(stock.summary)}</p>
        <div class="links">${financeLinks(stock)}
        </div>
      </article>`).join('\n')}
    </section>

    <section class="card">
      <h2>체크리스트</h2>
      <ul>
${theme.checklist.map((item) => `        <li>${escapeHtml(item)}</li>`).join('\n')}
      </ul>
    </section>

    <section class="card">
      <h2>함께 볼 페이지</h2>
      <p class="tools">
        ${relatedLinks(theme)}
      </p>
    </section>
  </main>
  <footer>© 2026 국장 레이더 · <a href="/privacy.html">개인정보처리방침 · 투자정보 고지</a></footer>
</body>
</html>
`;
}

for (const theme of themes) {
  fs.writeFileSync(path.join(root, `${theme.slug}.html`), renderTheme(theme));
}

const sitemapPages = [
  ...staticPages,
  ...themes.map((theme) => ({ path: `/${theme.slug}.html`, changefreq: 'daily', priority: '0.8' })),
  { path: '/privacy.html', changefreq: 'yearly', priority: '0.3' }
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPages.map((page) => `  <url>
    <loc>${siteUrl}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);
console.log(`Generated ${themes.length} theme pages and sitemap.xml`);
