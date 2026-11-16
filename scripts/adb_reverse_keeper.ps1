$deviceId = "SPLUKK25JB006255"
Write-Output "Starting ADB reverse keeper for device $deviceId..."

while ($true) {
    try {
        $devs = adb devices 2>$null
        if ($devs -match $deviceId) {
            $rev = adb -s $deviceId reverse --list 2>$null
            if ($rev -notmatch "5000") {
                adb -s $deviceId reverse tcp:5000 tcp:5000 2>$null
                adb -s $deviceId reverse tcp:3000 tcp:3000 2>$null
                Write-Output "$(Get-Date -Format 'HH:mm:ss'): ADB reverse tunnels active (5000, 3000)"
            }
        }
    } catch {
        # silent retry
    }
    Start-Sleep -Seconds 3
}
