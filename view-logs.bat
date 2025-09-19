@echo off
echo Viewing browser logs...
echo.
if exist browser-logs.txt (
    type browser-logs.txt
) else (
    echo No logs found. Make sure the log server is running and the app has generated some logs.
)
echo.
pause



