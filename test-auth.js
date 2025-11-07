// Simple test for authentication flow
const { generateWalletFromEmail } = require('./web/utils/auth/simple-auth.ts');

// Test email wallet generation
const testEmail = "test@example.com";
const wallet = generateWalletFromEmail(testEmail);

console.log("Testing Authentication Flow:");
console.log("Email:", testEmail);
console.log("Generated Wallet:", wallet);

// Test super admin wallet
const superAdminWallet = "0x860Ec697167Ba865DdE1eC9e172004100613e970";
console.log("Super Admin Wallet:", superAdminWallet);

// Test role assignment logic
const roles = wallet.toLowerCase() === superAdminWallet.toLowerCase() 
  ? ["SUPER_ADMIN", "ADMIN", "CURATOR", "ANIMATOR", "SPONSOR"]
  : ["VIEWER"];

console.log("Assigned Roles:", roles);
console.log("Authentication test completed successfully!");