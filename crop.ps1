Add-Type -AssemblyName System.Drawing
$path = "d:\Projects2026\SunSar-Bingo\public\logo.png"
$bmp = [System.Drawing.Bitmap]::FromFile($path)
$w = $bmp.Width
$h = $bmp.Height

$minX = $w
$maxX = 0
$minY = $h
$maxY = 0

$found = $false

# Brute force scan
for ($y=0; $y -lt $h; $y++) {
    for ($x=0; $x -lt $w; $x++) {
        $p = $bmp.GetPixel($x, $y)
        # Check brightness (sum > 80 is conservative for dark bg)
        if (($p.R + $p.G + $p.B) -gt 80) { 
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
            $found = $true
        }
    }
}

if ($found) {
    $width = $maxX - $minX + 1
    $height = $maxY - $minY + 1
    # Add small padding
    $pad = 10
    $minX = [Math]::Max(0, $minX - $pad)
    $minY = [Math]::Max(0, $minY - $pad)
    $width = [Math]::Min($w - $minX, $width + ($pad*2))
    $height = [Math]::Min($h - $minY, $height + ($pad*2))

    $rect = New-Object System.Drawing.Rectangle $minX, $minY, $width, $height
    $cropped = $bmp.Clone($rect, $bmp.PixelFormat)
    $bmp.Dispose()
    
    $cropped.Save($path)
    $cropped.Dispose()
    Write-Host "Cropped to ${width}x${height}"
} else {
    $bmp.Dispose()
    Write-Host "No non-black pixels found."
}
