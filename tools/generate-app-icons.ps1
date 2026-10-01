param(
  [string]$Source = "src/assets/app-icon-master-v2.png",
  [string]$OutputDirectory = "public"
)

Add-Type -AssemblyName System.Drawing

$sourcePath = (Resolve-Path -LiteralPath $Source).Path
$outputPath = (Resolve-Path -LiteralPath $OutputDirectory).Path
$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)

function New-AppIcon {
  param(
    [int]$Size,
    [string]$FileName,
    [bool]$Rounded
  )

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bitmap.SetResolution(96, 96)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $clipPath = $null
  if ($Rounded) {
    $radius = [single]($Size * 0.22)
    $diameter = $radius * 2
    $clipPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $clipPath.AddArc(0, 0, $diameter, $diameter, 180, 90)
    $clipPath.AddArc($Size - $diameter, 0, $diameter, $diameter, 270, 90)
    $clipPath.AddArc($Size - $diameter, $Size - $diameter, $diameter, $diameter, 0, 90)
    $clipPath.AddArc(0, $Size - $diameter, $diameter, $diameter, 90, 90)
    $clipPath.CloseFigure()
    $graphics.SetClip($clipPath)
  }

  $backgroundBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#F0F7FF"))
  $graphics.FillRectangle($backgroundBrush, 0, 0, $Size, $Size)

  # Keep the artwork comfortably inside Android's maskable safe zone.
  $artSize = [int]($Size * 0.78)
  $artOffset = [int](($Size - $artSize) / 2)
  $graphics.DrawImage($sourceImage, $artOffset, $artOffset, $artSize, $artSize)

  $destination = Join-Path $outputPath $FileName
  $bitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)

  $backgroundBrush.Dispose()
  if ($null -ne $clipPath) { $clipPath.Dispose() }
  $graphics.Dispose()
  $bitmap.Dispose()
}

New-AppIcon -Size 192 -FileName "app-icon-v2-192.png" -Rounded $true
New-AppIcon -Size 512 -FileName "app-icon-v2-512.png" -Rounded $true
New-AppIcon -Size 192 -FileName "app-icon-maskable-v2-192.png" -Rounded $false
New-AppIcon -Size 512 -FileName "app-icon-maskable-v2-512.png" -Rounded $false
New-AppIcon -Size 180 -FileName "apple-touch-icon-v2.png" -Rounded $true
New-AppIcon -Size 64 -FileName "favicon-v2.png" -Rounded $true

$sourceImage.Dispose()
