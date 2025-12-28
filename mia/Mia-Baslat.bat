@echo off
title Mia Coffee Guvenli Sunucu
echo ------------------------------------------
echo    MIA COFFEE GUVENLIK SISTEMI ACILIYOR
echo ------------------------------------------
echo.
echo [1/2] Tarayici Aciliyor (Edge)...
start microsoft-edge:http://localhost:3000
echo [2/2] Guvenlik Motoru Baslatiliyor...
echo.
node server.js
pause
