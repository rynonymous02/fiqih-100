@echo off
echo ========================================
echo Starting Family 100 Game Server
echo ========================================
echo.

echo Starting the server...
echo.
echo ========================================
echo Server is running!
echo ========================================
echo.

REM Get IPv4 address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r /c:"IPv4 Address"') do (
    set ip=%%a
    goto :found
)
:found
set ip=%ip: =%

echo Local Access:
echo http://localhost:3000/family    - Panel Admin
echo http://localhost:3000/host      - Panel Host  
echo http://localhost:3000/player    - Tombol Peserta
echo.

echo Network Access:
echo http://%ip%:3000/family         - Panel Admin
echo http://%ip%:3000/host           - Panel Host
echo http://%ip%:3000/player         - Tombol Peserta
echo.

echo ========================================
echo Press Ctrl+C to stop the server
echo ========================================
echo.

npm start
