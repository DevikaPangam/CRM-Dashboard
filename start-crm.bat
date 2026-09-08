@echo off
REM ============================================================
REM  CorpBD CRM — First-Run Setup Script (Windows)
REM  Run this file as Administrator to install Node.js and start CRM
REM ============================================================

echo.
echo  CorpBD CRM — Automated Setup Script
echo  ============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo  [OK] Node.js is already installed.
    node --version
    goto :install_deps
)

echo  Node.js is not found. Installing via winget...
echo.

REM Try winget first (Windows 11 / updated Windows 10)
winget --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo  Using winget to install Node.js LTS...
    winget install -e --id OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
    
    REM Refresh PATH
    call refreshenv.cmd >nul 2>&1
    
    where node >nul 2>&1
    if %ERRORLEVEL% == 0 (
        echo  [OK] Node.js installed successfully.
        node --version
        goto :install_deps
    )
)

echo.
echo  ============================================================
echo  MANUAL INSTALLATION REQUIRED
echo  ============================================================
echo.
echo  Please install Node.js manually:
echo.
echo  1. Open your browser and go to: https://nodejs.org/en/download/
echo  2. Download the "Windows Installer (.msi)" for LTS version
echo  3. Run the installer (keep all defaults, including "Add to PATH")
echo  4. After installation completes, CLOSE AND REOPEN this script
echo.
echo  Or paste this into PowerShell as Administrator:
echo     winget install OpenJS.NodeJS.LTS
echo.
pause
exit /b 1

:install_deps
echo.
echo  Installing CRM dependencies...
echo  (This may take 1-2 minutes on first run)
echo.

cd /d "%~dp0"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] npm install failed. Please check the error above.
    pause
    exit /b 1
)

echo.
echo  [OK] Dependencies installed.
echo.
echo  Setting up database and seeding initial users...
call node db\seed.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Database setup failed. Please check the error above.
    pause
    exit /b 1
)

echo.
echo  ============================================================
echo  SETUP COMPLETE! Starting CRM server...
echo  ============================================================
echo.
echo  Opening browser at: http://localhost:3000
echo.
echo  Default Admin Login:
echo    User ID  : devika.admin
echo    Password : Admin@2026
echo.
echo  Press Ctrl+C to stop the server.
echo  ============================================================
echo.

REM Open browser after 2 seconds
start /b "" cmd /c "timeout /t 2 >nul && start http://localhost:3000"

REM Start the server
node server.js
