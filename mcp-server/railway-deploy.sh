#!/bin/bash
# Railway MCP Server Deployment Script
# This ensures Python deployment without npm interference

echo "Starting MCP Coordinator..."
exec uvicorn mcp_coordinator:app --host 0.0.0.0 --port ${PORT:-8000}