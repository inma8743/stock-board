const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const siteUrl = 'https://stock-board-ten.vercel.app';
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());
const manualThemes = JSON.parse(fs.readFileSync(path.join(root, 'data', 'themes.json'), 'utf8'));
const autoThemesPath = path.join(root, 'data', 'auto-themes.json');
const autoThemes = fs.existsSync(autoThemesPath)
  ? JSON.parse(fs.readFileSync(autoThemesPath, 'utf8')).promoted || []
  : [];
const themes = mergeThemes(manualThemes, autoThemes);
const autoThemeRulesPath = path.join(root, 'data', 'auto-theme-rules.json');
const autoThemeRules = fs.existsSync(autoThemeRulesPath)
  ? JSON.parse(fs.readFileSync(autoThemeRulesPath, 'utf8'))
  : [];
const newsCachePath = path.join(root, 'data', 'news-cache.json');
const newsCache = fs.existsSync(newsCachePath)
  ? JSON.parse(fs.readFileSync(newsCachePath, 'utf8'))
  : { themes: {} };

const staticPages = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/en.html', changefreq: 'daily', priority: '0.9' },
  { path: '/about.html', changefreq: 'monthly', priority: '0.5' },
  { path: '/en/about.html', changefreq: 'monthly', priority: '0.5' },
  { path: '/methodology.html', changefreq: 'monthly', priority: '0.5' },
  { path: '/en/methodology.html', changefreq: 'monthly', priority: '0.5' },
  { path: '/en/spacex-ipo-korea-stocks.html', changefreq: 'daily', priority: '0.9' },
  { path: '/en/spacex-stock-spcx.html', changefreq: 'daily', priority: '0.9' },
  { path: '/en/how-to-follow-korean-stocks.html', changefreq: 'weekly', priority: '0.88' },
  { path: '/en/korean-stock-market-hours.html', changefreq: 'weekly', priority: '0.87' },
  { path: '/en/korean-stock-market-holidays.html', changefreq: 'weekly', priority: '0.87' },
  { path: '/en/korean-stock-market-glossary.html', changefreq: 'weekly', priority: '0.86' },
  { path: '/en/korean-ai-semiconductor-stocks.html', changefreq: 'daily', priority: '0.85' },
  { path: '/en/samsung-electronics.html', changefreq: 'daily', priority: '0.85' },
  { path: '/en/sk-hynix-hbm.html', changefreq: 'daily', priority: '0.85' },
  { path: '/en/kospi-kosdaq.html', changefreq: 'daily', priority: '0.85' },
  { path: '/themes.html', changefreq: 'daily', priority: '0.9' },
  { path: '/spacex-ipo-korea-stocks.html', changefreq: 'daily', priority: '0.9' },
  { path: '/spacex-stock-spcx.html', changefreq: 'daily', priority: '0.9' },
  { path: '/samsung-electronics.html', changefreq: 'daily', priority: '0.8' },
  { path: '/sk-hynix.html', changefreq: 'daily', priority: '0.8' },
  { path: '/kospi-kosdaq.html', changefreq: 'daily', priority: '0.8' }
];

function mergeThemes(primary, secondary) {
  const seen = new Set();
  return [...primary, ...secondary].filter((theme) => {
    if (!theme.slug || seen.has(theme.slug)) return false;
    seen.add(theme.slug);
    return true;
  });
}

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

