@echo off
title Rajput Jewellers - Push to GitHub
echo =======================================================
echo   Rajput Jewellers - GitHub Setup and Push
echo =======================================================
echo.
git remote -v
echo.
set /p REPO="Enter your GitHub Repository URL (e.g. https://github.com/USERNAME/REPO.git): "
if "%REPO%"=="" (
    echo No repository URL entered. Exiting...
    pause
    exit /b 1
)

echo.
echo Setting remote origin to %REPO%...
git remote remove origin >nul 2>&1
git remote add origin %REPO%
git branch -M main

echo.
echo Pushing code to GitHub (main branch)...
git push -u origin main

echo.
echo =======================================================
echo   Push complete!
echo =======================================================
pause
