@echo off
echo Starting log server...
echo Installing dependencies...
npm install --prefix . express cors
echo Starting server...
node log-server.js
pause



