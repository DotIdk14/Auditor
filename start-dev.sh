#!/bin/bash
# Inicia servidor y frontend del visor
cd /home/idk/Auditor

# Matar procesos previos
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti:5174 2>/dev/null | xargs kill -9 2>/dev/null
sleep 1

# Iniciar servidor
cd apps/server && nohup npx tsx server.ts > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Iniciar frontend visor
cd /home/idk/Auditor/apps/visor && nohup npx vite --port=5174 --host=0.0.0.0 > /tmp/visor.log 2>&1 &
VISOR_PID=$!
echo "Visor PID: $VISOR_PID"

echo "Server log: /tmp/server.log"
echo "Visor log: /tmp/visor.log"
