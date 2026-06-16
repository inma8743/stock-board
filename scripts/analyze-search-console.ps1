param(
  [Parameter(Mandatory = $true)]
  [string]$Path,

  [int]$Top = 30
)

if (-not (Test-Path -LiteralPath $Path)) {
  Write-Error "CSV file not found: $Path"
  exit 1
}

function Get-FieldValue($row, [string[]]$names) {
  foreach ($name in $names) {
    if ($row.PSObject.Properties.Name -contains $name) {
      return $row.$name
    }
  }
  return $null
}

function Get-FieldByIndex($row, [int]$index) {
  $properties = @($row.PSObject.Properties)
  if ($properties.Count -gt $index) {
    return $properties[$index].Value
  }
  return $null
}

function To-Number($value) {
  if ($null -eq $value) { return 0 }
  $text = "$value".Trim().Replace(",", "").Replace("%", "")
  $number = 0.0
  if ([double]::TryParse($text, [Globalization.NumberStyles]::Float, [Globalization.CultureInfo]::InvariantCulture, [ref]$number)) {
    return $number
  }
  if ([double]::TryParse($text, [ref]$number)) {
    return $number
  }
  return 0
}

$rows = Import-Csv -LiteralPath $Path
$items = foreach ($row in $rows) {
  $term = Get-FieldValue $row @("Query", "query", "Top queries", "Search query", "Page", "page", "Pages")
  $clicksRaw = Get-FieldValue $row @("Clicks", "clicks")
  $impressionsRaw = Get-FieldValue $row @("Impressions", "impressions")
  $ctrRaw = Get-FieldValue $row @("CTR", "ctr")
  $positionRaw = Get-FieldValue $row @("Position", "position", "Average position", "Avg. position")

  if (-not $term) { $term = Get-FieldByIndex $row 0 }
  if ($null -eq $clicksRaw) { $clicksRaw = Get-FieldByIndex $row 1 }
  if ($null -eq $impressionsRaw) { $impressionsRaw = Get-FieldByIndex $row 2 }
  if ($null -eq $ctrRaw) { $ctrRaw = Get-FieldByIndex $row 3 }
  if ($null -eq $positionRaw) { $positionRaw = Get-FieldByIndex $row 4 }

  $clicks = To-Number $clicksRaw
  $impressions = To-Number $impressionsRaw
  $ctr = To-Number $ctrRaw
  $position = To-Number $positionRaw

  if (-not $term -or $impressions -le 0) { continue }

  $ctrPercent = if ($ctr -le 1) { $ctr * 100 } else { $ctr }
  $score = 0
  $action = "Monitor"

  if ($impressions -ge 100 -and $ctrPercent -lt 2.5) {
    $score += $impressions * (2.5 - $ctrPercent)
    $action = "Rewrite title/meta for CTR"
  }

  if ($position -ge 8 -and $position -le 20) {
    $score += $impressions * 2
    $action = "Add content, FAQ, and internal links"
  }

  if ($impressions -ge 50 -and $clicks -eq 0) {
    $score += $impressions
    $action = "Clarify search intent and snippet"
  }

  [pscustomobject]@{
    Target = $term
    Clicks = [int]$clicks
    Impressions = [int]$impressions
    CTR = "{0:N2}%" -f $ctrPercent
    Position = "{0:N1}" -f $position
    Action = $action
    PriorityScore = [math]::Round($score, 2)
  }
}

$ranked = $items | Sort-Object PriorityScore -Descending | Select-Object -First $Top
if (-not $ranked) {
  Write-Output "No actionable rows found. Check that the CSV includes target, clicks, impressions, CTR, and position columns."
  exit 0
}

$ranked | Format-Table -AutoSize