function renderLatestNews(theme) {
  const items = newsCache.themes?.[theme.slug]?.items || [];
  if (!items.length) return '';

  return `
    <section class="card">
      <h2>자동 수집 최신 뉴스</h2>
      <p>아래 뉴스는 Google News 검색 결과를 기준으로 자동 갱신됩니다. 기사 내용과 투자 판단은 반드시 원문에서 직접 확인하세요.</p>
      <ul>
${items.slice(0, 5).map((item) => `        <li><a href="${escapeHtml(item.link)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a>${item.source ? ` <small>(${escapeHtml(item.source)})</small>` : ''}</li>`).join('\n')}
      </ul>
    </section>
`;
}

function renderCoupangAd() {
  return `    <div class="ad">
      <script src="https://ads-partners.coupang.com/g.js"></script>
      <script>
        new PartnersCoupang.G({"id":991032,"template":"carousel","trackingCode":"AF5435387","width":"680","height":"140","tsource":""});
      </script>
      <p class="ad-note">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.</p>
    </div>`;
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
    *{box-sizing:border-box}body{margin:0;color:#172033;background:linear-gradient(145deg,#f8fafc,#eef2ff 52%,#ecfeff);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.75}main,header,footer{width:min(980px,calc(100% - 32px));margin:auto}header{padding:44px 0 20px}a{color:#2563eb;font-weight:800;text-decoration:none}h1{margin:0 0 10px;font-size:clamp(30px,6vw,48px);letter-spacing:-1.5px}.lead{color:#526071}.card{margin:18px 0;padding:24px;border:1px solid rgba(15,23,42,.1);border-radius:24px;background:rgba(255,255,255,.94);box-shadow:0 16px 44px rgba(15,23,42,.08)}.notice{border-color:#fde68a;color:#713f12;background:#fffbeb}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.stock{padding:18px;border:1px solid #dbe3ef;border-radius:18px;background:#fff}.stock h2{margin:0 0 8px;font-size:20px}.tag{display:inline-block;margin:0 5px 7px 0;padding:4px 8px;border-radius:999px;color:#1e3a8a;background:#dbeafe;font-size:12px;font-weight:900}.links{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}.ad{min-height:140px;margin:20px auto;padding:18px;border:1px dashed #cbd5e1;border-radius:18px;color:#64748b;background:rgba(255,255,255,.64);display:flex;flex-direction:column;gap:8px;align-items:center;justify-content:center;overflow:hidden;text-align:center}.ad-note{margin:0;color:#64748b;font-size:12px}.tools a{display:inline-block;margin:3px 10px 3px 0}footer{padding:10px 0 42px;color:#64748b;text-align:center;font-size:13px}@media(max-width:760px){.grid{grid-template-columns:1fr}.card{padding:20px}.ad iframe,.ad ins{max-width:100%!important}}
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
${renderCoupangAd()}
${renderLatestNews(theme)}

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
  <footer>© 2026 국장 레이더 · <a href="/about.html">소개·편집 원칙</a> · <a href="/methodology.html">데이터 기준</a> · <a href="/privacy.html">개인정보처리방침 · 투자정보 고지</a></footer>
</body>
</html>
`;
}

for (const theme of themes) {
  fs.writeFileSync(path.join(root, `${theme.slug}.html`), renderTheme(theme));
}

fs.writeFileSync(path.join(root, 'themes.html'), renderThemeIndex(themes, autoThemes));
removeInactiveAutoThemePages(themes, autoThemeRules);
updateIndexAutoThemeLinks(autoThemes);

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

