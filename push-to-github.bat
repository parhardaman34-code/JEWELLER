@echo off
title Rajput Jewellers - Push to GitHub
echo =======================================================
echo   Rajput Jewellers - GitHub Push to parhardaman34-code
echo =======================================================
echo.
echo Target Repository: https://github.com/parhardaman34-code/JEWELLER.git
echo.

git remote remove origin >nul 2>&1
git remote add origin https://github.com/parhardaman34-code/JEWELLER.git
git branch -M main

echo Step 1: Connecting to GitHub...
echo.
echo Step 2: Pushing clean repository (with all 210 animation frames)...
echo (If a browser window appears, click 'Authorize Git' to allow the push)
echo.

git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo =======================================================
    echo   SUCCESS! Pushed cleanly to GitHub!
    echo   Vercel is now automatically deploying your website.
    echo   Check your Vercel dashboard in 30 seconds!
    echo =======================================================
) else (
    echo.
    echo PUSH FAILED. Please ensure you are logged into GitHub in your browser.
)

echo.
pause
