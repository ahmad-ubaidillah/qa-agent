<#
.SYNOPSIS
    Update QA Agent (force reinstall from this repo).
.EXAMPLE
    .\update.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$VersionFile = Join-Path $Here "VERSION"
$Ver = if (Test-Path $VersionFile) { (Get-Content $VersionFile -Raw).Trim() } else { "unknown" }

Write-Host "QA Agent update → v$Ver" -ForegroundColor Cyan
& (Join-Path $Here "install.ps1") -Force
Write-Host ""
Write-Host "Update complete. Run: node scripts\doctor.js" -ForegroundColor Green
Write-Host "See CHANGELOG.md for what changed." -ForegroundColor Cyan
