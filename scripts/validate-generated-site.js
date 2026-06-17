const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const siteUrl = 'https://stock-board-ten.vercel.app';
const manualThemes = readJson('data/themes.json');
const autoThemes = fs.existsSync(path.join(root, 'data', 'auto-themes.json'))
  ? readJson('data/auto-themes.json').promoted || []
  : [];
const newsCache = fs.existsSync(path.join(root, 'data', 'news-cache.json'))
  ? readJson('data/news-cache.json')
  : { themes: {} };
const themes = mergeThemes(manualThemes, autoThemes);
const blockedTerms = ['Fathom Journal', 'EBC Financial Group', '네이버 프리미엄콘텐츠', '몰빵'];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function mergeThemes(primary, secondary) {
  const seen = new Set();
  return [...primary, ...secondary].filter((theme) => {
    if (!theme.slug || seen.has(theme.slug)) return false;
    seen.add(theme.slug);
    return true;
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function validateThemeShape(theme) {
  assert(/^[a-z0-9-]+$/.test(theme.slug), `Invalid slug: ${theme.slug}`);
  for (const field of ['title', 'pageTitle', 'description', 'keywords', 'intro']) {
    assert(typeof theme[field] === 'string' && theme[field].trim(), `Missing ${field}: ${theme.slug}`);
  }
  assert(Array.isArray(theme.searchQueries) && theme.searchQueries.length >= 1, `Missing queries: ${theme.slug}`);
  assert(Array.isArray(theme.stocks) && theme.stocks.length >= 1, `Missing stocks: ${theme.slug}`);
  assert(Array.isArray(theme.checklist) && theme.checklist.length >= 3, `Missing checklist: ${theme.slug}`);
}

function validateThemePage(theme, sitemap) {
  const file = `${theme.slug}.html`;
  const html = read(file);
  const canonical = `${siteUrl}/${file}`;
  assert(html.includes(`<link rel="canonical" href="${canonical}">`), `Missing canonical: ${file}`);
  assert(html.includes(theme.title), `Missing title text: ${file}`);
  assert(html.includes('투자 유의'), `Missing disclaimer: ${file}`);
  assert(html.includes('G-3EZW95TCSF'), `Missing GA: ${file}`);
  assert(sitemap.includes(`<loc>${canonical}</loc>`), `Missing sitemap loc: ${file}`);

  const cacheItems = newsCache.themes?.[theme.slug]?.items || [];
  if (cacheItems.length) {
    assert(html.includes('자동 수집 최신 뉴스'), `Missing latest news section: ${file}`);
  }
}

function validateUsRadarPage(sitemap) {
  const file = 'us.html';
  const html = read(file);
  const canonical = `${siteUrl}/${file}`;
  const requiredTexts = [
    '미장 흐름',
    'NVIDIA',
    'Tesla',
    'Apple',
    'Microsoft',
    'AMD',
    'SpaceX',
    'SPCX',
    '금리·달러와 미장 연결',
    'NVIDIA·Tesla·Apple·Microsoft·AMD를 같이 보는 법',
    'global-money-map.vercel.app/rates.html',
    'global-money-map.vercel.app/dollar-index.html',
    'global-money-map.vercel.app/usd-krw.html',
  ];

  assert(html.includes(`<link rel="canonical" href="${canonical}">`), `Missing canonical: ${file}`);
  assert(html.includes('G-3EZW95TCSF'), `Missing GA: ${file}`);
  assert(sitemap.includes(`<loc>${canonical}</loc>`), `Missing sitemap loc: ${file}`);

  for (const text of requiredTexts) {
    assert(html.includes(text), `Missing US radar content: ${text}`);
  }
}

function validateBrandAndSearchPages(sitemap) {
  const index = read('index.html');
  assert(index.includes('마켓콕'), 'Missing new brand name on home');
  assert(index.includes('/us-ai-bigtech-stocks.html'), 'Missing US AI big tech page link on home');
  assert(index.includes('/korea-us-semiconductor-flow.html'), 'Missing Korea-US semiconductor page link on home');

  const pages = [
    {
      file: 'us-ai-bigtech-stocks.html',
      requiredTexts: ['미장 AI 빅테크 체크', 'NVIDIA', 'Tesla', 'Apple', 'Microsoft', 'AMD', 'SpaceX', '금리', '달러'],
    },
    {
      file: 'korea-us-semiconductor-flow.html',
      requiredTexts: ['국장·미장 반도체 연결 체크', 'NVIDIA', 'AMD', '삼성전자', 'SK하이닉스', 'HBM', '원달러 환율'],
    },
  ];

  for (const page of pages) {
    const html = read(page.file);
    const canonical = `${siteUrl}/${page.file}`;
    assert(html.includes(`<link rel="canonical" href="${canonical}">`), `Missing canonical: ${page.file}`);
    assert(html.includes('G-3EZW95TCSF'), `Missing GA: ${page.file}`);
    assert(html.includes('ca-pub-4587553505034907'), `Missing AdSense: ${page.file}`);
    assert(sitemap.includes(`<loc>${canonical}</loc>`), `Missing sitemap loc: ${page.file}`);
    for (const text of page.requiredTexts) {
      assert(html.includes(text), `Missing search page content in ${page.file}: ${text}`);
    }
  }
}

function main() {
  const sitemap = read('sitemap.xml');
  const index = read('index.html');
  const themeIndex = read('themes.html');
  const serializedCache = JSON.stringify(newsCache);

  assert(sitemap.includes(`<loc>${siteUrl}/</loc>`), 'Missing home in sitemap');
  assert(sitemap.includes(`<loc>${siteUrl}/themes.html</loc>`), 'Missing themes.html in sitemap');
  assert(index.includes('/themes.html'), 'Missing themes.html link on home');
  assert(themeIndex.includes('국장 테마 전체보기'), 'Invalid themes.html');
  validateUsRadarPage(sitemap);
  validateBrandAndSearchPages(sitemap);

  for (const term of blockedTerms) {
    assert(!serializedCache.includes(term), `Blocked term/source in news cache: ${term}`);
  }

  for (const theme of themes) {
    validateThemeShape(theme);
    validateThemePage(theme, sitemap);
    assert(themeIndex.includes(`/${theme.slug}.html`), `Missing theme index link: ${theme.slug}`);
  }

  console.log(`Validated ${themes.length} generated themes`);
}

main();
