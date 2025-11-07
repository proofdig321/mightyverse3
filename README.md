# The-Mighty-Verse-2

A decentralized platform for digital asset creation, management, and distribution with blockchain integration.

## Quick Start

1. **Start the application:**
   ```bash
   ./start.sh
   ```

2. **Access the web interface:**
   - Open http://localhost:3000 in your browser

## Project Structure

- `web/` - Next.js web application
- `agents/` - Python agents for automation
- `contracts/` - Smart contracts (Solidity)
- `docs/` - Documentation and mission files

## Environment Configuration

The project uses environment variables defined in `web/.env.local`. Key configurations include:
- ThirdWeb integration for Web3
- IPFS/Pinata for decentralized storage
- Blockchain contract addresses

## Development

- **Web App:** `cd web && npm run dev`
- **Python Agents:** `cd agents-stubs && python -m uvicorn service.app:app --reload`
- **Tests:** `cd agents-stubs && pytest`

## Features

- Admin dashboard for asset management
- Animator tools and workflows
- RBAC (Role-Based Access Control)
- Blockchain integration
- IPFS storage
- Metadata generation
- Asset review workflows