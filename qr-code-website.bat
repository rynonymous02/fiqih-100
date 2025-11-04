@echo off
title Family 100 - Advanced QR Code Generator
color 0A

:menu
cls
echo ========================================
echo    FAMILY 100 - QR CODE GENERATOR
echo ========================================
echo.

REM Get IPv4 address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r /c:"IPv4 Address"') do (
    set ip=%%a
    goto :found
)
:found
set ip=%ip: =%

echo [INFO] IP Address: %ip%
echo [INFO] Port: 3000
echo.

echo ========================================
echo            PILIHAN MENU
echo ========================================
echo.
echo [1] Panel Admin (Family) - Copy URL
echo [2] Panel Host - Copy URL  
echo [3] Tombol Peserta - Copy URL
echo [4] Generate QR Code Langsung
echo [5] Buka Website QR Generator
echo [6] Tampilkan Semua URL
echo [7] Start Server + QR Code
echo [8] Keluar
echo.

set /p choice="Masukkan pilihan (1-8): "

if "%choice%"=="1" goto admin
if "%choice%"=="2" goto host
if "%choice%"=="3" goto player
if "%choice%"=="4" goto qr_direct
if "%choice%"=="5" goto qr_website
if "%choice%"=="6" goto show_all
if "%choice%"=="7" goto start_server
if "%choice%"=="8" goto exit
goto menu

:admin
cls
echo ========================================
echo         PANEL ADMIN (FAMILY)
echo ========================================
echo.
echo URL: http://%ip%:3000/family
echo.
echo http://%ip%:3000/family | clip
echo [SUCCESS] URL telah di-copy ke clipboard!
echo.
echo Apakah ingin membuka QR generator?
set /p qr_choice="(Y/N): "
if /i "%qr_choice%"=="Y" (
    start https://www.qr-code-generator.com/
    echo [INFO] QR generator telah dibuka
)
echo.
pause
goto menu

:host
cls
echo ========================================
echo            PANEL HOST
echo ========================================
echo.
echo URL: http://%ip%:3000/host
echo.
echo http://%ip%:3000/host | clip
echo [SUCCESS] URL telah di-copy ke clipboard!
echo.
echo Apakah ingin membuka QR generator?
set /p qr_choice="(Y/N): "
if /i "%qr_choice%"=="Y" (
    start https://www.qr-code-generator.com/
    echo [INFO] QR generator telah dibuka
)
echo.
pause
goto menu

:player
cls
echo ========================================
echo         TOMBOL PESERTA
echo ========================================
echo.
echo URL: http://%ip%:3000/player
echo.
echo http://%ip%:3000/player | clip
echo [SUCCESS] URL telah di-copy ke clipboard!
echo.
echo Apakah ingin membuka QR generator?
set /p qr_choice="(Y/N): "
if /i "%qr_choice%"=="Y" (
    start https://www.qr-code-generator.com/
    echo [INFO] QR generator telah dibuka
)
echo.
pause
goto menu

:qr_direct
cls
echo ========================================
echo      GENERATE QR CODE LANGSUNG
echo ========================================
echo.
echo Membuka QR code untuk semua panel...
echo.

REM Open QR codes directly using reliable services
start "QR Admin" "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=http://%ip%:3000/family"
timeout /t 1 /nobreak >nul
start "QR Host" "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=http://%ip%:3000/host"
timeout /t 1 /nobreak >nul
start "QR Player" "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=http://%ip%:3000/player"

echo [SUCCESS] QR code telah dibuka di browser!
echo.
echo Cara menggunakan:
echo 1. Tampilkan QR code yang diinginkan di layar
echo 2. Peserta scan dengan aplikasi QR Code Scanner
echo 3. Browser akan terbuka otomatis di device peserta
echo.
pause
goto menu

:qr_website
cls
echo ========================================
echo      WEBSITE QR CODE GENERATOR
echo ========================================
echo.
echo Membuka website QR code generator...
echo.

REM Open multiple QR generator websites
start https://www.qr-code-generator.com/
timeout /t 1 /nobreak >nul
start https://qr-code-generator.com/
timeout /t 1 /nobreak >nul
start https://www.qrcode-monkey.com/

echo [SUCCESS] Website QR generator telah dibuka!
echo.
echo Langkah selanjutnya:
echo 1. Copy URL yang diinginkan dari menu sebelumnya
echo 2. Paste ke salah satu website QR generator
echo 3. Generate dan download QR code
echo.
pause
goto menu

:show_all
cls
echo ========================================
echo         SEMUA URL TERSEDIA
echo ========================================
echo.
echo [LOCAL ACCESS]
echo http://localhost:3000/family    - Panel Admin
echo http://localhost:3000/host      - Panel Host
echo http://localhost:3000/player    - Tombol Peserta
echo.
echo [NETWORK ACCESS]
echo http://%ip%:3000/family         - Panel Admin
echo http://%ip%:3000/host           - Panel Host
echo http://%ip%:3000/player         - Tombol Peserta
echo.
echo [COPY ALL TO CLIPBOARD]
echo.
set /p copy_all="Copy semua URL ke clipboard? (Y/N): "
if /i "%copy_all%"=="Y" (
    (
        echo Panel Admin: http://%ip%:3000/family
        echo Panel Host: http://%ip%:3000/host
        echo Tombol Peserta: http://%ip%:3000/player
    ) | clip
    echo [SUCCESS] Semua URL telah di-copy ke clipboard!
)
echo.
pause
goto menu

:start_server
cls
echo ========================================
echo      START SERVER + QR CODE
echo ========================================
echo.
echo Memulai server dan membuka QR code...
echo.

REM Start server in background
start /min cmd /c "npm start"

echo [INFO] Server sedang dimulai...
timeout /t 5 /nobreak >nul

echo [INFO] Membuka QR code...
start "QR Admin" "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=http://%ip%:3000/family"
timeout /t 1 /nobreak >nul
start "QR Host" "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=http://%ip%:3000/host"
timeout /t 1 /nobreak >nul
start "QR Player" "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=http://%ip%:3000/player"

echo [SUCCESS] Server berjalan dan QR code telah dibuka!
echo.
echo Server berjalan di background.
echo Gunakan Ctrl+Alt+Del untuk menghentikan server jika diperlukan.
echo.
pause
goto menu

:exit
cls
echo ========================================
echo           TERIMA KASIH
echo ========================================
echo.
echo Program selesai.
timeout /t 2 /nobreak >nul
exit
