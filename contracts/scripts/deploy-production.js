const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Mighty Verse contracts to production...");

  // Deploy MightyVerseAssets NFT contract
  const MightyVerseAssets = await ethers.getContractFactory("MightyVerseAssets");
  const assets = await MightyVerseAssets.deploy();
  await assets.deployed();
  console.log("✅ MightyVerseAssets deployed to:", assets.address);

  // Deploy CreditToken contract
  const CreditToken = await ethers.getContractFactory("CreditToken");
  const credits = await CreditToken.deploy();
  await credits.deployed();
  console.log("✅ CreditToken deployed to:", credits.address);

  // Deploy ApprovalRegistry contract
  const ApprovalRegistry = await ethers.getContractFactory("ApprovalRegistry");
  const registry = await ApprovalRegistry.deploy(assets.address);
  await registry.deployed();
  console.log("✅ ApprovalRegistry deployed to:", registry.address);

  // Set up contract relationships
  await assets.setApprovalRegistry(registry.address);
  console.log("✅ Contract relationships configured");

  console.log("\n🎯 Deployment Summary:");
  console.log("MightyVerseAssets:", assets.address);
  console.log("CreditToken:", credits.address);
  console.log("ApprovalRegistry:", registry.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });