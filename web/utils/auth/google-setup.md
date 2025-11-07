# Google OAuth Setup Guide

To enable Google Sign-In with ThirdWeb:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized origins:
   - http://localhost:3000 (for development)
   - https://themightyverse.vercel.app (for production)
7. Add authorized redirect URIs:
   - http://localhost:3000/auth/callback
   - https://themightyverse.vercel.app/auth/callback
8. Copy the Client ID and update NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local

The current setup supports:
- Google Sign-In (creates embedded wallet)
- MetaMask (if installed)
- WalletConnect (for mobile wallets)
- Solana wallets (for testnet features)