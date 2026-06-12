const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const themes = JSON.parse(fs.readFileSync(path.join(root, 'data', 'themes.json'), 'utf8'));
const outputPath = path.join(root, 'data', 'news-cache.json');

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

function sourceFromTitle(title) {
  const parts = title.split(' - ');
  return parts.length > 1 ? parts[parts.length - 1].trim() : '';
}

async function fetchThemeNews(theme) {
  const seen = new Set();
  const items = [];

  for (const query of theme.searchQueries.slice(0, 3)) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 compatible; StockBoardBot/1.0; +https://stock-board-ten.vercel.app/'
      }
    });

    if (!response.ok) {
      console.warn(`Skipping ${theme.slug} query "${query}": ${response.status}`);
      continue;
    }

    const xml = await response.text();
    const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

    for (const block of blocks.slice(0, 8)) {
      const rawTitle = textFromTag(block, 'title');
      const link = linkFromItem(block);
      const publishedAt = textFromTag(block, 'pubDate');
      if (!rawTitle || !link || seen.has(link)) continue;

      seen.add(link);
      items.push({
        title: rawTitle.replace(/\s+-\s+Google 뉴스$/, '').trim(),
        link,
        source: sourceFromTitle(rawTitle),
        publishedAt,
        query
      });
    }
  }

  return items.slice(0, 5);
}

async function main() {
  const result = {
    fetchedAt: new Date().toISOString(),
    source: 'Google News RSS',
    themes: {}
  };

  for (const theme of themes) {
    result.themes[theme.slug] = {
      title: theme.title,
      items: await fetchThemeNews(theme)
    };
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Updated ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
