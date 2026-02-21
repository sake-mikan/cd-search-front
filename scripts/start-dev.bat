@echo off
setlocal

set "FRONT_DIR=%~dp0.."
set "API_DIR=%~dp0..\..\cd-search"

if not exist "%API_DIR%\artisan" (
  echo [ERROR] Laravel project not found: "%API_DIR%"
  echo Check folder layout: cd-search-front and cd-search should be sibling directories.
  exit /b 1
)

start "CD Search API (Laravel)" cmd /k "cd /d ""%API_DIR%"" && php artisan serve"
start "CD Search Front (React)" cmd /k "cd /d ""%FRONT_DIR%"" && npm run dev"

echo Started:
echo - Laravel API : php artisan serve
echo - React Front : npm run dev
echo.
echo Use Ctrl+C in each opened window to stop servers.

endlocal