function renderThemeIndex(allThemes, promotedThemes) {
  const promotedSlugs = new Set(promotedThemes.map((theme) => theme.slug));
  const cards = allThemes.map((theme) => {
    const isAuto = promotedSlugs.has(theme.slug);
    return `      <article class="theme-card">
        <p class="eyebrow">${isAuto ? '자동 감지 테마' : '상시 추적 테마'}</p>
        <h2><a href="/${escapeHtml(theme.slug)}.html">${escapeHtml(theme.title)}</a></h2>
        <p>${escapeHtml(theme.description)}</p>
        <div class="tags">${theme.stocks.slice(0, 4).map((stock) => `<span>${escapeHtml(stock.name)}</span>`).join('')}</div>
      </article>`;
  }).join('\n');

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="국장 레이더가 추적하는 국내 주식 테마 페이지 전체 목록입니다. HBM, 방산, 조선, 원전, 로봇, 금융주, 화장품, 2차전지, 바이오 관련주를 한곳에서 확인하세요.">
  <meta name="google-site-verification" content="iJYo0s5IVucjVPlcUXP11HltZW35jnzpXC0C4rTFapw">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${siteUrl}/themes.html">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:title" content="국장 테마 전체보기 | 국장 레이더">
  <meta property="og:description" content="국내 주식 테마 페이지 전체 목록과 자동 감지 테마를 확인하세요.">
  <meta property="og:url" content="${siteUrl}/themes.html">
  <title>국장 테마 전체보기 | 국내 주식 테마 뉴스 레이더</title>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-3EZW95TCSF"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-3EZW95TCSF');
  </script>
  <style>
    *{box-sizing:border-box}body{margin:0;color:#172033;background:linear-gradient(145deg,#f8fafc,#eef2ff 52%,#ecfeff);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.7}main,header,footer{width:min(1100px,calc(100% - 32px));margin:auto}header{padding:44px 0 22px;text-align:center}a{color:#2563eb;text-decoration:none;font-weight:900}h1{margin:0 0 10px;font-size:clamp(30px,6vw,50px);letter-spacing:-1.5px}.lead{color:#526071}.notice{margin:18px 0;padding:16px;border:1px solid #fde68a;border-radius:18px;color:#713f12;background:#fffbeb;text-align:left}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.theme-card{padding:22px;border:1px solid rgba(15,23,42,.1);border-radius:24px;background:rgba(255,255,255,.94);box-shadow:0 16px 44px rgba(15,23,42,.08)}.theme-card h2{margin:4px 0 10px;font-size:22px}.theme-card p{color:#526071}.eyebrow{margin:0;color:#1d4ed8!important;font-size:12px;font-weight:900}.tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.tags span{padding:5px 9px;border-radius:999px;color:#1e3a8a;background:#dbeafe;font-size:12px;font-weight:900}footer{padding:16px 0 42px;color:#64748b;text-align:center;font-size:13px}@media(max-width:860px){.grid{grid-template-columns:1fr}.theme-card{padding:20px}}
  </style>
</head>
<body>
  <header>
    <p><a href="/">← 국장 레이더 홈</a></p>
    <h1>국장 테마 전체보기</h1>
    <p class="lead">상시 추적 테마와 뉴스 신호로 자동 감지된 테마를 한곳에서 봅니다.</p>
    <div class="notice">이 사이트는 투자자문이나 특정 투자 행동 유도를 제공하지 않습니다. 테마 페이지는 뉴스 탐색과 리스크 체크용입니다.</div>
  </header>
  <main class="grid" aria-label="국내 주식 테마 목록">
${cards}
  </main>
  <footer>© 2026 국장 레이더 · <a href="/about.html">소개·편집 원칙</a> · <a href="/methodology.html">데이터 기준</a> · <a href="/privacy.html">개인정보처리방침 · 투자정보 고지</a></footer>
</body>
</html>
`;
}

function updateIndexAutoThemeLinks(promotedThemes) {
  const indexPath = path.join(root, 'index.html');
  if (!fs.existsSync(indexPath)) return;

  const start = '<!-- AUTO_THEME_LINKS_START -->';
  const end = '<!-- AUTO_THEME_LINKS_END -->';
  const index = fs.readFileSync(indexPath, 'utf8');
  if (!index.includes(start) || !index.includes(end)) return;

  const links = promotedThemes.length
    ? promotedThemes
        .map((theme) => `        <a href="/${escapeHtml(theme.slug)}.html">${escapeHtml(theme.title.replace(' 체크', ''))}</a>`)
        .join('\n')
    : '        <span>자동 감지된 신규 테마를 기다리는 중입니다.</span>';

  const next = index.replace(
    new RegExp(`${start}[\\s\\S]*?${end}`),
    `${start}\n${links}\n        ${end}`
  );
  fs.writeFileSync(indexPath, next);
}

function removeInactiveAutoThemePages(activeThemes, rules) {
  const activeSlugs = new Set(activeThemes.map((theme) => theme.slug));
  for (const rule of rules) {
    if (activeSlugs.has(rule.slug)) continue;
    const file = path.join(root, `${rule.slug}.html`);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}
