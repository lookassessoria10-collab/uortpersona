@echo off
rem Abre a apresentacao no computador: servidor local + navegador.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Para abrir localmente e preciso ter o Node.js instalado: https://nodejs.org
  echo.
  pause
  exit /b
)
start "MAIA - servidor local" node dev-server.mjs
timeout /t 1 >nul
start "" http://localhost:5173
