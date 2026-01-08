@echo off
echo Mia Coffee Guncelleme Baslatiliyor...
echo.
cd /d "%~dp0"
echo Klasor: %cd%
echo.
echo Lutfen Bekleyin, Vercel yukleniyor (npm hatasi bypass ediliyor)...
powershell -Command "npx --yes vercel@latest --prod --confirm"
echo.
if %errorlevel% neq 0 (
    echo.
    echo Bir hata olustu. Lutfen su komutu manuel denemeyi unutmayin:
    echo npx vercel --prod
) else (
    echo.
    echo TEBRIKLER! Mia Coffee basariyla guncellendi.
    echo Adres: https://nisa-five.vercel.app
)
pause
