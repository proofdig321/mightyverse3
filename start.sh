#!/bin/bash

echo "Starting The Mighty Verse..."

# Start the web application
cd web
npm run dev &
WEB_PID=$!

echo "Web application started on http://localhost:3000"
echo "Web PID: $WEB_PID"

# Keep the script running
wait $WEB_PID