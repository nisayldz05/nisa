Add-Type -AssemblyName System.Drawing
$src512 = "c:\Users\NİSA\Desktop\mia\ultra-fix-512.jpg"
$dest512 = "c:\Users\NİSA\Desktop\mia\icon-512.png"
$src192 = "c:\Users\NİSA\Desktop\mia\ultra-fix-192.jpg"
$dest192 = "c:\Users\NİSA\Desktop\mia\icon-192.png"

Write-Host "Converting 512 icon..."
$img512 = [System.Drawing.Image]::FromFile($src512)
$img512.Save($dest512, [System.Drawing.Imaging.ImageFormat]::Png)
$img512.Dispose()
Write-Host "Done 512."

Write-Host "Converting 192 icon..."
$img192 = [System.Drawing.Image]::FromFile($src192)
$img192.Save($dest192, [System.Drawing.Imaging.ImageFormat]::Png)
$img192.Dispose()
Write-Host "Done 192."
