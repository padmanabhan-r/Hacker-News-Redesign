#!/bin/bash

PORT=3000

# Kill anything on port 3000
PID=$(lsof -ti tcp:$PORT)
if [ -n "$PID" ]; then
  echo "Killing process on port $PORT (PID $PID)"
  kill -9 $PID
fi

pnpm dev
