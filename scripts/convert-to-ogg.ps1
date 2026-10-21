# Converts all .mp3 and .wav files in public/assets/audio/ to high-quality .ogg (Vorbis)
# OGG is the recommended audio container for HTML5/WebGL games because it supports gapless looping.

param(
    [string]$TargetDir = "$PSScriptRoot\..\public\assets\audio",
    [bool]$DeleteOriginals = $true
)

$targetPath = Resolve-Path $TargetDir -ErrorAction SilentlyContinue
if (-not $targetPath) {
    Write-Host "Target directory not found: $TargetDir" -ForegroundColor Red
    exit 1
}

$files = Get-ChildItem -Path $targetPath -Include *.mp3, *.wav, *.flac, *.m4a, *.aac, *.aiff -Recurse -File

if ($files.Count -eq 0) {
    Write-Host "No non-OGG audio files found in $TargetDir." -ForegroundColor Yellow
    Write-Host "Drop your audio files into public/assets/audio/ and run this script again." -ForegroundColor Cyan
    exit 0
}

Write-Host "Found $($files.Count) audio file(s) to convert to .ogg..." -ForegroundColor Green

foreach ($file in $files) {
    $oggPath = [System.IO.Path]::ChangeExtension($file.FullName, ".ogg")
    Write-Host "Converting: $($file.Name) -> $([System.IO.Path]::GetFileName($oggPath))" -ForegroundColor Cyan
    
    # Use ffmpeg with libvorbis at quality level 4 (~128-160kbps VBR, optimal for web games)
    ffmpeg -y -i "$($file.FullName)" -c:a libvorbis -q:a 4 "$oggPath" -loglevel error
    
    if (Test-Path $oggPath) {
        Write-Host "  Success: $([System.IO.Path]::GetFileName($oggPath))" -ForegroundColor Green
        if ($DeleteOriginals) {
            Remove-Item $file.FullName
            Write-Host "  Removed source: $($file.Name)" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "  Failed to convert: $($file.Name)" -ForegroundColor Red
    }
}

Write-Host "Audio conversion to .ogg complete!" -ForegroundColor Green
