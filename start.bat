@echo off
echo Starting MongoDB...
start "MongoDB" cmd /k "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "C:\data\db"

timeout /nobreak /t 3 >nul

echo Starting Backend...
start "Backend" cmd /k "cd server && npm start"

timeout /nobreak /t 3 >nul

echo Starting Frontend...
start "Frontend" cmd /k "npm run dev"

echo All services started! Open http://localhost:5173