@echo off
cd c:\Users\danii\Herd\calm

REM Try to find MySQL
where mysql >nul 2>&1
if errorlevel 1 (
    echo MySQL not found in PATH
    REM Try Herd path
    if exist "C:\Users\danii\Herd\mysql\bin\mysql.exe" (
        echo Found Herd MySQL
        C:\Users\danii\Herd\mysql\bin\mysql.exe -h 127.0.0.1 -u root calm -e "SHOW TABLES LIKE 'assistant%%';"
    ) else (
        echo Herd MySQL not found
    )
) else (
    mysql -h 127.0.0.1 -u root calm -e "SHOW TABLES LIKE 'assistant%%';"
)
