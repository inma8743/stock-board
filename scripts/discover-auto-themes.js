const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const rules = JSON.parse(fs.readFileSync(path.join(root, 'data', 'auto-theme-rules.json'), 'utf8'));
const manualThemes = JSON.parse(fs.readFileSync(path.join(root, 'data', 'themes.json'), 'utf8'));
const outputPath = path.join(root, 'data', 'auto-themes.json');

const seedQueries = [
  '오늘 국내증시 관련주',
  '코스피 코스닥 테마 관련주',
  '국내 주식 급등 테마',
  '증시 수혜주 관련주'
];

function decodeXml(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function textFromTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]).replace(/<[^>]*>/g, '').trim() : '';
}

function linkFromItem(block) {
  const direct = textFromTag(block, 'link');
  if (direct) return direct;
  const href = block.match(/<link[^>]+href="([^"]+)"/i);
  return href ? decodeXml(href[1]) : '';
}

async function fetchNews(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 compatible; StockBoardBot/1.0; +https://stock-board-ten.vercel.app/'
    }
  });
  if (!response.ok) {
    console.warn(`Skipping query "${query}": ${response.status}`);
    return [];
  }

  const xml = await response.text();
  return (xml.match(/<item>[\s\S]*?<\/item>/gi) || []).slice(0, 10).map((block) => ({
    title: textFromTag(block, 'title').replace(/\s+-\s+Google 뉴스$/, '').trim(),
    link: linkFromItem(block),
    publishedAt: textFromTag(block, 'pubDate'),
    query
  })).filter((item) => item.title && item.link);
}

function uniqueBy(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

async function main() {
  const manualSlugs = new Set(manualThemes.map((theme) => theme.slug));
  const allNews = uniqueBy((await Promise.all(seedQueries.map(fetchNews))).flat(), 'link');
  const promoted = [];
  const candidates = [];

  for (const rule of rules) {
    if (manualSlugs.has(rule.slug)) continue;

    const ruleNews = uniqueBy((await Promise.all(rule.searchQueries.slice(0, 2).map(fetchNews))).flat(), 'link');
    const combined = uniqueBy([...allNews, ...ruleNews], 'link');
    let score = 0;
    const evidence = [];

    for (const item of combined) {
      const haystack = item.title.toLowerCase();
      const matchedSignals = rule.signals.filter((signal) => haystack.includes(signal.toLowerCase()));
      if (!matchedSignals.length) continue;

      score += matchedSignals.length;
      evidence.push({
        title: item.title,
        link: item.link,
        query: item.query,
        matchedSignals: matchedSignals.slice(0, 3)
      });
    }

    const candidate = {
      ...rule,
      score,
      autoDiscovered: true,
      evidence: uniqueBy(evidence, 'link').slice(0, 5)
    };
    candidates.push(candidate);

    if (score >= 2 && candidate.evidence.length >= 1) {
      promoted.push(candidate);
    }
  }

  const selected = promoted
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug))
    .slice(0, 4);

  const output = {
    discoveredAt: new Date().toISOString(),
    source: 'Google News RSS + allowlisted theme rules',
    minimumScore: 2,
    maxPromotedThemes: 4,
    promoted: selected.map(({ signals, ...theme }) => theme),
    candidates: candidates
      .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug))
      .map(({ signals, stocks, checklist, related, searchQueries, keywords, description, intro, pageTitle, title, slug, ...rest }) => ({
        slug,
        title,
        score: rest.score,
        evidence: rest.evidence
      }))
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Promoted ${output.promoted.length} auto themes`);
  for (const theme of output.promoted) {
    console.log(`- ${theme.slug}: ${theme.title} (score ${theme.score})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
