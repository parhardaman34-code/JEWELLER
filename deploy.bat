@echo off
title Rajput Jewellers - Vercel Deployment
echo =======================================================
echo   Deploying Rajput Jewellers to Vercel (Production)
echo =======================================================
echo.
echo Step 1: Checking authentication...
call npx vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo Opening browser for Vercel login...
    call npx vercel login
)

echo.
echo Step 2: Deploying to Vercel Production...
call npx vercel --prod
echo.
pause
