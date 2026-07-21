$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$outputDir = Join-Path $projectRoot "public\demo\narration"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$pythonCommand = Get-Command python -ErrorAction SilentlyContinue
$pythonPath = if ($pythonCommand -and $pythonCommand.Source -notlike "*WindowsApps*") {
  $pythonCommand.Source
} else {
  Get-ChildItem (Join-Path $env:LOCALAPPDATA "Python") -Filter python.exe -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notlike "*WindowsApps*" } |
    Select-Object -First 1 -ExpandProperty FullName
}

if (-not $pythonPath) {
  throw "Python was not found. Install Python, then run: python -m pip install edge-tts==7.2.8"
}

& $pythonPath -c "import edge_tts" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Output "Installing the neural narration dependency..."
  & $pythonPath -m pip install edge-tts==7.2.8
}

$segments = @(
  @{
    File = "title.mp3"
    Text = "Meet Catalyst A I: adaptive operations for ecommerce teams."
  },
  @{
    File = "overview.mp3"
    Text = "The command center ranks exceptions by impact. Every recommendation includes evidence, confidence, exposure, and a clear next action."
  },
  @{
    File = "connections.mp3"
    Text = "It reads Shopify order state, Slack warehouse context, and Gmail or E R P evidence from the tools merchants already use."
  },
  @{
    File = "agent.mp3"
    Text = "The fulfillment agent queries Shopify, reads warehouse messages, correlates both sources, and creates an evidence-backed case. No C S V upload is needed."
  },
  @{
    File = "case.mp3"
    Text = "Order five eight four one is still unfulfilled after eighteen hours. Slack shows its SKU in overflow. Catalyst A I drafts an escalation, then waits for approval."
  },
  @{
    File = "problem.mp3"
    Text = "Here is the new requirement: prevent priority orders from missing dispatch S L A by combining Shopify order state with Slack warehouse context. That sentence is the input."
  },
  @{
    File = "build.mp3"
    Text = "Four specialist agents map the requirement, identify entities, compose triggers and actions, then validate against twenty four historical tests."
  },
  @{
    File = "output.mp3"
    Text = "The output is a deployable application: three workflows, eleven governed actions, and all twenty four historical tests passing."
  },
  @{
    File = "maintain.mp3"
    Text = "The maintainer spots drift: operators escalate priority orders after twelve hours, while the deployed policy waits twenty four."
  },
  @{
    File = "change.mp3"
    Text = "It proposes a versioned diff, tests the impact, and keeps deployment behind explicit approval. One click safely deploys version one point seven."
  },
  @{
    File = "audit.mp3"
    Text = "Evidence reads, tool calls, decisions, approvals, and workflow versions stay in the audit log, making every run inspectable."
  },
  @{
    File = "outro.mp3"
    Text = "Codex implemented the product, connectors, tests, and demo. G P T five point six Terra helped reason through agent orchestration, workflow safety, and evidence-based decisions."
  }
)

$voice = "en-US-AndrewMultilingualNeural"
$rate = "+6%"
$pitch = "-2Hz"

foreach ($segment in $segments) {
  $path = Join-Path $outputDir $segment.File
  $ttsArgs = @(
    "-m", "edge_tts",
    "--voice", $voice,
    "--rate=$rate",
    "--pitch=$pitch",
    "--text", $segment.Text,
    "--write-media", $path
  )
  $generated = $false
  for ($attempt = 1; $attempt -le 4; $attempt++) {
    if (Test-Path $path) {
      Remove-Item -LiteralPath $path -Force
    }
    & $pythonPath @ttsArgs 2>$null
    if ($LASTEXITCODE -eq 0 -and (Test-Path $path) -and (Get-Item $path).Length -gt 1024) {
      $generated = $true
      break
    }
    Write-Warning "Attempt $attempt failed for $($segment.File); retrying..."
    Start-Sleep -Seconds (2 * $attempt)
  }
  if (-not $generated) {
    throw "Neural narration failed for $($segment.File) after four attempts"
  }
  Start-Sleep -Milliseconds 1500
}

Write-Output "Generated $($segments.Count) neural narration clips with $voice in $outputDir"
