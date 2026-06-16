$sitemap = Get-Content -Raw -LiteralPath "sitemap.xml"
$matches = [regex]::Matches($sitemap, "<loc>(.*?)</loc>")
$missing = @()

foreach ($match in $matches) {
  $url = $match.Groups[1].Value
  $path = ([uri]$url).AbsolutePath
  if ($path -eq "/") {
    $relativePath = "index.html"
  } else {
    $relativePath = $path.TrimStart("/")
  }

  if (-not (Test-Path -LiteralPath $relativePath)) {
    $missing += "$url -> $relativePath"
  }
}

if ($missing.Count -gt 0) {
  Write-Error "Missing files referenced by sitemap:`n$($missing -join "`n")"
  exit 1
}

Write-Output "Sitemap OK: $($matches.Count) URLs"
