# Stock Theme Automation

국장 레이더는 GitHub Actions로 테마 페이지의 최신 뉴스 섹션을 자동 갱신합니다.

## What Runs

`.github/workflows/auto-refresh.yml` runs twice a day and can also be run manually.

1. `node scripts/refresh-news-cache.js`
   - Reads `data/themes.json` and promoted items from `data/auto-themes.json`.
   - Fetches Google News RSS results for each theme query.
   - Writes `data/news-cache.json`.

2. `node scripts/discover-auto-themes.js`
   - Reads allowlisted candidates from `data/auto-theme-rules.json`.
   - Scores candidates against Google News RSS.
   - Writes promoted candidates to `data/auto-themes.json`.

3. `node scripts/generate-theme-pages.js`
   - Rebuilds generated theme HTML pages.
   - Rebuilds `themes.html`.
   - Updates `sitemap.xml`.

4. `node scripts/validate-generated-site.js`
   - Blocks missing pages, broken sitemap links, missing disclaimers, and filtered news terms.

5. If files changed, GitHub Actions commits and pushes the update.
   - Vercel deploys the pushed commit automatically.

## Add A New Theme

Add one item to `data/themes.json`, then run:

```bash
node scripts/refresh-news-cache.js
node scripts/generate-theme-pages.js
node scripts/validate-generated-site.js
```

Commit the generated files.

## Safety Notes

- The site does not make buy/sell recommendations.
- Automated news is shown as external search results, not as verified analysis.
- Newly discovered themes come only from `data/auto-theme-rules.json`, not arbitrary generated text.
- New themes should still use conservative wording and include the investment disclaimer.
