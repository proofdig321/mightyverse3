FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy MCP coordinator
COPY mcp_coordinator.py .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/mcp/health || exit 1

# Expose port
EXPOSE 8000

# Start MCP coordinator with uvicorn
CMD ["uvicorn", "mcp_coordinator:app", "--host", "0.0.0.0", "--port", "8000"]