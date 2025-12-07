# Update Android App Icons Script
# Run this from the momento root directory

$logoPath = "assets\logos"
$androidResPath = "android\app\src\main\res"

Write-Host "Updating Android app icons..." -ForegroundColor Cyan

# Copy logos to appropriate mipmap folders
# Using the closest size available

# mdpi (48x48) - use 64x64
Copy-Item "$logoPath\64x64.png" "$androidResPath\mipmap-mdpi\ic_launcher.png" -Force
Copy-Item "$logoPath\64x64.png" "$androidResPath\mipmap-mdpi\ic_launcher_round.png" -Force

# hdpi (72x72) - use 64x64 (will be slightly scaled up)
Copy-Item "$logoPath\64x64.png" "$androidResPath\mipmap-hdpi\ic_launcher.png" -Force
Copy-Item "$logoPath\64x64.png" "$androidResPath\mipmap-hdpi\ic_launcher_round.png" -Force

# xhdpi (96x96) - use 128x128
Copy-Item "$logoPath\128x128.png" "$androidResPath\mipmap-xhdpi\ic_launcher.png" -Force
Copy-Item "$logoPath\128x128.png" "$androidResPath\mipmap-xhdpi\ic_launcher_round.png" -Force

# xxhdpi (144x144) - use 128x128 (will be scaled slightly)
Copy-Item "$logoPath\128x128.png" "$androidResPath\mipmap-xxhdpi\ic_launcher.png" -Force
Copy-Item "$logoPath\128x128.png" "$androidResPath\mipmap-xxhdpi\ic_launcher_round.png" -Force

# xxxhdpi (192x192) - use 512x512 (will be scaled down)
Copy-Item "$logoPath\512x512.png" "$androidResPath\mipmap-xxxhdpi\ic_launcher.png" -Force
Copy-Item "$logoPath\512x512.png" "$androidResPath\mipmap-xxxhdpi\ic_launcher_round.png" -Force

Write-Host "Android icons updated!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: For production, you should use properly sized icons:" -ForegroundColor Yellow
Write-Host "  - mipmap-mdpi: 48x48"
Write-Host "  - mipmap-hdpi: 72x72"
Write-Host "  - mipmap-xhdpi: 96x96"
Write-Host "  - mipmap-xxhdpi: 144x144"
Write-Host "  - mipmap-xxxhdpi: 192x192"
Write-Host ""
Write-Host "Run 'npx react-native run-android' to see the new icon."
