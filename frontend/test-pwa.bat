@echo off
echo ==========================================
echo  PWA Production Build Test
echo ==========================================
echo.
echo Step 1: Building production app...
call npm run build
echo.
echo Step 2: Starting preview server...
echo.
echo ==========================================
echo  PWA is ready at: http://localhost:4173
echo ==========================================
echo.
echo Open Chrome and go to:
echo   http://localhost:4173
echo.
echo Then click the install icon in address bar
echo.
npm run preview
