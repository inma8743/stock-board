# Stock Theme Automation

국장 레이더는 GitHub Actions로 테마 페이지의 최신 뉴스 섹션을 자동 갱신합니다.

## What Runs

`.github/workflows/auto-refresh.yml` runs twice a day and can also be run manually.

1. `node scripts/refresh-news-cache.js`
   - Reads `data/themes.json`.
   - Fetches Google News RSS results for each theme query.
   - Writes `data/news-cache.json`.

2. `node scripts/generate-theme-pages.js`
   - Rebuilds generated theme HTML pages.
   - Updates `sitemap.xml`.

3. If files changed, GitHub Actions commits and pushes the update.
   - Vercel deploys the pushed commit automatically.

## Add A New Theme

Add one item to `data/themes.json`, then run:

```bash
node scripts/refresh-news-cache.js
node scripts/generate-theme-pages.js
```

Commit the generated files.

## Safety Notes

- The site does not make buy/sell recommendations.
- Automated news is shown as external search results, not as verified analysis.
- New themes should still use conservative wording and include the investment disclaimer.
