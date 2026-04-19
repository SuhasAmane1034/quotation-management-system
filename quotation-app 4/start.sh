#!/bin/bash
echo "=========================================="
echo "  QuoteFlow v3.0 - LED Quotation Manager  "
echo "=========================================="

if [ ! -d "server/node_modules" ]; then
  echo "Installing server dependencies..."
  cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
  echo "Installing client dependencies..."
  cd client && npm install && cd ..
fi

echo "Starting backend on port 3001..."
cd server && node index.js &
SERVER_PID=$!
cd ..
sleep 2

echo "Starting frontend on port 3000..."
cd client && npm start &
CLIENT_PID=$!

echo ""
echo "=========================================="
echo " App : http://localhost:3000"
echo " API : http://localhost:3001"
echo " First time? Visit /register to sign up."
echo "=========================================="

trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null" EXIT
wait
